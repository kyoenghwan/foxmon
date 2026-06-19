import { supabaseAdmin } from '@/lib/supabase';

/**
 * QA_FIND_USER_BY_NAME_EMAIL: 이름 + 이메일로 사용자 조회
 * - 아이디 찾기 (이메일) 시 사용
 * - 아이디를 마스킹하여 반환
 */
export async function QA_FIND_USER_BY_NAME_EMAIL(
  name: string,
  email: string
): Promise<{
  data: Array<{ login_id: string; masked_id: string; created_at: string }> | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('login_id, created_at')
      .eq('name', name)
      .eq('email', email);

    if (error) throw error;

    const masked = (data || []).map(u => ({
      ...u,
      masked_id: maskLoginId(u.login_id),
    }));

    return { data: masked, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/** 아이디 마스킹: 앞3자 + *** + 끝1자 (4자 이하면 앞1자 + ***) */
function maskLoginId(id: string): string {
  if (id.length <= 4) return id.charAt(0) + '***';
  return id.substring(0, 3) + '***' + id.charAt(id.length - 1);
}
