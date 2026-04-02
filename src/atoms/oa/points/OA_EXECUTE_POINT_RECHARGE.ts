import { createClient } from '@/utils/supabase/server';
import { nvLog } from '@/lib/logger';

interface RechargeOperationInput {
  userId: string;
  cashAmount: number;
  bonusAmount: number;
  isFirstCharge: boolean;
  bonusRatio: number;
}

interface RechargeOperationOutput {
  success: boolean;
  data?: {
    rechargeId: string;
  };
  error?: string;
  rollbackData?: any;
}

/**
 * [OA] OA_EXECUTE_POINT_RECHARGE
 * 충전 이력을 기록하고 사용자의 유료/보너스 포인트 잔액을 트랜잭션 처리로 업데이트합니다.
 */
export const OA_EXECUTE_POINT_RECHARGE = async (input: RechargeOperationInput): Promise<RechargeOperationOutput> => {
  const supabase = await createClient();
  const { userId, cashAmount, bonusAmount, isFirstCharge, bonusRatio } = input;

  try {
    nvLog('AT', `▶️ OA_EXECUTE_POINT_RECHARGE 트랜잭션 시작`, input);

    // 💡 1. 포인트 충전 이력(Point Recharge History) 기록
    const { data: rechargeHistory, error: historyError } = await supabase
      .from('point_recharge_history')
      .insert({
        user_id: userId,
        cash_amount: cashAmount,
        point_amount: cashAmount + bonusAmount,
        bonus_ratio: bonusRatio,
        remained_point: cashAmount + bonusAmount, // 초기에는 전액 잔여 포인트
        is_first_charge: isFirstCharge
      })
      .select()
      .single();

    if (historyError) throw new Error(`충전 이력 저장 실패: ${historyError.message}`);

    // 💡 2. 사용자 테이블의 포인트 잔액 및 첫 충전 플래그 업데이트
    // 💡 Note: 실제 서비스에서는 RPC(Stored Procedure)를 통한 원자적 Increment 권장
    // 💡 여기서는 현재 유저 정보를 다시 조회하여 안전하게 업데이트 시뮬레이션
    const { data: userCurrent, error: userError } = await supabase
      .from('users')
      .select('paid_points, bonus_points')
      .eq('id', userId)
      .single();

    if (userError) throw new Error(`사용자 정보 조회 실패: ${userError.message}`);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        paid_points: Number(userCurrent.paid_points) + cashAmount,
        bonus_points: Number(userCurrent.bonus_points) + bonusAmount,
        has_first_charged: true // 충전 완료 시 무조건 첫 충전 여부를 true로 설정
      })
      .eq('id', userId);

    if (updateError) throw new Error(`포인트 잔액 업데이트 실패: ${updateError.message}`);

    // 💡 3. 범용 트랜잭션 로그(Point Transactions) 기록
    const { error: logError } = await supabase
      .from('point_transactions')
      .insert({
        user_id: userId,
        type: 'CHARGE',
        source_recharge_id: rechargeHistory.id,
        amount: cashAmount + bonusAmount,
        balance_after: Number(userCurrent.paid_points) + Number(userCurrent.bonus_points) + cashAmount + bonusAmount,
        description: isFirstCharge ? '초기 특별 충전 보너스 50% 포함' : `등급 혜택 보너스 ${bonusRatio * 100}% 포함`
      });

    if (logError) throw new Error(`거래 로그 저장 실패: ${logError.message}`);

    nvLog('AT', `✅ OA_EXECUTE_POINT_RECHARGE 트랜잭션 성공`, { rechargeId: rechargeHistory.id });

    return {
      success: true,
      data: { rechargeId: rechargeHistory.id },
      rollbackData: { rechargeId: rechargeHistory.id, cashAmount, bonusAmount }
    };
  } catch (error: any) {
    nvLog('AT', `❌ OA_EXECUTE_POINT_RECHARGE 트랜잭션 에러`, error.message);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};
