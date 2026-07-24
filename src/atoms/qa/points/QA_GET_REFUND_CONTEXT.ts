import { createClient } from '@/utils/supabase/server';
import { nvLog } from '@/lib/logger';

interface RefundRechargeItem {
  id: string;
  cash_amount: number;
  point_amount: number;
  remained_point: number;
  created_at: string;
}

interface RefundContext {
  userId: string;
  activeHistory: RefundRechargeItem[];
  policy: {
    refundFeeRatio: number;
  };
}

/**
 * [QA] QA_GET_REFUND_CONTEXT
 * 환불 가치 정산을 위해 사용자의 모든 유료 충전 이력 및 현재 환불 수수료 정책을 조회합니다.
 */
export const QA_GET_REFUND_CONTEXT = async (userId: string): Promise<{ success: boolean; data: RefundContext | null; error: string | null }> => {
  const supabase = await createClient();

  try {
    // 💡 1. 환불 정산의 대상이 되는 유료 충전 이력 조회 (FIFO 순서)
    const { data: history, error: historyError } = await supabase
      .from('point_recharge_history')
      .select('id, cash_amount, point_amount, remained_point, created_at')
      .eq('user_id', userId)
      .gt('cash_amount', 0) // 유료 결제건만 대상
      .order('created_at', { ascending: true });

    if (historyError) throw new Error(`충전 이력 조회 실패: ${historyError.message}`);

    // 💡 2. 현재 활성 중인 환불 수수료 정책 조회 (QA_GET_ACTIVE_POINT_POLICY 활용 가능하나 여기선 직접 조회)
    const now = new Date().toISOString();
    const { data: policyData, error: policyError } = await supabase
      .from('point_policies')
      .select('config_value')
      .eq('config_key', 'REFUND_FEE_RATIO')
      .lte('start_at', now)
      .order('start_at', { ascending: false })
      .limit(1)
      .single();

    const refundFeeRatio = policyError ? 0.1 : Number(policyData.config_value);

    const result = {
      userId,
      activeHistory: (history || []).map(h => ({
        id: h.id,
        cash_amount: Number(h.cash_amount),
        point_amount: Number(h.point_amount),
        remained_point: Number(h.remained_point),
        created_at: h.created_at
      })),
      policy: {
        refundFeeRatio
      }
    };

    nvLog('AT', `▶️ QA_GET_REFUND_CONTEXT 조회 완료`, { userId, historyCount: history?.length });

    return { success: true, data: result, error: null };
  } catch (error: any) {
    nvLog('AT', `❌ QA_GET_REFUND_CONTEXT 에러`, error.message);
    return { success: false, data: null, error: error.message };
  }
};
