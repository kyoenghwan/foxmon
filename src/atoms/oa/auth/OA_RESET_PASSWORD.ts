import { supabaseAdmin } from '@/lib/supabase';
import { RA_HASH_PASSWORD } from '@/src/atoms/ra/auth/RA_HASH_PASSWORD';

/**
 * OA_RESET_PASSWORD: 비밀번호 재설정
 * - userId 기반으로 해싱된 새 비밀번호를 DB에 업데이트
 */
export async function OA_RESET_PASSWORD(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const hashedPassword = await RA_HASH_PASSWORD(newPassword);

    const { error } = await supabaseAdmin
      .from('users')
      .update({ password: hashedPassword.data })
      .eq('id', userId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
