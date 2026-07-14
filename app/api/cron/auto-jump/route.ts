import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';

// 1시간마다 호출되는 Vercel Cron Job 용 API
export async function GET(request: Request) {
    nvLog('AT', '▶️ CRON: auto-jump 실행 시작');

    const autoJumpQuery = `
        -- 0. 만료 기간이 지난 자동 점프 옵션 복구 (유료에서 무료 4시간 주기로 강등)
        UPDATE public.jobs 
        SET option_jump = false, 
            jump_interval = 4 
        WHERE option_jump = true 
          AND option_jump_expires_at IS NOT NULL 
          AND option_jump_expires_at <= now();

        UPDATE public.biz_ads 
        SET option_jump = false, 
            jump_interval = 4 
        WHERE option_jump = true 
          AND option_jump_expires_at IS NOT NULL 
          AND option_jump_expires_at <= now();

        -- 1. jobs 테이블 (일반 구인 공고) 점프 대상 일괄 업데이트
        UPDATE public.jobs 
        SET last_jumped_at = now(), 
            last_exposed_at = now() 
        WHERE status = 'ACTIVE' 
          AND (last_jumped_at + (jump_interval * INTERVAL '1 hour')) <= now();

        -- 2. biz_ads 테이블 (배너 광고) 점프 대상 일괄 업데이트
        UPDATE public.biz_ads 
        SET last_jumped_at = now(), 
            last_exposed_at = now() 
        WHERE status = 'ACTIVE' 
          AND (last_jumped_at + (jump_interval * INTERVAL '1 hour')) <= now();
    `;

    try {
        console.log('Executing auto-jump batch update via execute_sql RPC...');
        const { data, error } = await supabase.rpc('execute_sql', { sql: autoJumpQuery });

        if (error) {
            nvLog('AT', '❌ CRON auto-jump 에러', error.message);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        nvLog('AT', '✅ CRON: auto-jump 실행 완료');
        return NextResponse.json({ success: true, message: 'Auto-jump successfully processed' });
    } catch (error: any) {
        nvLog('AT', '❌ CRON auto-jump 예외 발생', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
