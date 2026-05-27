import { auth } from '@/auth';
import { isSupabaseServiceRoleConfigured, supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

/**
 * QA_GET_ALL_USERS: 관리자용 전체 사용자 목록 조회
 * - supabaseAdmin(RLS 우회) + 세션 role 검증
 */
export async function QA_GET_ALL_USERS() {
  nvLog('AT', '▶️ QA_GET_ALL_USERS 시작');

  try {
    const session = await auth();
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session?.user || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      nvLog('AT', '⚠️ QA_GET_ALL_USERS: Unauthorized');
      return { success: false, data: [], error: 'Unauthorized' };
    }

    if (!isSupabaseServiceRoleConfigured) {
      return {
        success: false,
        data: [],
        error:
          'SUPABASE_SERVICE_ROLE_KEY가 설정되지 않아 전체 회원 목록을 불러올 수 없습니다.',
      };
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, login_id, name, nickname, role, staff_team, is_age_verified, created_at, phone_number, merchant_tier')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    nvLog('AT', '❌ QA_GET_ALL_USERS 에러', message);
    return {
      success: false,
      data: [],
      error: message,
    };
  }
}
