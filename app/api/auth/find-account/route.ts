import { NextResponse } from 'next/server';
import { nvLog } from '@/lib/logger';
import { FA_FIND_ACCOUNT_FLOW } from '@/src/atoms/fa/auth/FA_FIND_ACCOUNT_FLOW';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, name, phoneNumber, loginId, newPassword } = body;

    nvLog('FW', '계정 찾기/비밀번호 재설정 API 요청 시도', { mode, name });

    const result = await FA_FIND_ACCOUNT_FLOW({
      mode,
      name,
      phoneNumber,
      loginId,
      newPassword,
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    nvLog('FW', '계정 찾기 API 에러', error);
    return NextResponse.json(
      { success: false, message: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
