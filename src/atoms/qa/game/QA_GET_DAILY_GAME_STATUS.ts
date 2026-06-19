import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import type { AtomErrorCode } from '../../da/common/DA_COMMON_ERROR_TYPES';

export type DailyGameStatus = {
  roulettePlayed: boolean;
  luckyBoxPlayed: boolean;
  attendancePlayed: boolean;
};

export async function QA_GET_DAILY_GAME_STATUS(input: {
  userId: string;
}): Promise<{
  success: boolean;
  data?: DailyGameStatus;
  message?: string;
  errorCode?: AtomErrorCode;
}> {
  nvLog('AT', '▶️ QA_GET_DAILY_GAME_STATUS 시작', { userId: input.userId });

  if (!input.userId) {
    return { success: false, errorCode: 'VALIDATION_FAILED', message: '사용자 ID가 누락되었습니다.' };
  }

  try {
    const kstOffset = 9 * 60 * 60 * 1000;
    const todayKstStr = new Date(Date.now() + kstOffset).toISOString().split('T')[0];

    const { data: logs, error } = await supabaseAdmin
      .from('user_game_logs')
      .select('game_type')
      .eq('user_id', input.userId)
      .eq('participation_date', todayKstStr);

    if (error) {
      nvLog('AT', '❌ QA_GET_DAILY_GAME_STATUS 에러', error);
      return { success: false, errorCode: 'INTERNAL_ERROR', message: '참여 이력 조회 중 오류가 발생했습니다.' };
    }

    const playedTypes = logs?.map(log => log.game_type) || [];

    const status: DailyGameStatus = {
      roulettePlayed: playedTypes.includes('ROULETTE'),
      luckyBoxPlayed: playedTypes.includes('LUCKY_BOX'),
      attendancePlayed: playedTypes.includes('ATTENDANCE')
    };

    return {
      success: true,
      data: status
    };
  } catch (err: any) {
    nvLog('AT', '❌ QA_GET_DAILY_GAME_STATUS 예외', err);
    return { success: false, errorCode: 'INTERNAL_ERROR', message: err.message || '시스템 오류가 발생했습니다.' };
  }
}
