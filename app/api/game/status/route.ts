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

    let isPostRewardAvailable = false;
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

      // 오늘 KST 기준 글쓰기 보상 적립 횟수 조회
      try {
        const kstOffset = 9 * 60 * 60 * 1000;
        const nowKst = new Date(Date.now() + kstOffset);
        
        const todayStartKst = new Date(nowKst);
        todayStartKst.setUTCHours(0, 0, 0, 0);
        const todayStartUtc = new Date(todayStartKst.getTime() - kstOffset);
        
        const todayEndKst = new Date(nowKst);
        todayEndKst.setUTCHours(23, 59, 59, 999);
        const todayEndUtc = new Date(todayEndKst.getTime() - kstOffset);

        const { count: postCount } = await supabaseAdmin
          .from('activity_point_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('type', 'POST')
          .gte('created_at', todayStartUtc.toISOString())
          .lte('created_at', todayEndUtc.toISOString());

        isPostRewardAvailable = (postCount !== null && postCount < 5);
      } catch (err) {
        nvLog('FW', '⚠️ status API 글작성 적립 카운트 조회 에러', err);
      }
    }

    return NextResponse.json({
      success: true,
      retroBoard: boardResult.data,
      dailyStatus,
      activityPoints,
      isPostRewardAvailable,
    });
  } catch (err: any) {
    nvLog('FW', '❌ /api/game/status GET 에러', err.message);
    return NextResponse.json({ success: false, message: '게임 현황 조회 중 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
