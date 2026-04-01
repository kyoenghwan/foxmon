import { supabase } from '../../../../lib/supabase';
import { nvLog } from '../../../../lib/logger';

export async function QA_GET_USER_RESUMES(userId: string) {
  nvLog('AT', '▶️ QA_GET_USER_RESUMES 시작', { userId });
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
       // if table doesn't exist, we just return empty array for frontend demo purpose
       nvLog('AT', '⚠️ QA_GET_USER_RESUMES 에러 (테이블 없음 등)', error.message);
       return { success: true, data: [] };
    }

    nvLog('AT', '✅ QA_GET_USER_RESUMES 완료', { fetchCount: data.length });
    return { success: true, data };
  } catch (err: any) {
    nvLog('AT', '❌ QA_GET_USER_RESUMES 실패', err.message);
    return { success: true, data: [] }; // fail gracefully for UI to show empty list
  }
}
