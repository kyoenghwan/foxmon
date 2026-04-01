import { nvLog } from '@/lib/logger';
import { QA_GET_DEDUCTION_CONTEXT } from '@/atoms/qa/points/QA_GET_DEDUCTION_CONTEXT';
import { RA_CALC_DEDUCTION_FIFO } from '@/atoms/ra/points/RA_CALC_DEDUCTION_FIFO';
import { OA_EXECUTE_BATCH_DEDUCTION } from '@/atoms/oa/points/OA_EXECUTE_BATCH_DEDUCTION';

interface DeductFlowInput {
  userId: string;
  adPrice: number;
  description: string;
}

interface DeductFlowOutput {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * [FA] FA_DEDUCT_POINT_FOR_AD
 * 광고 등록 시 포인트를 보너스 우선 및 FIFO 방식으로 차감하는 통합 플로우 원자입니다.
 */
export const FA_DEDUCT_POINT_FOR_AD = async (input: DeductFlowInput): Promise<DeductFlowOutput> => {
  const { userId, adPrice, description } = input;

  try {
    nvLog('AT', `▶️ FA_DEDUCT_POINT_FOR_AD 시작`, input);

    // 💡 1단계: 차감 대상 데이터 조회 (QA)
    const context = await QA_GET_DEDUCTION_CONTEXT(userId);
    if (!context) {
      throw new Error('사용자 포인트 정보를 조회할 수 없습니다.');
    }

    // 💡 2단계: FIFO 차감 계획 시뮬레이션 (RA - Pure Logic)
    const calculation = RA_CALC_DEDUCTION_FIFO({
      requiredPoints: adPrice,
      currentBonusBalance: context.bonusPoints,
      activeRecharges: context.activeRecharges
    });

    if (!calculation.canDeduct) {
      throw new Error(calculation.error || '잔액이 부족하여 결제를 진행할 수 없습니다.');
    }

    // 💡 3단계: DB 차감 트랜잭션 실행 (OA)
    const result = await OA_EXECUTE_BATCH_DEDUCTION({
      userId,
      bonusDeduction: calculation.bonusDeduction,
      totalDeduction: adPrice,
      paidDeductionList: calculation.paidDeductionList,
      description: description
    });

    if (!result.success) {
      throw new Error(result.error || '포인트 차감 처리 중 오류가 발생했습니다.');
    }

    nvLog('AT', `✅ FA_DEDUCT_POINT_FOR_AD 성공`, { userId, adPrice });

    return {
      success: true,
      message: `성공적으로 ${adPrice}포인트가 차감되었습니다.`
    };
  } catch (error: any) {
    nvLog('AT', `❌ FA_DEDUCT_POINT_FOR_AD 에러`, error.message);
    return {
      success: false,
      error: error.message,
      message: '포인트 결제에 실패했습니다. 잔액을 확인해 주세요.'
    };
  }
};
