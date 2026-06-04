import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const sql = `
            -- 1. jobs 테이블 제약조건 변경
            ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_tier_check;
            ALTER TABLE public.jobs ADD CONSTRAINT jobs_tier_check CHECK (tier IN ('PREMIUM_MAIN', 'SIDE', 'PREMIUM', 'SPECIAL', 'GENERAL', 'AD_GENERAL'));

            -- 2. biz_ads 테이블 제약조건 변경
            ALTER TABLE public.biz_ads DROP CONSTRAINT IF EXISTS jobs_tier_check;
            ALTER TABLE public.biz_ads DROP CONSTRAINT IF EXISTS biz_ads_tier_check;
            ALTER TABLE public.biz_ads ADD CONSTRAINT jobs_tier_check CHECK (tier IN ('PREMIUM_MAIN', 'SIDE', 'PREMIUM', 'SPECIAL', 'GENERAL', 'AD_GENERAL'));
        `;

        const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql });

        if (error) {
            console.error("Migration Error:", error);
            return NextResponse.json({ success: false, error: error.message || error });
        }

        return NextResponse.json({ success: true, message: "Constraints successfully updated!", data });
    } catch (err: any) {
        console.error("Migration Exception:", err);
        return NextResponse.json({ success: false, error: err.message || err });
    }
}
