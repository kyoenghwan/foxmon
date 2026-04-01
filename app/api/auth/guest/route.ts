import { NextResponse } from 'next/server';
import { FA_GUEST_AUTH } from '@/src/atoms/fa/auth/FA_GUEST_AUTH';
import { nvLog } from '@/lib/logger';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { authMethod, userRawData } = body;

        nvLog('FW', '비회원 인증(Guest Auth) 요청 API 진입', { authMethod });

        // Execute the atomic guest authentication flow
        const result = await FA_GUEST_AUTH({ authMethod, userRawData });

        if (!result.success) {
            nvLog('FW', '비회원 인증 거부', { message: result.message });
            return NextResponse.json(
                { success: false, message: result.message },
                { status: 400 }
            );
        }

        nvLog('FW', '비회원 인증 성공. 임시 세션 발급 완료', { authMethod });
        return NextResponse.json(
            { success: true, message: result.message },
            { status: 200 }
        );

    } catch (error: any) {
        nvLog('FW', '비회원 인증 API 서버 내부 오류', error.message);
        return NextResponse.json(
            { success: false, message: '서버 내부 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
