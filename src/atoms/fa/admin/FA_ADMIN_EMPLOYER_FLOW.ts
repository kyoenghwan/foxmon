import { nvLog } from '../../../../lib/logger';
import { QA_GET_EMPLOYER_LIST } from '../../qa/admin/QA_GET_EMPLOYER_LIST';
import { OA_TOGGLE_BUSINESS_VERIFY } from '../../oa/admin/OA_TOGGLE_BUSINESS_VERIFY';

export interface AdminEmployerFlowInput {
    actionType: 'GET_LIST' | 'TOGGLE_VERIFY' | 'GIVE_POINTS' | 'GET_POINT_HISTORY' | 'UPDATE_PROFILE';
    adminId: string;
    targetUserId?: string;
    isVerified?: boolean;
    paidPointsDiff?: number;
    bonusPointsDiff?: number;
    description?: string;
    profileData?: {
        verified_business_name: string;
        verified_ceo_name: string;
        business_registration_number: string;
        email: string;
        nickname: string;
        merchant_tier: 'NORMAL' | 'VIP' | 'VVIP' | 'VVVIP';
    };
}

export async function FA_ADMIN_EMPLOYER_FLOW(input: AdminEmployerFlowInput) {
    nvLog('AT', `▶️ FA_ADMIN_EMPLOYER_FLOW [${input.actionType}] 시작`, { adminId: input.adminId });

    try {
        switch (input.actionType) {
            case 'GET_LIST': {
                const result = await QA_GET_EMPLOYER_LIST();
                return result;
            }
            case 'GET_POINT_HISTORY': {
                if (!input.targetUserId) return { success: false, message: '유저 ID 누락' };
                const { QA_GET_USER_POINT_HISTORY } = await import('../../qa/admin/QA_GET_USER_POINT_HISTORY');
                return await QA_GET_USER_POINT_HISTORY(input.targetUserId);
            }
            case 'TOGGLE_VERIFY': {
                if (!input.targetUserId || input.isVerified === undefined) {
                    return { success: false, message: '필수 파라미터 누락' };
                }
                const result = await OA_TOGGLE_BUSINESS_VERIFY({
                    userId: input.targetUserId,
                    isVerified: input.isVerified
                });
                return result;
            }
            case 'GIVE_POINTS': {
                if (!input.targetUserId || input.paidPointsDiff === undefined || input.bonusPointsDiff === undefined || !input.description) {
                    return { success: false, message: '필수 파라미터 누락' };
                }
                const { OA_ADMIN_GIVE_POINTS } = await import('../../oa/admin/OA_ADMIN_GIVE_POINTS');
                const result = await OA_ADMIN_GIVE_POINTS({
                    userId: input.targetUserId,
                    paidPointsDiff: input.paidPointsDiff,
                    bonusPointsDiff: input.bonusPointsDiff,
                    description: input.description,
                    adminId: input.adminId
                });
                return result;
            }
            case 'UPDATE_PROFILE': {
                if (!input.targetUserId || !input.profileData) {
                    return { success: false, message: '필수 파라미터 누락' };
                }
                const { OA_ADMIN_UPDATE_EMPLOYER_PROFILE } = await import('../../oa/admin/OA_ADMIN_UPDATE_EMPLOYER_PROFILE');
                const result = await OA_ADMIN_UPDATE_EMPLOYER_PROFILE({
                    targetUserId: input.targetUserId,
                    ...input.profileData
                });
                return result;
            }
            default:
                return { success: false, message: '유효하지 않은 Action Type 입니다.' };
        }
    } catch (error: any) {
        nvLog('AT', `❌ FA_ADMIN_EMPLOYER_FLOW 시스템 에러`, error.message);
        return { success: false, message: '시스템 오류가 발생했습니다.' };
    }
}
