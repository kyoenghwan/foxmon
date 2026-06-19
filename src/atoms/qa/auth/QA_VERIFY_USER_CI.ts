import { supabaseAdmin } from '@/lib/supabase';

/**
 * QA_VERIFY_USER_CI: 아이디 + CI 일치 여부 확인
 * - 비밀번호 찾기 (본인인증) 시 사용
 * - 해당 아이디의 소유자가 본인인지 CI로 검증
 */
export async function QA_VERIFY_USER_CI(
  loginId: string,
  ci: string
): Promise<{
  data: { userId: string; verified: boolean } | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, ci')
      .eq('login_id', loginId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: { userId: '', verified: false }, error: '존재하지 않는 아이디입니다.' };
      }
      throw error;
    }

    const verified = data.ci === ci;
    return { data: { userId: data.id, verified }, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}
