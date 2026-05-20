import { auth } from '@/auth';
import { isSupabaseServiceRoleConfigured, supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

const BASE_SELECT =
  'id, login_id, name, nickname, role, is_age_verified, created_at, phone_number';

/**
 * 고객센터 담당자 지정 화면용 계정 목록
 * - ADMIN / SUPER_ADMIN
 * - staff_team = CS (고객응대 담당)
 * - login_id 가 foxmon_ 로 시작하는 내부 운영 계정 (예: foxmon_cs, foxmon_ad)
 */
export async function QA_GET_SUPPORT_STAFF_USERS() {
  nvLog('AT', '▶️ QA_GET_SUPPORT_STAFF_USERS 시작');

  try {
    const session = await auth();
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session?.user || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return { success: false, data: [], error: 'Unauthorized' };
    }

    if (!isSupabaseServiceRoleConfigured) {
      return {
        success: false,
        data: [],
        error:
          'SUPABASE_SERVICE_ROLE_KEY가 설정되지 않아 담당자 목록을 불러올 수 없습니다. 배포 환경(.env)에 서비스 롤 키를 추가해 주세요.',
      };
    }

    const orFilter =
      'role.in.(ADMIN,SUPER_ADMIN),staff_team.eq.CS,login_id.ilike.foxmon_%';

    let selectCols = `${BASE_SELECT}, staff_team`;
    let { data, error } = await supabaseAdmin
      .from('users')
      .select(selectCols)
      .or(orFilter)
      .order('created_at', { ascending: false });

    if (error && /staff_team/i.test(error.message)) {
      selectCols = BASE_SELECT;
      const retry = await supabaseAdmin
        .from('users')
        .select(selectCols)
        .or('role.in.(ADMIN,SUPER_ADMIN),login_id.ilike.foxmon_%')
        .order('created_at', { ascending: false });
      data = retry.data?.map((row) => ({ ...row, staff_team: 'OPS' })) ?? null;
      error = retry.error;
    }

    if (error) throw error;

    const rows = data || [];
    const deduped = Array.from(new Map(rows.map((r) => [r.id, r])).values());

    nvLog('AT', '✅ QA_GET_SUPPORT_STAFF_USERS 성공', { count: deduped.length });
    return { success: true, data: deduped, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    nvLog('AT', '❌ QA_GET_SUPPORT_STAFF_USERS 에러', message);
    return { success: false, data: [], error: message };
  }
}
