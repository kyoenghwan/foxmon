import { createClient } from '@/utils/supabase/server';
import { nvLog } from '@/lib/logger';

interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface SubmitRefundInput {
  userId: string;
  refundableCash: number;
  bankInfo: BankInfo;
}

interface SubmitRefundOutput {
  success: boolean;
  requestId?: string;
  error?: string;
}

/**
 * [OA] OA_SUBMIT_REFUND_REQUEST
 * 환불 신청을 접수하고, 사용자의 모든 포인트 잔액 및 개별 충전 이력을 즉시 소멸 처리합니다.
 */
export const OA_SUBMIT_REFUND_REQUEST = async (input: SubmitRefundInput): Promise<SubmitRefundOutput> => {
  const supabase = await createClient();
  const { userId, refundableCash, bankInfo } = input;

  try {
    nvLog('AT', `▶️ OA_SUBMIT_REFUND_REQUEST 트랜잭션 시작`, { userId, refundableCash });

    // 💡 1단계: 환불 신청 접수 (Refund Request)
    const { data: request, error: requestError } = await supabase
      .from('refund_requests')
      .insert({
        user_id: userId,
        cash_amount: refundableCash,
        bank_name: bankInfo.bankName,
        account_number: bankInfo.accountNumber,
        account_holder: bankInfo.accountHolder,
        status: 'PENDING'
      })
      .select()
      .single();

    if (requestError) throw new Error(`환불 신청 저장 실패: ${requestError.message}`);

    // 💡 2단계: 사용자 마스터 포인트 전액 소멸 (Zero out)
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        paid_points: 0,
        bonus_points: 0
      })
      .eq('id', userId);

    if (userUpdateError) throw new Error(`포인트 잔액 소멸 실패: ${userUpdateError.message}`);

    // 💡 3단계: 개별 충전 이력(Point Recharge History) 잔여분 전액 소멸
    const { error: historyUpdateError } = await supabase
      .from('point_recharge_history')
      .update({
        remained_point: 0
      })
      .eq('user_id', userId);

    if (historyUpdateError) throw new Error(`충전 이력 소멸 실패: ${historyUpdateError.message}`);

    // 💡 4단계: 거래 로그(Point Transactions) 기록
    const { error: logError } = await supabase
      .from('point_transactions')
      .insert({
        user_id: userId,
        type: 'REFUND',
        amount: 0, // 환불은 포인트 차감이 아닌 전액 소멸이므로 현금 가치와는 별도로 0으로 기록
        balance_after: 0,
        description: `환불 신청 접수 (총 ${refundableCash}원 예정). 모든 잔여 포인트 소멸 처리.`
      });

    if (logError) throw new Error(`거래 로그 저장 실패: ${logError.message}`);

    nvLog('AT', `✅ OA_SUBMIT_REFUND_REQUEST 트랜잭션 성공`, { requestId: request.id });

    return {
      success: true,
      requestId: request.id
    };
  } catch (error: any) {
    nvLog('AT', `❌ OA_SUBMIT_REFUND_REQUEST 에러`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
};
