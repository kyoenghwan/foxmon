import { supabase } from '../../../../lib/supabase';
import { nvLog } from '../../../../lib/logger';

export async function OA_DELETE_SEEKER_AD(input: { adId: string; userId: string }): Promise<{ success: boolean; error?: string }> {
  nvLog('AT', '▶️ OA_DELETE_SEEKER_AD 시작', input);

  try {
    const { error } = await supabase
      .from('seeker_ads')
      .delete()
      .eq('id', input.adId)
      .eq('user_id', input.userId); // 보안상 user_id 확인 필수

    if (error) {
       nvLog('AT', '⚠️ OA_DELETE_SEEKER_AD 에러', error.message);
       return { success: false, error: error.message };
    }

    nvLog('AT', '✅ OA_DELETE_SEEKER_AD 성공');
    return { success: true };

  } catch (error: any) {
    nvLog('AT', '❌ OA_DELETE_SEEKER_AD 실패', error.message);
    return { success: false, error: error.message }; 
  }
}
