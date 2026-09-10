const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sql = `
    -- notices 테이블에 target_role 컬럼 추가 (기본값 'ALL')
    ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS target_role VARCHAR(20) NOT NULL DEFAULT 'ALL';

    -- faqs 테이블에 target_role 컬럼 추가 (기본값 'ALL')
    ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS target_role VARCHAR(20) NOT NULL DEFAULT 'ALL';

    -- target_role 값 제약 조건 추가
    ALTER TABLE public.notices DROP CONSTRAINT IF EXISTS notices_target_role_check;
    ALTER TABLE public.notices ADD CONSTRAINT notices_target_role_check CHECK (target_role IN ('ALL', 'EMPLOYER', 'GENERAL'));

    ALTER TABLE public.faqs DROP CONSTRAINT IF EXISTS faqs_target_role_check;
    ALTER TABLE public.faqs ADD CONSTRAINT faqs_target_role_check CHECK (target_role IN ('ALL', 'EMPLOYER', 'GENERAL'));
`;

async function runPg() {
    if (!process.env.DATABASE_URL) {
        console.log("DATABASE_URL이 설정되어 있지 않습니다.");
        return false;
    }
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    try {
        await client.connect();
        console.log("🟢 pg: PostgreSQL에 성공적으로 연결되었습니다.");
        await client.query(sql);
        console.log("🟢 pg: target_role 컬럼 추가 및 제약 조건 적용 완료!");
        return true;
    } catch (err) {
        console.error("❌ pg: PostgreSQL 실행 에러:", err);
        return false;
    } finally {
        await client.end();
    }
}

async function runSupabaseRpc() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.log("Supabase 설정이 누락되었습니다.");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("🟢 rpc: Supabase RPC를 통해 실행을 시도합니다. URL:", supabaseUrl);
    try {
        const { data, error } = await supabase.rpc('execute_sql', { sql });
        if (error) {
            console.error("❌ rpc: Supabase RPC 실행 실패:", error);
        } else {
            console.log("🟢 rpc: Supabase RPC 실행 성공! 결과:", data || "성공");
        }
    } catch (err) {
        console.error("❌ rpc: Supabase RPC 예외 에러:", err);
    }
}

async function main() {
    const pgSuccess = await runPg();
    if (!pgSuccess) {
        await runSupabaseRpc();
    }
}

main();
