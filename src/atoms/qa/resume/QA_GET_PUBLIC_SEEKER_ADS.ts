import { supabaseAdmin } from '../../../../lib/supabase';
import { nvLog } from '../../../../lib/logger';

export async function QA_GET_PUBLIC_SEEKER_ADS(): Promise<{ success: boolean; data: any[] | null; error: string | null }> {
  nvLog('AT', '▶️ QA_GET_PUBLIC_SEEKER_ADS 시작');
  try {
    const { data, error } = await supabaseAdmin
      .from('seeker_ads')
      .select(`
        id,
        ad_title,
        status,
        created_at,
        updated_at,
        user_id,
        resumes (
            title,
            gender,
            desired_location,
            nickname,
            photo_url,
            desired_industry,
            desired_pay_type,
            desired_pay_amount
        ),
        users:user_id (
            birth_date
        )
      `)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (error) {
       nvLog('AT', '⚠️ QA_GET_PUBLIC_SEEKER_ADS 에러', error.message);
       return { success: false, data: null, error: error.message };
    }

    nvLog('AT', '✅ QA_GET_PUBLIC_SEEKER_ADS 완료', { fetchCount: data?.length || 0 });
    return { success: true, data: data as any, error: null };
  } catch (err: any) {
    nvLog('AT', '❌ QA_GET_PUBLIC_SEEKER_ADS 실패', err.message);
    return { success: false, data: null, error: err.message };
  }
}
