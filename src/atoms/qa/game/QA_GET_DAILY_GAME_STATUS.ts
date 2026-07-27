import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import type { AtomErrorCode } from '../../da/common/DA_COMMON_ERROR_TYPES';

export type DailyGameStatus = {
  roulettePlayed: boolean;
  luckyBoxPlayed: boolean;
  attendancePlayed: boolean;
  retroPlayed: boolean;
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
    const nowKst = new Date(Date.now() + kstOffset);
    const todayKstStr = nowKst.toISOString().split('T')[0];

    // Today start and end for UTC timestamp checking
    const todayStartKst = new Date(nowKst);
    todayStartKst.setUTCHours(0, 0, 0, 0);
    const todayStartUtc = new Date(todayStartKst.getTime() - kstOffset);

    // 1. user_game_logs 조회 (participation_date 또는 created_at 기준)
    const { data: logs, error } = await supabaseAdmin
      .from('user_game_logs')
      .select('game_type, created_at, participation_date')
      .eq('user_id', input.userId)
      .or(`participation_date.eq.${todayKstStr},created_at.gte.${todayStartUtc.toISOString()}`);

    if (error) {
      nvLog('AT', '❌ QA_GET_DAILY_GAME_STATUS 에러', error);
      return { success: false, errorCode: 'INTERNAL_ERROR', message: '참여 이력 조회 중 오류가 발생했습니다.' };
    }

    // 2. attendance_logs 출석체크 테이블 별도 확인
    const { data: attLog } = await supabaseAdmin
      .from('attendance_logs')
      .select('id')
      .eq('user_id', input.userId)
      .or(`attendance_date.eq.${todayKstStr},created_at.gte.${todayStartUtc.toISOString()}`)
      .maybeSingle();

    const playedTypes = logs?.map(log => String(log.game_type).toUpperCase()) || [];

    const isAttendanceDone = attLog !== null || playedTypes.includes('ATTENDANCE');
    const isRouletteDone = playedTypes.includes('ROULETTE');
    const isLuckyBoxDone = playedTypes.includes('LUCKY_BOX') || playedTypes.includes('LUCKYBOX') || playedTypes.includes('BOX');
    const isRetroDone = playedTypes.includes('RETRO_DRAW') || playedTypes.includes('RETRO') || playedTypes.includes('DRAW');

    const status: DailyGameStatus = {
      roulettePlayed: isRouletteDone,
      luckyBoxPlayed: isLuckyBoxDone,
      attendancePlayed: isAttendanceDone,
      retroPlayed: isRetroDone
    };

    console.log(`🎮 [QA_GET_DAILY_GAME_STATUS] 유저 ${input.userId} 일일 게임 상태:`, status);

    return {
      success: true,
      data: status
    };
  } catch (err: any) {
    nvLog('AT', '❌ QA_GET_DAILY_GAME_STATUS 예외', err);
    return { success: false, errorCode: 'INTERNAL_ERROR', message: err.message || '시스템 오류가 발생했습니다.' };
  }
}
