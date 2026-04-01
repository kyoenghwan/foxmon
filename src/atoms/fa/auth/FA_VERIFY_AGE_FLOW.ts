import { OA_UPDATE_AGE_VERIFIED } from '@/src/atoms/oa/auth/OA_UPDATE_AGE_VERIFIED';
import { nvLog } from '../../../../lib/logger';

/**
 * FA_VERIFY_AGE_FLOW: 사용자의 본인 인증(성인 인증) 결과를 처리하고 DB에 반영합니다.
 * Domain: Auth
 * Type: Flow Atom (Coordinator)
 */
export const FA_VERIFY_AGE_FLOW = async (input: { userId: string; verificationToken: string }) => {
  nvLog('AT', '▶️ FA_VERIFY_AGE_FLOW 시작', input);

  try {
    // Step 1: 외부 인증 데이터 검증 (Mock)
    // 실제 운영 시 외부 모듈 연동 RA 호출
    if (!input.verificationToken) {
      return { success: false, error: '인증 토큰이 유효하지 않습니다.' };
    }

    // Step 2: 인증 상태 업데이트
    const updateResult = await OA_UPDATE_AGE_VERIFIED({ userId: input.userId });
    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }

    nvLog('AT', '✅ FA_VERIFY_AGE_FLOW 성공');
    return { success: true, error: null };
  } catch (error: any) {
    nvLog('AT', '❌ FA_VERIFY_AGE_FLOW 시스템 에러', error);
    return { success: false, error: '시스템 오류가 발생했습니다.' };
  }
};
