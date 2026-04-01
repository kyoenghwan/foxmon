import { supabase } from '../../../../lib/supabase';
import { nvLog } from '../../../../lib/logger';

/**
 * OA_DELETE_RESUME: 이력서를 DB에서 삭제합니다.
 * Domain: Resume
 * Type: Operation Atom (CUD)
 */
export async function OA_DELETE_RESUME(input: { resumeId: string; userId: string }) {
  nvLog('AT', '▶️ OA_DELETE_RESUME 시작', input);

  try {
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', input.resumeId)
      .eq('user_id', input.userId); // 본인 확인

    if (error) {
      nvLog('AT', '❌ OA_DELETE_RESUME 에러', error.message);
      return { success: false, error: error.message };
    }

    nvLog('AT', '✅ OA_DELETE_RESUME 성공', { resumeId: input.resumeId });
    return { success: true, error: null };
  } catch (error: any) {
    nvLog('AT', '❌ OA_DELETE_RESUME 시스템 에러', error.message);
    return { success: false, error: error.message };
  }
}
