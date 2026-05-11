import { supabaseAdmin } from '../../../../lib/supabase';
import { nvLog } from '../../../../lib/logger';

export async function QA_GET_SEEKER_AD_BY_ID(id: string): Promise<{ success: boolean; data: any | null; error: string | null }> {
  nvLog('AT', `▶️ QA_GET_SEEKER_AD_BY_ID 시작 (ID: ${id})`);
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
            birth_year,
            desired_location,
            nickname,
            photo_url,
            desired_industry,
            desired_pay_type,
            desired_pay_amount,
            self_introduction,
            keywords,
            contact_time,
            is_anytime_contact,
            contact_number,
            is_contact_public,
            sns_type,
            sns_id
        ),
        users:user_id (
            name,
            birth_date
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      nvLog('ER', 'QA_GET_SEEKER_AD_BY_ID 에러:', error);
      return { success: false, data: null, error: error.message };
    }

    nvLog('AT', `✅ QA_GET_SEEKER_AD_BY_ID 성공: ${id}`);
    return { success: true, data, error: null };
  } catch (error: any) {
    nvLog('ER', 'QA_GET_SEEKER_AD_BY_ID 예외 발생:', error);
    return { success: false, data: null, error: error.message };
  }
}
