import { supabase } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

/**
 * QA_CHECK_EMAIL_EXISTS: 가입하려는 이메일이 이미 존재하는지 확인합니다.
 */
export async function QA_CHECK_EMAIL_EXISTS(input: { email: string }): Promise<{ success: boolean; data: { exists: boolean } | null; error: string | null }> {
  nvLog('AT', '▶️ QA_CHECK_EMAIL_EXISTS 시작', input);
  
  try {
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('email', input.email);

    if (error) {
      nvLog('AT', '❌ QA_CHECK_EMAIL_EXISTS 에러', error.message);
      return { success: false, data: null, error: error.message };
    }
    
    return { success: true, data: { exists: (count || 0) > 0 }, error: null };
  } catch (err: any) {
    nvLog('AT', '❌ QA_CHECK_EMAIL_EXISTS 에러', err.message);
    return { success: false, data: null, error: err.message };
  }
}
