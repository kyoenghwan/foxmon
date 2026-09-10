import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';

interface DeductionContext {
  userId: string;
  bonusPoints: number;
  paidPoints: number;
  activeRecharges: Array<{
    id: string;
    remained_point: number;
    created_at: string;
  }>;
}

/**
 * [QA] QA_GET_DEDUCTION_CONTEXT
 * 포인트 차감을 위해 사용자의 현재 잔액과 잔액이 남아있는 충전 이력(FIFO용)을 조회합니다.
 */
export const QA_GET_DEDUCTION_CONTEXT = async (userId: string): Promise<{ success: boolean; data: DeductionContext | null; error: string | null }> => {
  try {
    // 💡 1. 사용자의 현재 잔액 조회 (Admin Client)
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, bonus_points, paid_points')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error(`사용자 잔액 조회 실패: ${userError?.message}`);
    }

    // 💡 2. 잔액이 남아있는 충전 이력 조회 (Admin Client - FIFO)
    const { data: recharges, error: rechargeError } = await supabaseAdmin
      .from('point_recharge_history')
      .select('id, remained_point, created_at')
      .eq('user_id', userId)
      .gt('remained_point', 0)
      .order('created_at', { ascending: true });

    if (rechargeError) {
      throw new Error(`충전 이력 조회 실패: ${rechargeError.message}`);
    }

    const rechargeList = recharges || [];

    // 조회 중 임의 보정 이력을 생성하지 않고 정합성 오류를 명시합니다.
    const paidPoints = Number(user.paid_points);
    const bonusPoints = Number(user.bonus_points);
    const totalHistoryAmount = rechargeList.reduce((sum, r) => sum + Number(r.remained_point), 0);
    if (!Number.isSafeInteger(paidPoints) || paidPoints < 0 ||
        !Number.isSafeInteger(bonusPoints) || bonusPoints < 0 ||
        rechargeList.some(r => !Number.isSafeInteger(Number(r.remained_point)) || Number(r.remained_point) <= 0) ||
        paidPoints !== totalHistoryAmount) {
      throw new Error('포인트 잔액과 충전 이력이 일치하지 않습니다. 관리자 확인이 필요합니다.');
    }
    const result = {
      userId: user.id,
      bonusPoints: Number(user.bonus_points || 0),
      paidPoints: paidPoints,
      activeRecharges: rechargeList.map(r => ({
        id: r.id,
        remained_point: Number(r.remained_point || 0),
        created_at: r.created_at
      }))
    };

    console.log(`🔍 [QA_GET_DEDUCTION_CONTEXT] 유저 포인트 상태:`, {
      userId,
      bonusPoints: result.bonusPoints,
      paidPoints: result.paidPoints,
      activeRechargesCount: result.activeRecharges.length,
      activeRechargesTotal: totalHistoryAmount
    });

    return { success: true, data: result, error: null };
  } catch (error: any) {
    console.error(`❌ [QA_GET_DEDUCTION_CONTEXT 에러]`, error.message);
    return { success: false, data: null, error: error.message };
  }
};
