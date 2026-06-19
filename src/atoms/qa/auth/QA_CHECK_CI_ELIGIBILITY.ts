import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import type { AtomErrorCode } from '../../da/common/DA_COMMON_ERROR_TYPES';

export type CIEligibilityResult = {
  exists: boolean;
  isEligible: boolean;
  signupCount: number;
};

export async function QA_CHECK_CI_ELIGIBILITY(input: {
  ci: string;
}): Promise<{
  success: boolean;
  data?: CIEligibilityResult;
  message?: string;
  errorCode?: AtomErrorCode;
}> {
  nvLog('AT', '▶️ QA_CHECK_CI_ELIGIBILITY 시작', { ci: input.ci ? '***' : null });

  if (!input.ci) {
    return {
      success: true,
      data: { exists: false, isEligible: true, signupCount: 0 }
    };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('user_ci_history_logs')
      .select('ci, signup_count, is_eligible_for_referral_points')
      .eq('ci', input.ci)
      .maybeSingle();

    if (error) {
      nvLog('AT', '❌ QA_CHECK_CI_ELIGIBILITY 에러', error);
      return { success: false, errorCode: 'INTERNAL_ERROR', message: 'CI 이력 조회 중 오류가 발생했습니다.' };
    }

    if (!data) {
      // 이력이 없으므로 최초 가입 대상자
      return {
        success: true,
        data: { exists: false, isEligible: true, signupCount: 0 }
      };
    }

    return {
      success: true,
      data: {
        exists: true,
        isEligible: data.is_eligible_for_referral_points,
        signupCount: data.signup_count
      }
    };
  } catch (err: any) {
    nvLog('AT', '❌ QA_CHECK_CI_ELIGIBILITY 예외', err);
    return { success: false, errorCode: 'INTERNAL_ERROR', message: err.message || '시스템 오류가 발생했습니다.' };
  }
}
