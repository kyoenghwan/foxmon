import { supabase } from '../../../../lib/supabase';
import { nvLog } from '../../../../lib/logger';

export interface ResumeData {
  id?: string;
  user_id: string;
  title: string;
  nickname?: string;
  gender?: 'M' | 'F';
  contact_number?: string;
  is_contact_public?: boolean;
  sns_type?: string;
  sns_id?: string;
  desired_location?: string;
  desired_industry?: string;
  desired_pay_type?: string;
  desired_pay_amount?: number;
  contact_time?: string;
  is_anytime_contact?: boolean;
  photo_url?: string;
  self_introduction?: string;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function OA_UPSERT_RESUME(input: ResumeData): Promise<{ success: boolean; data?: any; error?: string; rollbackData?: any }> {
  nvLog('AT', '▶️ OA_UPSERT_RESUME 시작', { userId: input.user_id, title: input.title });

  try {
    const payload = {
      ...input,
      updated_at: new Date().toISOString()
    };
    
    // If no ID is provided, it's a new insert so set created_at
    if (!input.id) {
       (payload as any).created_at = new Date().toISOString();
    }

    const query = supabase.from('resumes');
    let dbResponse;
    
    if (input.id) {
        // Update existing
        dbResponse = await query.update(payload).eq('id', input.id).select();
    } else {
        // Insert new
        dbResponse = await query.insert(payload).select();
    }

    const { data, error } = dbResponse;

    if (error) {
       nvLog('AT', '⚠️ OA_UPSERT_RESUME 로컬 테스트 에러', error.message);
       return { success: false, error: error.message };
    }

    nvLog('AT', '✅ OA_UPSERT_RESUME 성공', data);
    return { success: true, data: data?.[0], rollbackData: input.id ? { id: input.id } : null }; // rollback data for delete logic if it was new

  } catch (error: any) {
    nvLog('AT', '❌ OA_UPSERT_RESUME 실패', error.message);
    return { success: false, error: error.message }; 
  }
}
