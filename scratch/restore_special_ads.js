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
    // 1. 복구 전 삭제된 스페셜 광고 조회
    const checkSql = `
        SELECT 'jobs' as source, id, title, company_name, tier, status FROM public.jobs WHERE status = 'DELETED' AND tier = 'SPECIAL'
        UNION ALL
        SELECT 'biz_ads' as source, id, title, company_name, tier, status FROM public.biz_ads WHERE status = 'DELETED' AND tier = 'SPECIAL';
    `;

    try {
        console.log("복구 전 스페셜 삭제 광고 조회 중...");
        const { data: beforeData, error: beforeErr } = await supabase.rpc('execute_sql', { sql: checkSql });
        if (beforeErr) {
            console.error("조회 실패:", beforeErr);
            return;
        }
        console.log("조회된 삭제된 스페셜 광고 목록:", beforeData);

        if (!beforeData || beforeData.length === 0) {
            console.log("복구할 삭제된 스페셜 광고가 없습니다.");
            return;
        }

        // 2. 복구 실행 (status -> ACTIVE)
        const updateSql = `
            UPDATE public.jobs SET status = 'ACTIVE', updated_at = now() WHERE status = 'DELETED' AND tier = 'SPECIAL';
            UPDATE public.biz_ads SET status = 'ACTIVE', updated_at = now() WHERE status = 'DELETED' AND tier = 'SPECIAL';
        `;
        console.log("스페셜 광고 복구 실행 중...");
        const { data: updateData, error: updateErr } = await supabase.rpc('execute_sql', { sql: updateSql });
        if (updateErr) {
            console.error("복구 실패:", updateErr);
            return;
        }
        console.log("복구 쿼리 실행 성공:", updateData || "성공");

        // 3. 캐시 무효화 RPC 또는 AdCache 관련 캐시 강제 무효화
        // Next.js 캐시 무효화를 위해 revalidatePath가 필요하지만, Node 스크립트에서는 직접 호출 불가능하므로
        // fetch 등으로 헬퍼를 부르거나, invalidateCache API가 있다면 호출할 수 있음.
        // 여기서는 캐시 무효화 함수를 ad-service에서 불러올 수는 없으나, 
        // 다행히 invalidateAdCache()는 어드민 페이지 로드 시 캐시를 날릴 수도 있고, 시간이 지나면 캐시가 만료됨.
        // 하지만 즉시 반영을 확인하기 위해, ad_service의 캐시를 날릴 수 있는 방안을 고려함.
    } catch (err) {
        console.error("예외 발생:", err);
    }
}

main();
