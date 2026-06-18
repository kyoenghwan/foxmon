import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

/**
 * OA_CREATE_RESET_TOKEN: 비밀번호 재설정 토큰 생성 및 DB 저장
 * - 이메일로 비밀번호 찾기 시 사용
 * - 15분 유효, 1회용
 */
export async function OA_CREATE_RESET_TOKEN(
  userId: string
): Promise<{ success: boolean; token: string | null; error: string | null }> {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15분 후 만료

    const { error } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (error) throw error;

    return { success: true, token, error: null };
  } catch (err: any) {
    return { success: false, token: null, error: err.message };
  }
}

/**
 * OA_VERIFY_RESET_TOKEN: 재설정 토큰 유효성 검증
 */
export async function OA_VERIFY_RESET_TOKEN(
  token: string
): Promise<{ success: boolean; userId: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at, used')
      .eq('token', token)
      .single();

    if (error || !data) {
      return { success: false, userId: null, error: '유효하지 않은 재설정 링크입니다.' };
    }

    if (data.used) {
      return { success: false, userId: null, error: '이미 사용된 재설정 링크입니다.' };
    }

    if (new Date(data.expires_at) < new Date()) {
      return { success: false, userId: null, error: '만료된 재설정 링크입니다. 다시 요청해주세요.' };
    }

    // 토큰 사용 처리
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token);

    return { success: true, userId: data.user_id, error: null };
  } catch (err: any) {
    return { success: false, userId: null, error: err.message };
  }
}
