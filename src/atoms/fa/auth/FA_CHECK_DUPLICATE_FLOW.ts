import { nvLog } from '@/lib/logger';
import { RA_VALIDATE_LOGIN_ID } from '@/src/atoms/ra/auth/RA_LOGIN_ID';
import { QA_CHECK_ID_NICKNAME_EXISTS } from '../../qa/auth/QA_CHECK_ID_NICKNAME_EXISTS';

export async function FA_CHECK_DUPLICATE_FLOW(input: { loginId?: string; nickname?: string }) {
  nvLog('AT', '▶️ FA_CHECK_DUPLICATE_FLOW 시작', input);

  try {
    let loginId = input.loginId;
    if (loginId) {
      const idCheck = RA_VALIDATE_LOGIN_ID(loginId);
      if (!idCheck.isValid) {
        return {
          success: false,
          message: idCheck.error || '사용할 수 없는 아이디입니다.',
          duplicateType: 'ID' as const,
        };
      }
      loginId = idCheck.normalized;
    }

    const existsCheck = await QA_CHECK_ID_NICKNAME_EXISTS({
      loginId,
      nickname: input.nickname,
    });

    if (!existsCheck.success) {
      return { success: false, message: '중복 확인 중 오류가 발생했습니다.' };
    }

    if (existsCheck.data?.idExists) {
      return { success: false, message: '이미 사용 중인 아이디입니다.', duplicateType: 'ID' };
    }

    if (existsCheck.data?.nicknameExists) {
      return { success: false, message: '이미 사용 중인 닉네임입니다.', duplicateType: 'NICKNAME' };
    }

    nvLog('AT', '✅ FA_CHECK_DUPLICATE_FLOW 완료: 중복 없음');
    return { success: true, message: '사용 가능한 정보입니다.' };
  } catch (error) {
    nvLog('AT', '❌ FA_CHECK_DUPLICATE_FLOW 실패', error);
    return { success: false, message: '중복 검사에 실패했습니다.' };
  }
}
