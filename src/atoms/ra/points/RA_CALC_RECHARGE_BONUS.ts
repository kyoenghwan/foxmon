import { nvLog } from '@/lib/logger';

interface RechargeBonusInput {
  cashAmount: number;
  isFirstCharge: boolean;
  bonusRatio: number; // 등급별 비율 (0.1 ~ 0.3)
  maxFirstBonus: number; // 기본 300,000 (관리자 설정값)
}

interface RechargeBonusOutput {
  isValid: boolean;
  bonusAmount: number;
  appliedType: 'FIRST' | 'TIER';
  error?: string;
}

/**
 * [RA] RA_CALC_RECHARGE_BONUS
 * 첫 충전 50% 혜택(상한선 적용) 또는 등급별 보너스 포인트를 산출하는 순수 함수 원자입니다.
 */
export const RA_CALC_RECHARGE_BONUS = (input: RechargeBonusInput): RechargeBonusOutput => {
  const { cashAmount, isFirstCharge, bonusRatio, maxFirstBonus } = input;

  if (cashAmount <= 0) {
    return { isValid: false, bonusAmount: 0, appliedType: 'TIER', error: '충전 금액이 0보다 커야 합니다.' };
  }

  let bonusAmount = 0;
  let appliedType: 'FIRST' | 'TIER' = 'TIER';

  if (isFirstCharge) {
    // 💡 첫 충전 혜택: 충전 금액의 50%
    const calculatedBonus = Math.floor(cashAmount * 0.5);
    // 💡 최대 상한선(Max Cap) 적용
    bonusAmount = Math.min(calculatedBonus, maxFirstBonus);
    appliedType = 'FIRST';
  } else {
    // 💡 일반 등급별 적립 혜택
    bonusAmount = Math.floor(cashAmount * bonusRatio);
    appliedType = 'TIER';
  }

  nvLog('AT', `▶️ RA_CALC_RECHARGE_BONUS 계산 완료`, { ...input, bonusAmount, appliedType });

  return {
    isValid: true,
    bonusAmount,
    appliedType
  };
};
