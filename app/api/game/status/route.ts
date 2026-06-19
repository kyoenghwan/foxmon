import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import { QA_GET_CURRENT_RETRO_BOARD } from '@/src/atoms/qa/game/QA_GET_CURRENT_RETRO_BOARD';
import { QA_GET_DAILY_GAME_STATUS } from '@/src/atoms/qa/game/QA_GET_DAILY_GAME_STATUS';
import { OA_INITIALIZE_RETRO_BOARD } from '@/src/atoms/oa/game/OA_INITIALIZE_RETRO_BOARD';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    // 1. 현재 뽑기판 조회
    let boardResult = await QA_GET_CURRENT_RETRO_BOARD();
    if (!boardResult.success) {
      return NextResponse.json({ success: false, message: boardResult.message }, { status: 500 });
    }

    // 진행 중인 보드가 전혀 없다면 자동 개설
    if (boardResult.data === null) {
      nvLog('FW', '⚠️ 활성화된 뽑기판이 없어 자동 개설을 진행합니다.');
      const initResult = await OA_INITIALIZE_RETRO_BOARD({});
      if (!initResult.success) {
        return NextResponse.json({ success: false, message: '뽑기판 초기화 실패' }, { status: 500 });
      }
      // 개설 후 다시 조회
      boardResult = await QA_GET_CURRENT_RETRO_BOARD();
    }

    // 2. 로그인된 경우 참여 여부 및 포인트 조회
    let dailyStatus = {
      roulettePlayed: false,
      luckyBoxPlayed: false,
      lottoPlayed: false,
    };
    let activityPoints = 0;

    if (userId) {
      const dailyResult = await QA_GET_DAILY_GAME_STATUS({ userId });
      if (dailyResult.success && dailyResult.data) {
        dailyStatus = dailyResult.data;
      }

      const { data: user } = await supabaseAdmin
        .from('users')
        .select('activity_points')
        .eq('id', userId)
        .single();

      if (user) {
        activityPoints = Number(user.activity_points);
      }
    }

    return NextResponse.json({
      success: true,
      retroBoard: boardResult.data,
      dailyStatus,
      activityPoints,
    });
  } catch (err: any) {
    nvLog('FW', '❌ /api/game/status GET 에러', err.message);
    return NextResponse.json({ success: false, message: '게임 현황 조회 중 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
