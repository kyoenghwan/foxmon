import { createClient } from '@/utils/supabase/server';
import { nvLog } from '@/lib/logger';

interface UserRechargeContext {
  userId: string;
  hasFirstCharged: boolean;
  currentTier: string;
  currentTierRatio: number; // 현재 등급에 지정된 보너스율
}

/**
 * [QA] QA_GET_USER_RECHARGE_CONTEXT
 * 결제 전 사용자의 첫 충전 여부 및 현재 등급에 따른 적립 혜택 정보를 조회합니다.
 */
export const QA_GET_USER_RECHARGE_CONTEXT = async (userId: string): Promise<{ success: boolean; data: UserRechargeContext | null; error: string | null }> => {
  const supabase = await createClient();

  // 💡 사용자의 기본 정보(첫 충전 여부, 등급) 조회
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, has_first_charged, merchant_tier')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    nvLog('AT', `❌ QA_GET_USER_RECHARGE_CONTEXT 사용자 조회 실패`, userError);
    return { success: false, data: null, error: userError?.message || '사용자 조회 실패' };
  }

  // 💡 현재 등급에 대한 설정 정보(적립율) 조회
  const { data: tierConfig, error: tierError } = await supabase
    .from('tier_configs')
    .select('bonus_ratio')
    .eq('tier_name', user.merchant_tier)
    .single();

  if (tierError) {
    nvLog('AT', `❌ QA_GET_USER_RECHARGE_CONTEXT 등급 설정 조회 실패`, tierError);
    // 💡 등급 설정 조회 실패 시 기본 0% 적립으로 반환
  }

  const result: UserRechargeContext = {
    userId: user.id,
    hasFirstCharged: user.has_first_charged,
    currentTier: user.merchant_tier,
    currentTierRatio: tierConfig?.bonus_ratio || 0
  };

  nvLog('AT', `▶️ QA_GET_USER_RECHARGE_CONTEXT 조회 완료`, result);

  return { success: true, data: result, error: null };
};
