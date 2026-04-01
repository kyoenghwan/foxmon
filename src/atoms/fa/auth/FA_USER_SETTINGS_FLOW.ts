import { nvLog } from '../../../../lib/logger';
import { RA_VALIDATE_USER_SETTINGS } from '../../ra/auth/RA_VALIDATE_USER_SETTINGS';
import { QA_GET_USER_AUTH_BY_ID } from '../../qa/auth/QA_GET_USER_AUTH_BY_ID';
import { QA_GET_USER_PROFILE } from '../../qa/auth/QA_GET_USER_PROFILE';
import { QA_CHECK_ID_NICKNAME_EXISTS } from '../../qa/auth/QA_CHECK_ID_NICKNAME_EXISTS';
import { RA_COMPARE_AND_HASH } from '../../ra/auth/RA_COMPARE_AND_HASH';
import { OA_UPDATE_USER_PROFILE, UpdateUserProfileInput } from '../../oa/auth/OA_UPDATE_USER_PROFILE';
import { OA_CHANGE_PASSWORD } from '../../oa/auth/OA_CHANGE_PASSWORD';

type SettingsActionType = 'GET_PROFILE' | 'UPDATE_PROFILE' | 'CHANGE_PASSWORD';

export interface UserSettingsFlowInput {
    actionType: SettingsActionType;
    userId: string;
    
    // UPDATE_PROFILE 용
    profileData?: Omit<UpdateUserProfileInput, 'userId'> & { currentNickname?: string };
    
    // CHANGE_PASSWORD 용
    passwordData?: {
        currentPassword?: string;
        newPassword?: string;
    };
}

export async function FA_USER_SETTINGS_FLOW(input: UserSettingsFlowInput) {
    nvLog('AT', `▶️ FA_USER_SETTINGS_FLOW [${input.actionType}] 시작`, { userId: input.userId });

    try {
        switch (input.actionType) {
            case 'GET_PROFILE': {
                const profileResult = await QA_GET_USER_PROFILE(input.userId);
                return { 
                    success: profileResult.success, 
                    data: profileResult.data,
                    message: profileResult.success ? '조회 성공' : '조회 실패' 
                };
            }

            case 'UPDATE_PROFILE': {
                if (!input.profileData) return { success: false, message: '프로필 데이터가 없습니다.' };
                
                // 1. 닉네임 유효성 검사 (RA 재사용)
                const validationResult = RA_VALIDATE_USER_SETTINGS({
                    nickname: input.profileData.nickname,
                    phoneNumber: input.profileData.phoneNumber,
                });

                if (!validationResult.isValid && validationResult.error && !validationResult.error.includes('비밀번호')) {
                    return { success: false, message: validationResult.error };
                }

                // 2. 닉네임 변경 시 중복 검사
                if (input.profileData.nickname && input.profileData.nickname !== input.profileData.currentNickname) {
                    const existsCheck = await QA_CHECK_ID_NICKNAME_EXISTS({ nickname: input.profileData.nickname });
                    if (existsCheck.nicknameExists) {
                        return { success: false, message: '이미 사용 중인 닉네임입니다.' };
                    }
                }

                // 3. 업데이트 수행
                const updatePayload: UpdateUserProfileInput = {
                    userId: input.userId,
                    nickname: input.profileData.nickname === input.profileData.currentNickname ? undefined : input.profileData.nickname,
                    email: input.profileData.email,
                    phoneNumber: input.profileData.phoneNumber,
                    profile_image_url: input.profileData.profile_image_url,
                    sns_kakao: input.profileData.sns_kakao,
                    sns_instagram: input.profileData.sns_instagram,
                    sns_telegram: input.profileData.sns_telegram,
                    sns_x: input.profileData.sns_x,
                };

                const updateResult = await OA_UPDATE_USER_PROFILE(updatePayload);
                if (!updateResult.success) {
                    return { success: false, message: updateResult.error || '프로필 업데이트 중 오류가 발생했습니다.' };
                }

                nvLog('AT', '✅ FA_USER_SETTINGS_FLOW [UPDATE_PROFILE] 성공');
                return { success: true, message: '회원정보가 성공적으로 수정되었습니다.' };
            }

            case 'CHANGE_PASSWORD': {
                if (!input.passwordData?.currentPassword || !input.passwordData?.newPassword) {
                    return { success: false, message: '현재 비밀번호와 새 비밀번호를 모두 입력해야 합니다.' };
                }

                // 1. 기존 비밀번호 가져오기
                const authCheckResult = await QA_GET_USER_AUTH_BY_ID({ userId: input.userId });
                if (!authCheckResult.success || !authCheckResult.data) {
                    return { success: false, message: '사용자 인증 정보를 찾을 수 없습니다.' };
                }

                // 2. 비밀번호 비교 & 해싱
                const hashResult = await RA_COMPARE_AND_HASH({
                    dbPassword: authCheckResult.data.password,
                    currentPassword: input.passwordData.currentPassword,
                    newPassword: input.passwordData.newPassword,
                    isPasswordChange: true
                });

                if (!hashResult.isValid) {
                    return { success: false, message: hashResult.error };
                }

                // 3. 패스워드 교체
                const changePwResult = await OA_CHANGE_PASSWORD({
                    userId: input.userId,
                    hashedPassword: hashResult.data?.hashedPassword
                });

                if (!changePwResult.success) {
                    return { success: false, message: changePwResult.error || '비밀번호 변경 중 오류가 발생했습니다.' };
                }

                nvLog('AT', '✅ FA_USER_SETTINGS_FLOW [CHANGE_PASSWORD] 성공');
                return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' };
            }

            default:
                return { success: false, message: '유효하지 않은 Action Type 입니다.' };
        }

    } catch (error: any) {
        nvLog('AT', `❌ FA_USER_SETTINGS_FLOW 시스템 에러`, error.message);
        return { success: false, message: '시스템 오류가 발생했습니다.' };
    }
}
