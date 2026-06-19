import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { FA_WITHDRAW_USER_FLOW } from '@/src/atoms/fa/auth/FA_WITHDRAW_USER_FLOW';
import { nvLog } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST() {
  nvLog('AT', '▶️ POST /api/auth/withdraw 요청 시작');

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const userId = session.user.id;

    // 회원 탈퇴 흐름 실행 (물리 계정 삭제 & CI 탈퇴 일시 갱신 & 롤백 보장)
    const result = await FA_WITHDRAW_USER_FLOW({ userId });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message || '회원 탈퇴 처리 중 오류가 발생했습니다.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '회원 탈퇴가 성공적으로 완료되었습니다.'
    });

  } catch (err: any) {
    nvLog('AT', '❌ POST /api/auth/withdraw 시스템 예외', err);
    return NextResponse.json({
      success: false,
      message: err.message || '시스템 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
