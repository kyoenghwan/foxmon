import { supabaseAdmin } from '@/lib/supabase';

/**
 * QA_VERIFY_USER_CI: 아이디 + (CI 또는 휴대폰 번호) 일치 여부 확인
 * - 비밀번호 찾기 (본인인증) 시 사용
 * - 해당 아이디의 소유자가 본인인지 CI 또는 Phone Number로 검증
 */
export async function QA_VERIFY_USER_CI(
  loginId: string,
  ci?: string,
  phoneNumber?: string
): Promise<{
  data: { userId: string; verified: boolean } | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, ci, phone_number')
      .eq('login_id', loginId.trim())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: { userId: '', verified: false }, error: '존재하지 않는 아이디입니다.' };
      }
      throw error;
    }

    const rawPhone = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : '';
    const dbPhone = data.phone_number ? data.phone_number.replace(/[^0-9]/g, '') : '';

    // 1) CI 일치 검증
    const isCiMatch = !!(ci && data.ci && data.ci === ci);
    // 2) 휴대폰 번호 일치 검증
    const isPhoneMatch = !!(rawPhone && dbPhone && rawPhone === dbPhone);

    const verified = isCiMatch || isPhoneMatch;

    if (!verified) {
      return { 
        data: { userId: data.id, verified: false }, 
        error: '입력하신 아이디와 본인 인증 정보가 일치하지 않습니다.' 
      };
    }

    return { data: { userId: data.id, verified: true }, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}
