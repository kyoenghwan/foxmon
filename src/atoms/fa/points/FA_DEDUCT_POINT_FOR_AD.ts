import { nvLog } from '@/lib/logger';
import { QA_GET_DEDUCTION_CONTEXT } from '@/src/atoms/qa/points/QA_GET_DEDUCTION_CONTEXT';
import { RA_CALC_DEDUCTION_FIFO } from '@/src/atoms/ra/points/RA_CALC_DEDUCTION_FIFO';
import { OA_EXECUTE_BATCH_DEDUCTION } from '@/src/atoms/oa/points/OA_EXECUTE_BATCH_DEDUCTION';

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
    console.log(`💳 [FA_DEDUCT_POINT_FOR_AD 1/3] 포인트 차감 진입 - 유저ID: ${userId}, 차감요청: ${adPrice.toLocaleString()} P, 설명: ${description}`);

    // 💡 1단계: 차감 대상 데이터 조회 (QA)
    const contextResult = await QA_GET_DEDUCTION_CONTEXT(userId);
    if (!contextResult.success || !contextResult.data) {
      console.error(`❌ [FA_DEDUCT_POINT_FOR_AD 1/3 실패] QA_GET_DEDUCTION_CONTEXT 실패:`, contextResult);
      throw new Error(contextResult.error || '사용자 포인트 정보를 조회할 수 없습니다.');
    }
    const context = contextResult.data;
    console.log(`💳 [FA_DEDUCT_POINT_FOR_AD 1/3 성공] 컨텍스트 - 보너스: ${context.bonusPoints}P, 유료 DB 잔액: ${context.paidPoints}P, 내역 차감가능 총액: ${context.activeRecharges.reduce((acc: number, r: any) => acc + r.remained_point, 0)}P`);

    // 💡 2단계: FIFO 차감 계획 시뮬레이션 (RA - Pure Logic)
    const calculationResult = RA_CALC_DEDUCTION_FIFO({
      requiredPoints: adPrice,
      currentBonusBalance: context.bonusPoints,
      activeRecharges: context.activeRecharges
    });

    if (!calculationResult.isValid || !calculationResult.data) {
      console.error(`❌ [FA_DEDUCT_POINT_FOR_AD 2/3 실패] RA_CALC_DEDUCTION_FIFO 실패:`, calculationResult);
      throw new Error(calculationResult.error || `잔액이 부족합니다. (요청: ${adPrice.toLocaleString()} P, 보유 보너스: ${context.bonusPoints} P, 유료 잔액: ${context.paidPoints} P)`);
    }
    const calculation = calculationResult.data;
    console.log(`💳 [FA_DEDUCT_POINT_FOR_AD 2/3 성공] 차감 플랜 시뮬레이션 완료:`, calculation);

    // 💡 3단계: DB 차감 트랜잭션 실행 (OA)
    const result = await OA_EXECUTE_BATCH_DEDUCTION({
      userId,
      bonusDeduction: calculation.bonusDeduction,
      totalDeduction: adPrice,
      paidDeductionList: calculation.paidDeductionList,
      description: description
    });

    if (!result.success) {
      console.error(`❌ [FA_DEDUCT_POINT_FOR_AD 3/3 실패] OA_EXECUTE_BATCH_DEDUCTION 실패:`, result);
      throw new Error(result.error || '포인트 차감 처리 중 오류가 발생했습니다.');
    }

    console.log(`✅ [FA_DEDUCT_POINT_FOR_AD 3/3 성공] 최종 차감 성공! (${adPrice.toLocaleString()} P 차감 완료)`);

    return {
      success: true,
      message: `성공적으로 ${adPrice}포인트가 차감되었습니다.`
    };
  } catch (error: any) {
    console.error(`❌ [FA_DEDUCT_POINT_FOR_AD 최종 예외 발생]`, error);
    return {
      success: false,
      error: error.message,
      message: error?.message || '포인트 결제 처리 중 오류가 발생했습니다.'
    };
  }
};
