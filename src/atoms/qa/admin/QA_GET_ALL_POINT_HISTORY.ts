import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

export async function QA_GET_ALL_POINT_HISTORY() {
  nvLog('AT', '▶️ QA_GET_ALL_POINT_HISTORY 시작');

  try {
    // 1. 업체용 거래 내역 최근 100개 조회
    const { data: bizTx, error: bizError } = await supabaseAdmin
      .from('point_transactions')
      .select('id, user_id, type, amount, balance_after, description, created_at, users(login_id, name, nickname, role)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (bizError) throw bizError;

    // 2. 일반용 거래 내역 최근 100개 조회
    const { data: actTx, error: actError } = await supabaseAdmin
      .from('activity_point_transactions')
      .select('id, user_id, type, amount, balance_after, description, created_at, users(login_id, name, nickname, role)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (actError) throw actError;

    // 3. 두 거래 내역 병합 및 가공
    const normalizedBiz = (bizTx || []).map((t: any) => ({
      ...t,
      pointClass: 'BIZ',
      user: t.users
    }));

    const normalizedAct = (actTx || []).map((t: any) => ({
      ...t,
      pointClass: 'ACTIVITY',
      user: t.users
    }));

    // 전체 머지 및 최신순 정렬
    const merged = [...normalizedBiz, ...normalizedAct]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 150); // 최근 150개 거래 내역 통합 반환

    return {
      success: true,
      data: merged,
      error: null
    };
  } catch (err: any) {
    nvLog('AT', '❌ QA_GET_ALL_POINT_HISTORY 에러', err.message);
    return {
      success: false,
      data: [],
      error: err.message
    };
  }
}
