import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { nvLog } from '@/lib/logger';
import { FA_PLAY_MINI_GAME_FLOW } from '@/src/atoms/fa/game/FA_PLAY_MINI_GAME_FLOW';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const { gameType } = body;

    if (!gameType || !['ROULETTE', 'LUCKY_BOX', 'LOTTO'].includes(gameType)) {
      return NextResponse.json({ success: false, message: '올바르지 않은 게임 타입입니다.' }, { status: 400 });
    }

    const result = await FA_PLAY_MINI_GAME_FLOW({
      userId,
      gameType,
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message || '게임 진행 중 오류가 발생했습니다.',
        errorCode: result.errorCode,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (err: any) {
    nvLog('FW', '❌ /api/game/play POST 에러', err.message);
    return NextResponse.json({ success: false, message: '게임 처리 중 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
