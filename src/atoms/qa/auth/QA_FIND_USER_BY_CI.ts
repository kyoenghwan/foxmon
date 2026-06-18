import { supabase } from '@/lib/supabase';

/**
 * QA_FIND_USER_BY_CI: CI(연계정보)로 사용자 조회
 * - 아이디 찾기 (본인인증) 시 사용
 */
export async function QA_FIND_USER_BY_CI(ci: string): Promise<{
  data: Array<{ login_id: string; created_at: string }> | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('login_id, created_at')
      .eq('ci', ci);

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}
