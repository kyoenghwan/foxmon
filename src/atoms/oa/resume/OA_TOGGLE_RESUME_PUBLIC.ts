import { supabase } from '../../../../lib/supabase';
import { nvLog } from '../../../../lib/logger';

/**
 * OA_TOGGLE_RESUME_PUBLIC: 이력서 공개/비공개 상태를 변경합니다.
 * Domain: Resume
 * Type: Operation Atom (CUD)
 */
export async function OA_TOGGLE_RESUME_PUBLIC(input: { 
  resumeId: string; 
  userId: string; 
  is_public: boolean; 
}) {
  nvLog('AT', '▶️ OA_TOGGLE_RESUME_PUBLIC 시작', input);

  try {
    const { data, error } = await supabase
      .from('resumes')
      .update({ 
        is_public: input.is_public, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', input.resumeId)
      .eq('user_id', input.userId) // 본인 확인
      .select();

    if (error) {
      nvLog('AT', '❌ OA_TOGGLE_RESUME_PUBLIC 에러', error.message);
      return { success: false, error: error.message };
    }

    nvLog('AT', '✅ OA_TOGGLE_RESUME_PUBLIC 성공', { is_public: input.is_public });
    return { success: true, data: data?.[0], error: null };
  } catch (error: any) {
    nvLog('AT', '❌ OA_TOGGLE_RESUME_PUBLIC 시스템 에러', error.message);
    return { success: false, error: error.message };
  }
}
