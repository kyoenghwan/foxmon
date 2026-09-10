const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.log("Supabase 설정이 누락되었습니다.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
    // 고의로 예외를 발생시켜 데이터를 에러 메시지로 넘겨받는 PL/pgSQL 블록 작성
    const sql = `
        DO $$
        DECLARE
            v_res text;
        BEGIN
            SELECT json_build_object(
                'jobs_deleted_special', (
                    SELECT json_agg(t) FROM (
                        SELECT id, title, company_name, tier, status FROM public.jobs WHERE tier = 'SPECIAL'
                    ) t
                ),
                'biz_ads_deleted_special', (
                    SELECT json_agg(t) FROM (
                        SELECT id, title, company_name, tier, status FROM public.biz_ads WHERE tier = 'SPECIAL'
                    ) t
                ),
                'all_deleted_status_counts', (
                    SELECT json_agg(t) FROM (
                        SELECT tier, status, count(*) 
                        FROM (
                            SELECT tier, status FROM public.jobs
                            UNION ALL
                            SELECT tier, status FROM public.biz_ads
                        ) all_t
                        GROUP BY tier, status
                    ) t
                )
            )::text INTO v_res;
            
            RAISE EXCEPTION 'RESULT_DATA:%', v_res;
        END;
        $$;
    `;

    try {
        console.log("RPC 예외 강제 발생 기법으로 DB 상태 조회 중...");
        const { data, error } = await supabase.rpc('execute_sql', { sql });
        if (error) {
            console.error("RPC 실행 에러:", error);
            return;
        }
        console.log("Raw RPC Return (이 메시지가 보인다면 예외 발생 실패):", data);
    } catch (err) {
        console.error("예외 발생:", err);
    }
}

main();
