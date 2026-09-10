const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const sql = `
    -- jobs 테이블 제약 조건 변경
    ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
    ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check CHECK (status IN ('ACTIVE', 'PAUSED', 'EXPIRED', 'DELETED'));

    -- biz_ads 테이블 제약 조건 변경
    ALTER TABLE public.biz_ads DROP CONSTRAINT IF EXISTS jobs_status_check;
    ALTER TABLE public.biz_ads DROP CONSTRAINT IF EXISTS biz_ads_status_check;
    ALTER TABLE public.biz_ads ADD CONSTRAINT biz_ads_status_check CHECK (status IN ('ACTIVE', 'PAUSED', 'EXPIRED', 'DELETED'));
`;

async function runPg() {
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    if (!process.env.DATABASE_URL) {
        console.log("DATABASE_URL이 설정되어 있지 않습니다.");
        return;
    }
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    try {
        await client.connect();
        console.log("PostgreSQL에 성공적으로 연결되었습니다.");
        await client.query(sql);
        console.log("PostgreSQL 제약 조건 수정 성공!");
    } catch (err) {
        console.error("PostgreSQL 실행 에러:", err);
    } finally {
        await client.end();
    }
}

async function runSupabaseRpc() {
    // Supabase RPC를 통한 시도
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.log("Supabase 설정이 누락되었습니다.");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Supabase RPC를 통해 실행을 시도합니다. URL:", supabaseUrl);
    try {
        const { data, error } = await supabase.rpc('execute_sql', { sql });
        if (error) {
            console.error("Supabase RPC 실행 실패:", error);
        } else {
            console.log("Supabase RPC 실행 성공! 결과:", data || "성공 메시지 없음");
        }
    } catch (err) {
        console.error("Supabase RPC 예외 에러:", err);
    }
}

async function main() {
    await runPg();
    await runSupabaseRpc();
}

main();
