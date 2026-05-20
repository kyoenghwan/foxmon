import { auth } from '@/auth';
import { isSupabaseServiceRoleConfigured, supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const;

const BASE_SELECT =
  'id, login_id, name, nickname, role, is_age_verified, created_at, phone_number';

/**
 * QA_GET_ADMIN_USERS: 관리자(ADMIN/SUPER_ADMIN) 계정만 조회
 */
export async function QA_GET_ADMIN_USERS() {
  nvLog('AT', '▶️ QA_GET_ADMIN_USERS 시작');

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
          'SUPABASE_SERVICE_ROLE_KEY가 설정되지 않아 관리자 목록을 전부 불러올 수 없습니다. 배포 환경(.env)에 서비스 롤 키를 추가해 주세요.',
      };
    }

    let selectCols = `${BASE_SELECT}, staff_team`;
    let { data, error } = await supabaseAdmin
      .from('users')
      .select(selectCols)
      .in('role', [...ADMIN_ROLES])
      .order('created_at', { ascending: false });

    if (error && /staff_team/i.test(error.message)) {
      selectCols = BASE_SELECT;
      const retry = await supabaseAdmin
        .from('users')
        .select(selectCols)
        .in('role', [...ADMIN_ROLES])
        .order('created_at', { ascending: false });
      data = retry.data?.map((row) => ({ ...row, staff_team: 'OPS' })) ?? null;
      error = retry.error;
    }

    if (error) throw error;

    nvLog('AT', '✅ QA_GET_ADMIN_USERS 성공', { count: data?.length ?? 0 });
    return { success: true, data: data || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    nvLog('AT', '❌ QA_GET_ADMIN_USERS 에러', message);
    return { success: false, data: [], error: message };
  }
}
