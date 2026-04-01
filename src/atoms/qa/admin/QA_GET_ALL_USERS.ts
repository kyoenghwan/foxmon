import { supabase } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

/**
 * QA_GET_ALL_USERS: 관리자용 전체 사용자 목록 조회
 * - 보안상 관리자 권한이 있는 세션에서만 호출되어야 함
 */
export async function QA_GET_ALL_USERS() {
  nvLog('AT', '▶️ QA_GET_ALL_USERS 시작');

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, login_id, name, nickname, role, is_age_verified, created_at, phone_number')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (err: any) {
    nvLog('AT', '❌ QA_GET_ALL_USERS 에러', err.message);
    return {
      success: false,
      data: [],
      error: err.message
    };
  }
}
