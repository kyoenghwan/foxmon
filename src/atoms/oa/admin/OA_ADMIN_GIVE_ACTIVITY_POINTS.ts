import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

interface GiveActivityPointsInput {
  userId: string;
  amountDiff: number;
  description: string;
  adminId: string;
}

export async function OA_ADMIN_GIVE_ACTIVITY_POINTS(input: GiveActivityPointsInput) {
  const { userId, amountDiff, description, adminId } = input;
  
  try {
    nvLog('AT', `▶️ OA_ADMIN_GIVE_ACTIVITY_POINTS 시작`, input);

    // 1. 현재 포인트 조회
    const { data: userCurrent, error: userError } = await supabaseAdmin
      .from('users')
      .select('activity_points')
      .eq('id', userId)
      .single();

    if (userError) throw new Error(`사용자 정보 조회 실패: ${userError.message}`);

    const newActivityPoints = Number(userCurrent.activity_points || 0) + amountDiff;

    // 2. 포인트 잔액 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        activity_points: newActivityPoints,
      })
      .eq('id', userId);

    if (updateError) throw new Error(`활동 포인트 잔액 업데이트 실패: ${updateError.message}`);

    // 3. 트랜잭션 기록 (activity_point_transactions)
    const { error: logError } = await supabaseAdmin
      .from('activity_point_transactions')
      .insert({
        user_id: userId,
        type: 'ADMIN_ADJUST',
        amount: amountDiff,
        balance_after: newActivityPoints,
        description: `[관리자수동] ${description}`,
      });

    if (logError) {
      nvLog('AT', `⚠️ 활동 포인트 로그 기록 실패 (단, 잔액은 변경됨)`, logError.message);
    }

    nvLog('AT', `✅ OA_ADMIN_GIVE_ACTIVITY_POINTS 완료`);
    return { success: true };
  } catch (error: any) {
    nvLog('AT', `❌ OA_ADMIN_GIVE_ACTIVITY_POINTS 에러`, error.message);
    return { success: false, message: error.message };
  }
}
