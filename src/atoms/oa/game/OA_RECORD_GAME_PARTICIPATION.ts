import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import type { AtomErrorCode } from '../../da/common/DA_COMMON_ERROR_TYPES';

export async function OA_RECORD_GAME_PARTICIPATION(input: {
  userId: string;
  gameType: 'ROULETTE' | 'LUCKY_BOX' | 'ATTENDANCE';
  rewardAmount: number;
}): Promise<{
  success: boolean;
  message?: string;
  errorCode?: AtomErrorCode;
  rollbackData?: any;
}> {
  nvLog('AT', '▶️ OA_RECORD_GAME_PARTICIPATION 시작', { userId: input.userId, gameType: input.gameType });

  try {
    const kstOffset = 9 * 60 * 60 * 1000;
    const todayKstStr = new Date(Date.now() + kstOffset).toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('user_game_logs')
      .insert({
        user_id: input.userId,
        game_type: input.gameType,
        participation_date: todayKstStr,
        reward_amount: input.rewardAmount
      })
      .select()
      .single();

    if (error) {
      nvLog('AT', '❌ OA_RECORD_GAME_PARTICIPATION 에러', error);
      if (error.code === '23505') { // UNIQUE 제약 위반
        return { success: false, errorCode: 'CONFLICT', message: '오늘은 이미 해당 게임에 참여하셨습니다.' };
      }
      return { success: false, errorCode: 'INTERNAL_ERROR', message: '참여 정보 저장에 실패했습니다.' };
    }

    return {
      success: true,
      rollbackData: { logId: data.id, userId: input.userId, gameType: input.gameType }
    };
  } catch (err: any) {
    nvLog('AT', '❌ OA_RECORD_GAME_PARTICIPATION 예외', err);
    return { success: false, errorCode: 'INTERNAL_ERROR', message: err.message || '시스템 오류가 발생했습니다.' };
  }
}

// 롤백 함수
export async function OA_RECORD_GAME_PARTICIPATION_ROLLBACK(rollbackData: any): Promise<{ success: boolean }> {
  nvLog('AT', '🔄 OA_RECORD_GAME_PARTICIPATION_ROLLBACK 시작', { logId: rollbackData?.logId });
  if (!rollbackData || !rollbackData.logId) return { success: true };

  try {
    await supabaseAdmin
      .from('user_game_logs')
      .delete()
      .eq('id', rollbackData.logId);
    return { success: true };
  } catch (err) {
    nvLog('AT', '❌ OA_RECORD_GAME_PARTICIPATION_ROLLBACK 실패', err);
    return { success: false };
  }
}
