import { createClient } from '@/utils/supabase/server';
import { nvLog } from '@/lib/logger';

interface ActivePointPolicy {
  firstChargeBonusRatio: number;
  maxFirstBonus: number;
  refundFeeRatio: number;
  refundDivisor: number;
}

/**
 * [QA] QA_GET_ACTIVE_POINT_POLICY
 * 결제 시점(NOW)에 유효한 전역 포인트 정책(보너스 %, 상한선, 수수료 등)을 조회합니다.
 */
export const QA_GET_ACTIVE_POINT_POLICY = async (): Promise<ActivePointPolicy> => {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // 💡 스케줄링 기반: effective_at <= NOW() 중 최신 항목 조회
  const { data: policies, error } = await supabase
    .from('point_policies')
    .select('config_key, config_value')
    .lte('start_at', now)
    .order('start_at', { ascending: false });

  if (error) {
    nvLog('AT', `❌ QA_GET_ACTIVE_POINT_POLICY 에러`, error);
    // 💡 기본값 폴백 (DB 장애 시 최소 안정성 보장)
    return {
      firstChargeBonusRatio: 0.5,
      maxFirstBonus: 300000,
      refundFeeRatio: 0.1,
      refundDivisor: 1.5
    };
  }

  // 💡 조회된 설정값 매핑 (키 기반)
  const getPolicyValue = (key: string, defaultValue: number) => {
    const item = policies?.find(p => p.config_key === key);
    return item ? Number(item.config_value) : defaultValue;
  };

  const result = {
    firstChargeBonusRatio: getPolicyValue('FIRST_CHARGE_BONUS_RATIO', 0.5),
    maxFirstBonus: getPolicyValue('MAX_FIRST_CHARGE_BONUS', 300000),
    refundFeeRatio: getPolicyValue('REFUND_FEE_RATIO', 0.1),
    refundDivisor: getPolicyValue('REFUND_DIVISOR', 1.5)
  };

  nvLog('AT', `▶️ QA_GET_ACTIVE_POINT_POLICY 조회 완료`, result);

  return result;
};
