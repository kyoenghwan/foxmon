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
export const QA_GET_DEDUCTION_CONTEXT = async (userId: string): Promise<{ success: boolean; data: DeductionContext | null; error: string | null }> => {
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

    // 💡 3. 데이터 정합성 검증 및 이상 증상 관리자 메모 등록
    const paidPoints = Number(user.paid_points);
    const totalHistoryAmount = recharges.reduce((sum, r) => sum + Number(r.remained_point), 0);
    
    if (paidPoints > 0 && totalHistoryAmount !== paidPoints) {
        // 백그라운드 비동기로 관리자 메모(admin_memo) 업데이트 (실패해도 결제 흐름 방해 안 함)
        supabase.from('users').update({
            admin_memo: `[🚨포인트 불일치 경고] 유저의 잔여 유료포인트(${paidPoints}P)와 실제 충전 영수증 총합(${totalHistoryAmount}P)이 일치하지 않습니다. 관리자가 수동으로 유료 포인트를 지급할 때 영수증 처리가 누락되었거나, 보너스로 주어야 할 포인트를 유료 포인트로 잘못 입력했을 수 있습니다.`
        }).eq('id', userId).then();
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

    return { success: true, data: result, error: null };
  } catch (error: any) {
    nvLog('AT', `❌ QA_GET_DEDUCTION_CONTEXT 에러`, error.message);
    return { success: false, data: null, error: error.message };
  }
};
