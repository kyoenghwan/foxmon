import { supabase } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

/**
 * OA_UPDATE_AGE_VERIFIED: 사용자의 성인 인증 상태를 완료로 업데이트합니다.
 * Domain: Auth
 * Type: Operation Atom (Side-effect)
 */
export const OA_UPDATE_AGE_VERIFIED = async (input: { userId: string }) => {
  nvLog('AT', '▶️ OA_UPDATE_AGE_VERIFIED 시작', input);

  try {
    const { error } = await supabase
      .from('users')
      .update({
        is_age_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('id', input.userId);

    if (error) {
      nvLog('AT', '❌ OA_UPDATE_AGE_VERIFIED 에러', error);
      return { success: false, error: error.message };
    }

    nvLog('AT', '✅ OA_UPDATE_AGE_VERIFIED 성공');
    return { success: true, error: null };
  } catch (error: any) {
    nvLog('AT', '❌ OA_UPDATE_AGE_VERIFIED 시스템 에러', error);
    return { success: false, error: error.message };
  }
};
