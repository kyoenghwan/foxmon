import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';

// Vercel Cron Job 호출 전용 API
// 참고: vercel.json에 crons 설정 추가 필요
export async function GET(request: Request) {
    nvLog('AT', '▶️ CRON: check-biz-status 실행 시작');

    // Vercel Cron 보안 검증 (실제 프로덕션에서 활성화 필요)
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new Response('Unauthorized', { status: 401 });
    // }

    try {
        // 1. DB에서 인증된 사업자(is_business_verified = true) 목록 전체 가져오기
        /*
        const { data: verifiedUsers, error } = await supabaseAdmin
            .from('users')
            .select('id, business_registration_number, verified_business_name')
            .eq('is_business_verified', true);
        */

        // 2. 국세청 '상태조회' API에 배열(최대 100개씩)로 사업자번호 전송
        // 3. 응답 결과 중 '폐업자' 상태인 번호 추출
        // 4. 폐업자 유저들의 is_business_verified를 false로 강등 (supabaseAdmin.update)
        // 5. 해당 유저들의 활성 광고를 '숨김' 또는 '검수요망' 상태로 변경
        // 6. 쪽지/알림 자동 발송 로직 추가

        nvLog('AT', '✅ CRON: check-biz-status 실행 완료 (TODO 구현 필요)');
        return NextResponse.json({ success: true, message: 'Cron Job Triggered' });
    } catch (error: any) {
        nvLog('AT', '❌ CRON 에러', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
