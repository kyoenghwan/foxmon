import { nvLog } from '@/lib/logger';

interface RechargeItem {
  id: string;
  remained_point: number;
}

interface DeductionInput {
  requiredPoints: number; // 차감해야 할 총액 (광고비)
  currentBonusBalance: number;
  activeRecharges: RechargeItem[];
}

interface DeductionPlan {
  historyId: string;
  deductAmount: number;
}

interface DeductionOutput {
  isValid: boolean;
  data?: {
    bonusDeduction: number;
    paidDeductionList: DeductionPlan[];
  };
  error?: string;
}

/**
 * [RA] RA_CALC_DEDUCTION_FIFO
 * 보너스 우선 소진 및 선입선출(FIFO) 기반 차감 시뮬레이션을 수행합니다.
 */
export const RA_CALC_DEDUCTION_FIFO = (input: DeductionInput): DeductionOutput => {
  const { requiredPoints, currentBonusBalance, activeRecharges } = input;

  let remainingToDeduct = requiredPoints;
  let bonusDeduction = 0;
  const paidDeductionList: DeductionPlan[] = [];

  // 💡 1단계: 보너스 포인트 우선 소진
  if (currentBonusBalance > 0) {
    const deductFromBonus = Math.min(currentBonusBalance, remainingToDeduct);
    bonusDeduction = deductFromBonus;
    remainingToDeduct -= deductFromBonus;
  }

  // 💡 2단계: 남은 금액이 있으면 유료 포인트에서 FIFO로 소진
  if (remainingToDeduct > 0) {
    for (const recharge of activeRecharges) {
      if (remainingToDeduct <= 0) break;

      const deductFromPaid = Math.min(recharge.remained_point, remainingToDeduct);
      if (deductFromPaid > 0) {
        paidDeductionList.push({
          historyId: recharge.id,
          deductAmount: deductFromPaid
        });
        remainingToDeduct -= deductFromPaid;
      }
    }
  }

  // 💡 3단계: 최종 검증 (잔액 부족 여부)
  if (remainingToDeduct > 0) {
    return {
      isValid: false,
      error: '잔액이 부족하여 결제를 진행할 수 없습니다.'
    };
  }

  nvLog('AT', `▶️ RA_CALC_DEDUCTION_FIFO 계획 수립 완료`, {
    requiredPoints,
    bonusDeduction,
    paidCount: paidDeductionList.length
  });

  return {
    isValid: true,
    data: {
      bonusDeduction,
      paidDeductionList
    }
  };
};
