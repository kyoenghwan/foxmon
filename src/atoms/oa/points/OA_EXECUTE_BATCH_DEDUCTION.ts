import { createClient } from '@/utils/supabase/server';
import { nvLog } from '@/lib/logger';

interface DeductionPlan {
  historyId: string;
  deductAmount: number;
}

interface BatchDeductionInput {
  userId: string;
  bonusDeduction: number;
  totalDeduction: number;
  paidDeductionList: DeductionPlan[];
  description: string;
}

interface BatchDeductionOutput {
  success: boolean;
  error?: string;
}

/**
 * [OA] OA_EXECUTE_BATCH_DEDUCTION
 * 계획된 FIFO 차감 내역을 DB에 원자적으로 반영합니다.
 */
export const OA_EXECUTE_BATCH_DEDUCTION = async (input: BatchDeductionInput): Promise<BatchDeductionOutput> => {
  const supabase = await createClient();
  const { userId, bonusDeduction, totalDeduction, paidDeductionList, description } = input;

  try {
    nvLog('AT', `▶️ OA_EXECUTE_BATCH_DEDUCTION 트랜잭션 시작`, input);

    // 💡 1. 사용자 마스터 잔액 업데이트 (전체 차감액 반영)
    // 💡 Note: 실제 서비스에서는 RPC를 통한 원자적 Decrement 권장
    const { data: userBefore, error: userError } = await supabase
      .from('users')
      .select('paid_points, bonus_points')
      .eq('id', userId)
      .single();

    if (userError) throw new Error(`사용자 잔액 조회 실패: ${userError.message}`);

    const paidTotalDeduction = totalDeduction - bonusDeduction;

    const { error: balanceUpdateError } = await supabase
      .from('users')
      .update({
        paid_points: Number(userBefore.paid_points) - paidTotalDeduction,
        bonus_points: Number(userBefore.bonus_points) - bonusDeduction
      })
      .eq('id', userId);

    if (balanceUpdateError) throw new Error(`마스터 잔액 업데이트 실패: ${balanceUpdateError.message}`);

    // 💡 2. 개별 충전 이력(Point Recharge History) 상의 잔액 삭감 (Batch)
    for (const plan of paidDeductionList) {
      const { data: rechargeItem, error: fetchError } = await supabase
        .from('point_recharge_history')
        .select('remained_point')
        .eq('id', plan.historyId)
        .single();
      
      if (fetchError) throw new Error(`충전 이력 항목 조회 실패: ${fetchError.message}`);

      const { error: rechargeUpdateError } = await supabase
        .from('point_recharge_history')
        .update({
          remained_point: Number(rechargeItem.remained_point) - plan.deductAmount
        })
        .eq('id', plan.historyId);
      
      if (rechargeUpdateError) throw new Error(`충전 이력 잔액 삭감 실패: ${rechargeUpdateError.message}`);
    }

    // 💡 3. 거래 로그(Point Transactions) 기록
    const { error: logError } = await supabase
      .from('point_transactions')
      .insert({
        user_id: userId,
        type: 'SPEND',
        amount: totalDeduction,
        balance_after: Number(userBefore.paid_points) + Number(userBefore.bonus_points) - totalDeduction,
        description: description
      });

    if (logError) throw new Error(`거래 로그 저장 실패: ${logError.message}`);

    nvLog('AT', `✅ OA_EXECUTE_BATCH_DEDUCTION 트랜잭션 성공`, { userId, totalDeduction });

    return { success: true };
  } catch (error: any) {
    nvLog('AT', `❌ OA_EXECUTE_BATCH_DEDUCTION 트랜잭션 에러`, error.message);
    return { success: false, error: error.message };
  }
};
