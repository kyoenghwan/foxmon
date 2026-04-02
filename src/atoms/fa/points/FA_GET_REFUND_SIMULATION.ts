import { nvLog } from '@/lib/logger';
import { QA_GET_REFUND_CONTEXT } from '@/src/atoms/qa/points/QA_GET_REFUND_CONTEXT';
import { RA_CALC_REFUND_PRO_RATA } from '@/src/atoms/ra/points/RA_CALC_REFUND_PRO_RATA';

interface RefundSimulationOutput {
  success: boolean;
  data?: {
    totalRefundAmount: number;
    refundFee: number;
    totalRemainingValue: number;
    details: any[];
  };
  reason: string;
  error?: string;
}

/**
 * [FA] FA_GET_REFUND_SIMULATION
 * 특정 시점에 사용자가 환불 신청 시 받을 수 있는 실지급액과 상세 산출 근거를 제공합니다.
 */
export const FA_GET_REFUND_SIMULATION = async (userId: string): Promise<RefundSimulationOutput> => {
  try {
    nvLog('AT', `▶️ FA_GET_REFUND_SIMULATION 시작`, { userId });

    // 💡 1단계: 환불 대상 데이터 조회 (QA)
    const contextResult = await QA_GET_REFUND_CONTEXT(userId);
    if (!contextResult.success || !contextResult.data || contextResult.data.activeHistory.length === 0) {
      return {
        success: false,
        data: undefined,
        reason: '환불 가능한 입금 내역이 없습니다.',
        error: contextResult.error || 'NO_CHARGE_HISTORY'
      };
    }
    const context = contextResult.data;

    // 💡 2단계: 정밀 가치 정산 (RA)
    const calculationResult = RA_CALC_REFUND_PRO_RATA({
      activeHistory: context.activeHistory,
      refundFeeRatio: context.policy.refundFeeRatio
    });

    if (!calculationResult.isValid || !calculationResult.data) {
      throw new Error(calculationResult.error || '환불 계산 중 오류가 발생했습니다.');
    }
    const calculation = calculationResult.data;

    // 💡 3단계: 사용자에게 보여줄 상세 근거(Reason) 텍스트 생성
    const activeCount = calculation.details.length;
    const totalOriginalCash = calculation.totalOriginalCash.toLocaleString();
    const reason = `총 ${activeCount}건의 충전 원금(${totalOriginalCash}원)을 기준으로, 사용하신 포인트만큼의 가치비를 제외한 잔여 원금 합계에서 운영 수수료 ${calculation.refundFee.toLocaleString()}원(10%)을 차감한 금액입니다.`;

    nvLog('AT', `✅ FA_GET_REFUND_SIMULATION 성공`, { userId, refund: calculation.finalRefundAmount });

    return {
      success: true,
      data: {
        totalRefundAmount: calculation.finalRefundAmount,
        refundFee: calculation.refundFee,
        totalRemainingValue: calculation.totalRemainingCashValue,
        details: calculation.details
      },
      reason
    };
  } catch (error: any) {
    nvLog('AT', `❌ FA_GET_REFUND_SIMULATION 에러`, error.message);
    return {
      success: false,
      data: undefined,
      reason: '환불 정보를 불러오는 중 오류가 발생했습니다.',
      error: error.message
    };
  }
};
