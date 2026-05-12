import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

interface GivePointsInput {
  userId: string;
  paidPointsDiff: number;
  bonusPointsDiff: number;
  description: string;
  adminId: string;
}

export async function OA_ADMIN_GIVE_POINTS(input: GivePointsInput) {
  const { userId, paidPointsDiff, bonusPointsDiff, description, adminId } = input;
  
  try {
    nvLog('AT', `▶️ OA_ADMIN_GIVE_POINTS 시작`, input);

    // 1. 현재 포인트 조회
    const { data: userCurrent, error: userError } = await supabaseAdmin
      .from('users')
      .select('paid_points, bonus_points')
      .eq('id', userId)
      .single();

    if (userError) throw new Error(`사용자 정보 조회 실패: ${userError.message}`);

    const newPaidPoints = Number(userCurrent.paid_points || 0) + paidPointsDiff;
    const newBonusPoints = Number(userCurrent.bonus_points || 0) + bonusPointsDiff;
    const totalDiff = paidPointsDiff + bonusPointsDiff;

    // 2. 포인트 잔액 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        paid_points: newPaidPoints,
        bonus_points: newBonusPoints,
      })
      .eq('id', userId);

    if (updateError) throw new Error(`포인트 잔액 업데이트 실패: ${updateError.message}`);

    // 3. 트랜잭션 기록
    const { error: logError } = await supabaseAdmin
      .from('point_transactions')
      .insert({
        user_id: userId,
        type: totalDiff >= 0 ? 'CHARGE' : 'DEDUCTION',
        amount: Math.abs(totalDiff),
        balance_after: newPaidPoints + newBonusPoints,
        description: `[관리자수동] ${description}`,
      });

    if (logError) {
      nvLog('AT', `⚠️ 포인트 로그 기록 실패 (단, 잔액은 변경됨)`, logError.message);
    }

    // 4. (버그 픽스) 유료 포인트 추가 지급 시 반드시 영수증(point_recharge_history) 발행
    if (paidPointsDiff > 0) {
      const { error: historyError } = await supabaseAdmin
        .from('point_recharge_history')
        .insert({
          user_id: userId,
          cash_amount: paidPointsDiff,
          point_amount: paidPointsDiff,
          remained_point: paidPointsDiff,
          bonus_ratio: 0,
          is_first_charge: false
        });
      if (historyError) {
        nvLog('AT', `⚠️ 유료포인트 영수증 발행 실패`, historyError.message);
      }
    }

    nvLog('AT', `✅ OA_ADMIN_GIVE_POINTS 완료`);
    return { success: true };
  } catch (error: any) {
    nvLog('AT', `❌ OA_ADMIN_GIVE_POINTS 에러`, error.message);
    return { success: false, message: error.message };
  }
}
