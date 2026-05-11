import { supabaseAdmin } from '../../../../lib/supabase';
import { nvLog } from '../../../../lib/logger';

export interface SeekerAdData {
  id: string;
  user_id: string;
  resume_id: string;
  ad_title: string;
  status: string;
  created_at: string;
  updated_at: string;
  // joined data
  resumes?: any;
}

export async function QA_GET_USER_SEEKER_ADS(userId: string): Promise<{ success: boolean; data: SeekerAdData[] | null; error: string | null }> {
  nvLog('AT', '▶️ QA_GET_USER_SEEKER_ADS 시작', { userId });
  try {
    const { data, error } = await supabaseAdmin
      .from('seeker_ads')
      .select('*, resumes(title, gender)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
       nvLog('AT', '⚠️ QA_GET_USER_SEEKER_ADS 에러', error.message);
       return { success: false, data: null, error: error.message };
    }

    nvLog('AT', '✅ QA_GET_USER_SEEKER_ADS 완료', { fetchCount: data.length });
    return { success: true, data: data as any, error: null };
  } catch (err: any) {
    nvLog('AT', '❌ QA_GET_USER_SEEKER_ADS 실패', err.message);
    return { success: false, data: null, error: err.message };
  }
}
