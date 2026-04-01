import { createClient } from '@/utils/supabase/server';
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
export const QA_GET_DEDUCTION_CONTEXT = async (userId: string): Promise<DeductionContext | null> => {
  const supabase = await createClient();

  try {
    // 💡 1. 사용자의 현재 잔액 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, bonus_points, paid_points')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error(`사용자 잔액 조회 실패: ${userError?.message}`);
    }

    // 💡 2. 잔액이 남아있는 충전 이력 조회 (오래된 순서 - FIFO)
    const { data: recharges, error: rechargeError } = await supabase
      .from('point_recharge_history')
      .select('id, remained_point, created_at')
      .eq('user_id', userId)
      .gt('remained_point', 0)
      .order('created_at', { ascending: true });

    if (rechargeError) {
      throw new Error(`충전 이력 조회 실패: ${rechargeError.message}`);
    }

    const result = {
      userId: user.id,
      bonusPoints: Number(user.bonus_points),
      paidPoints: Number(user.paid_points),
      activeRecharges: recharges.map(r => ({
        id: r.id,
        remained_point: Number(r.remained_point),
        created_at: r.created_at
      }))
    };

    nvLog('AT', `▶️ QA_GET_DEDUCTION_CONTEXT 조회 완료`, { userId, activeCount: recharges.length });

    return result;
  } catch (error: any) {
    nvLog('AT', `❌ QA_GET_DEDUCTION_CONTEXT 에러`, error.message);
    return null;
  }
};
