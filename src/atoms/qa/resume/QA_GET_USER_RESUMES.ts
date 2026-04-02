import { supabase } from '../../../../lib/supabase';
import { nvLog } from '../../../../lib/logger';

export async function QA_GET_USER_RESUMES(userId: string): Promise<{ success: boolean; data: any[] | null; error: string | null }> {
  nvLog('AT', '▶️ QA_GET_USER_RESUMES 시작', { userId });
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
       nvLog('AT', '⚠️ QA_GET_USER_RESUMES 에러', error.message);
       return { success: false, data: null, error: error.message };
    }

    nvLog('AT', '✅ QA_GET_USER_RESUMES 완료', { fetchCount: data.length });
    return { success: true, data: data, error: null };
  } catch (err: any) {
    nvLog('AT', '❌ QA_GET_USER_RESUMES 실패', err.message);
    return { success: false, data: null, error: err.message };
  }
}
