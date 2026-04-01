import { nvLog } from '@/lib/logger';
import { QA_GET_ACTIVE_POINT_POLICY } from '@/src/atoms/qa/points/QA_GET_ACTIVE_POINT_POLICY';
import { QA_GET_USER_RECHARGE_CONTEXT } from '@/src/atoms/qa/points/QA_GET_USER_RECHARGE_CONTEXT';
import { RA_CALC_RECHARGE_BONUS } from '@/src/atoms/ra/points/RA_CALC_RECHARGE_BONUS';
import { OA_EXECUTE_POINT_RECHARGE } from '@/src/atoms/oa/points/OA_EXECUTE_POINT_RECHARGE';

interface RechargeFlowInput {
  userId: string;
  cashAmount: number;
}

interface RechargeFlowOutput {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

/**
 * [FA] FA_RECHARGE_POINT_FLOW
 * 포인트 정책 조회부터 보너스 산출, 최종 DB 반영까지 아우르는 통합 충전 플로우 원자입니다.
 */
export const FA_RECHARGE_POINT_FLOW = async (input: RechargeFlowInput): Promise<RechargeFlowOutput> => {
  const { userId, cashAmount } = input;

  try {
    nvLog('AT', `▶️ FA_RECHARGE_POINT_FLOW 시작`, input);

    // 💡 1단계: 전역 포인트 정책 조회 (QA)
    const policy = await QA_GET_ACTIVE_POINT_POLICY();

    // 💡 2단계: 사용자 결제 컨텍스트 조회 (QA)
    const context = await QA_GET_USER_RECHARGE_CONTEXT(userId);
    if (!context) {
      throw new Error('사용자 정보를 조회할 수 없습니다.');
    }

    // 💡 3단계: 보너스 포인트 산출 (RA - Pure Logic)
    const calculation = RA_CALC_RECHARGE_BONUS({
      cashAmount,
      isFirstCharge: !context.hasFirstCharged,
      bonusRatio: context.currentTierRatio,
      maxFirstBonus: policy.maxFirstBonus
    });

    if (!calculation.isValid) {
      throw new Error(calculation.error || '보너스 계산 중 오류가 발생했습니다.');
    }

    // 💡 4단계: DB 트랜잭션 실행 (OA)
    const result = await OA_EXECUTE_POINT_RECHARGE({
      userId,
      cashAmount,
      bonusAmount: calculation.bonusAmount,
      isFirstCharge: calculation.appliedType === 'FIRST',
      bonusRatio: calculation.appliedType === 'FIRST' ? policy.firstChargeBonusRatio : context.currentTierRatio
    });

    if (!result.success) {
      throw new Error(result.error || '포인트 충전 처리 중 오류가 발생했습니다.');
    }

    const message = calculation.appliedType === 'FIRST'
      ? `첫 충전 50% 혜택이 적용되어 총 ${cashAmount + calculation.bonusAmount}포인트가 충전되었습니다.`
      : `현재 ${context.currentTier} 등급 혜택이 적용되어 총 ${cashAmount + calculation.bonusAmount}포인트가 충전되었습니다.`;

    nvLog('AT', `✅ FA_RECHARGE_POINT_FLOW 성공`, { userId, totalPoint: cashAmount + calculation.bonusAmount });

    return {
      success: true,
      data: {
        rechargeId: result.data.rechargeId,
        cashAmount,
        bonusAmount: calculation.bonusAmount,
        totalAmount: cashAmount + calculation.bonusAmount
      },
      message
    };
  } catch (error: any) {
    nvLog('AT', `❌ FA_RECHARGE_POINT_FLOW 에러`, error.message);
    return {
      success: false,
      error: error.message,
      message: '포인트 충전에 실패했습니다. 고객센터로 문의해 주세요.'
    };
  }
};
