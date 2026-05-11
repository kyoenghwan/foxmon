import { supabase } from '../../../../lib/supabase';
import { nvLog } from '../../../../lib/logger';

export interface SeekerAdInput {
  id?: string;
  user_id: string;
  resume_id: string;
  ad_title: string;
  status?: string;
}

export async function OA_UPSERT_SEEKER_AD(input: SeekerAdInput): Promise<{ success: boolean; data?: any; error?: string }> {
  nvLog('AT', '▶️ OA_UPSERT_SEEKER_AD 시작', { userId: input.user_id, adTitle: input.ad_title });

  try {
    const payload: any = {
      user_id: input.user_id,
      resume_id: input.resume_id,
      ad_title: input.ad_title,
      updated_at: new Date().toISOString()
    };
    
    if (input.status) {
      payload.status = input.status;
    }

    if (!input.id) {
       payload.created_at = new Date().toISOString();
    }

    const query = supabase.from('seeker_ads');
    let dbResponse;
    
    if (input.id) {
        dbResponse = await query.update(payload).eq('id', input.id).select();
    } else {
        dbResponse = await query.insert(payload).select();
    }

    const { data, error } = dbResponse;

    if (error) {
       nvLog('AT', '⚠️ OA_UPSERT_SEEKER_AD 로컬 테스트 에러', error.message);
       return { success: false, error: error.message };
    }

    nvLog('AT', '✅ OA_UPSERT_SEEKER_AD 성공', data);
    return { success: true, data: data?.[0] };

  } catch (error: any) {
    nvLog('AT', '❌ OA_UPSERT_SEEKER_AD 실패', error.message);
    return { success: false, error: error.message }; 
  }
}
