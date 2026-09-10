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
    // 단일 SELECT 문 실행으로 복구된 스페셜 광고들 상태 확인
    const checkSql = `
        SELECT 'jobs' as source, id, title, company_name, tier, status, updated_at FROM public.jobs WHERE tier = 'SPECIAL' AND status = 'ACTIVE'
        UNION ALL
        SELECT 'biz_ads' as source, id, title, company_name, tier, status, updated_at FROM public.biz_ads WHERE tier = 'SPECIAL' AND status = 'ACTIVE';
    `;

    try {
        const { data, error } = await supabase.rpc('execute_sql', { sql: checkSql });
        if (error) {
            console.error("조회 실패:", error);
            return;
        }
        console.log("현재 활성화된 스페셜 광고 목록:", data);
    } catch (err) {
        console.error("예외 발생:", err);
    }
}

main();
