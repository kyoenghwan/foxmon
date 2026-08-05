import { supabaseAdmin } from '@/lib/supabase';

/**
 * QA_FIND_USER_BY_CI: CI(연계정보) 또는 휴대폰 번호로 사용자 조회
 * - 아이디 찾기 (본인인증) 시 사용
 * - CI가 설정된 계정 + 동일 휴대폰 번호로 등록된 레거시/테스트 계정까지 모두 포함
 */
export async function QA_FIND_USER_BY_CI(ci: string, phoneNumber?: string): Promise<{
  data: Array<{ login_id: string; created_at: string }> | null;
  error: string | null;
}> {
  try {
    const rawPhone = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : '';
    const formattedPhone = rawPhone.length === 11 
      ? `${rawPhone.slice(0, 3)}-${rawPhone.slice(3, 7)}-${rawPhone.slice(7)}` 
      : rawPhone;

    let query = supabaseAdmin
      .from('users')
      .select('login_id, created_at');

    if (ci && rawPhone) {
      // CI 일치 OR 휴대폰 번호 일치 (하이픈 포함/미포함)
      query = query.or(`ci.eq.${ci},phone_number.eq.${rawPhone},phone_number.eq.${formattedPhone}`);
    } else if (ci) {
      query = query.eq('ci', ci);
    } else if (rawPhone) {
      query = query.or(`phone_number.eq.${rawPhone},phone_number.eq.${formattedPhone}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // 중복 login_id 제거
    const uniqueAccounts: Array<{ login_id: string; created_at: string }> = [];
    const seenIds = new Set<string>();

    (data || []).forEach(user => {
      if (user.login_id && !seenIds.has(user.login_id)) {
        seenIds.add(user.login_id);
        uniqueAccounts.push(user);
      }
    });

    return { data: uniqueAccounts, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}
