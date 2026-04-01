import { RA_VALIDATE_LOGIN } from '@/src/atoms/ra/auth/RA_VALIDATE_LOGIN';
import { QA_GET_USER_AUTH } from '@/src/atoms/qa/auth/QA_GET_USER_AUTH';
import { RA_VERIFY_PASSWORD } from '@/src/atoms/ra/auth/RA_VERIFY_PASSWORD';
import { nvLog } from '../../../../lib/logger';

/**
 * FA_LOGIN_FLOW: 로그인 유효성 검사 및 인증 결과 반환
 * Domain: Auth
 * Type: Flow Atom (Coordinator)
 */
export const FA_LOGIN_FLOW = async (input: { loginId?: string; password?: string }) => {
  nvLog('AT', '▶️ FA_LOGIN_FLOW 시작', { loginId: input.loginId });

  try {
    // Step 1: 입력값 검증 (단순 검증으로 대체 또는 RA_VALIDATE_LOGIN 수정 필요)
    if (!input.loginId || !input.password) {
      return { success: false, message: '아이디와 비밀번호를 입력해주세요.' };
    }

    // Step 2: 사용자 조회
    const authResult = await QA_GET_USER_AUTH({ loginId: input.loginId });
    if (!authResult.success || !authResult.data) {
      return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
    }

    // Step 3: 비밀번호 검증
    const passwordMatch = await RA_VERIFY_PASSWORD({
      password: input.password,
      hashedPassword: authResult.data.password,
    });

    if (!passwordMatch.isMatch) {
      return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
    }

    nvLog('AT', '✅ FA_LOGIN_FLOW 성공', { userId: authResult.data.id });
    return {
      success: true,
      data: {
        userId: authResult.data.id,
        loginId: authResult.data.login_id,
        email: authResult.data.email,
        is_age_verified: authResult.data.is_age_verified,
        role: authResult.data.role,
        business_number: authResult.data.business_number,
        nickname: authResult.data.nickname,
      },
      message: '로그인 성공',
    };
  } catch (error: any) {
    nvLog('AT', '❌ FA_LOGIN_FLOW 시스템 에러', error);
    return { success: false, message: '시스템 오류가 발생했습니다.' };
  }
};
