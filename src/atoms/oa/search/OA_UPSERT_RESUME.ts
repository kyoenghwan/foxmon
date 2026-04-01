import { supabase } from '../../../../lib/supabase';
import { nvLog } from '../../../../lib/logger';

interface UpsertResumeParams {
  userId: string;
  title: string;
  experience?: string;
  introduction?: string;
  regionProvince: string;
  regionCity: string;
  isActive?: boolean;
}

export async function OA_UPSERT_RESUME(input: UpsertResumeParams) {
  nvLog('AT', '▶️ OA_UPSERT_RESUME 시작', { userId: input.userId, title: input.title });

  try {
    const { data, error } = await supabase
      .from('resumes')
      .upsert({
        user_id: input.userId,
        title: input.title,
        experience: input.experience || null,
        introduction: input.introduction || null,
        region_province: input.regionProvince,
        region_city: input.regionCity,
        is_active: input.isActive ?? true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select();

    if (error) throw error;

    nvLog('AT', '✅ OA_UPSERT_RESUME 성공', data);
    return { success: true, data: data?.[0] };

  } catch (error: any) {
    nvLog('AT', '❌ OA_UPSERT_RESUME 실패', error.message);
    return { success: false, error: error.message };
  }
}
