import { nvLog } from '@/lib/logger';

interface RechargeItem {
  id: string;
  cash_amount: number;
  point_amount: number;
  remained_point: number;
}

interface RefundInput {
  activeHistory: RechargeItem[];
  refundFeeRatio: number; // 0.1
}

interface RefundItemDetail {
  chargeId: string;
  originalCash: number;
  totalPoints: number;
  usedPoints: number;
  remainingCashValue: number;
}

interface RefundOutput {
  isValid: boolean;
  data?: {
    totalOriginalCash: number;
    totalRemainingCashValue: number;
    refundFee: number;
    finalRefundAmount: number;
    details: RefundItemDetail[];
  };
  error?: string;
}

/**
 * [RA] RA_CALC_REFUND_PRO_RATA
 * 관리자 정의 공식(Cash - Used/Ratio - 10% Fee)에 기반하여 가치 비례 정밀 환불액을 산출하는 순수 함수입니다.
 */
export const RA_CALC_REFUND_PRO_RATA = (input: RefundInput): RefundOutput => {
  const { activeHistory, refundFeeRatio } = input;

  if (!activeHistory || activeHistory.length === 0) {
    return {
      isValid: false,
      error: '환불 가능한 충전 내역이 없습니다.'
    };
  }

  let totalOriginalCash = 0;
  let totalRemainingCashValue = 0;
  const details: RefundItemDetail[] = [];

  // 💡 1단계: 각 충전 건별 잔여 원금 가치 합산
  for (const item of activeHistory) {
    const usedPoints = item.point_amount - item.remained_point;
    
    // 💡 가치 배수(Ratio) = 지급총액 / 현금원금 (예: 15만 / 10만 = 1.5)
    // 💡 만약 원금이 0이면 (이벤트성) 배수는 무한대로 가정하여 소멸 처리
    const valueRatio = item.cash_amount > 0 ? (item.point_amount / item.cash_amount) : 0;
    
    // 💡 잔여 원금 가치 = 원금 - (사용포인트 / 배수)
    const remainingCashValue = valueRatio > 0 
      ? Math.max(0, Math.floor(item.cash_amount - (usedPoints / valueRatio)))
      : 0;

    totalOriginalCash += item.cash_amount;
    totalRemainingCashValue += remainingCashValue;

    details.push({
      chargeId: item.id,
      originalCash: item.cash_amount,
      totalPoints: item.point_amount,
      usedPoints,
      remainingCashValue
    });
  }

  // 💡 2단계: 전체 원금 기반 환불 수수료 계산 (보통 원금의 10%)
  const refundFee = Math.floor(totalOriginalCash * refundFeeRatio);

  // 💡 3단계: 최종 환불액 = 잔여 원금 가치 합계 - 수수료
  const finalRefundAmount = Math.max(0, totalRemainingCashValue - refundFee);

  nvLog('AT', `▶️ RA_CALC_REFUND_PRO_RATA 산출 완료`, {
    totalOriginalCash,
    totalRemainingCashValue,
    refundFee,
    finalRefundAmount
  });

  return {
    isValid: true,
    data: {
      totalOriginalCash,
      totalRemainingCashValue,
      refundFee,
      finalRefundAmount,
      details
    }
  };
};
