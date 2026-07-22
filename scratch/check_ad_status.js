const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kgwvftaebjkjwwpsftqv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    // 최근 등록된 biz_ads 전체 조회 (최신순 10개)
    const { data, error } = await supabase
        .from('biz_ads')
        .select('id, title, tier, status, expires_at, created_at, company_name, location')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("=== 최근 biz_ads 10건 (최신순) ===");
    data.forEach((ad, i) => {
        const now = new Date();
        const expiresAt = ad.expires_at ? new Date(ad.expires_at) : null;
        const isExpired = expiresAt ? expiresAt < now : false;
        const isYear2000 = expiresAt ? expiresAt.getFullYear() === 2000 : false;
        
        console.log(`\n[${i+1}] ${ad.title}`);
        console.log(`    ID: ${ad.id}`);
        console.log(`    업체: ${ad.company_name}, 지역: ${ad.location}`);
        console.log(`    tier: ${ad.tier}`);
        console.log(`    status: ${ad.status}`);
        console.log(`    expires_at: ${ad.expires_at}`);
        console.log(`    created_at: ${ad.created_at}`);
        console.log(`    만료여부: ${isExpired ? '만료됨' : '유효'}, 2000년템플릿: ${isYear2000}`);
    });

    // AD_GENERAL tier이면서 ACTIVE인 것만 별도 카운트
    const { data: activeGenerals, error: e2 } = await supabase
        .from('biz_ads')
        .select('id, title, status, tier, expires_at')
        .eq('tier', 'AD_GENERAL')
        .eq('status', 'ACTIVE');
    
    console.log(`\n=== tier='AD_GENERAL' & status='ACTIVE' 광고 수: ${activeGenerals?.length || 0} ===`);
    if (activeGenerals) {
        activeGenerals.forEach((ad, i) => {
            const expiresAt = ad.expires_at ? new Date(ad.expires_at) : null;
            const isExpired = expiresAt ? expiresAt < new Date() : false;
            const isYear2000 = expiresAt ? expiresAt.getFullYear() === 2000 : false;
            console.log(`  [${i+1}] ${ad.title} | expires: ${ad.expires_at} | 만료: ${isExpired} | 2000년: ${isYear2000}`);
        });
    }

    // GENERAL tier (jobs 테이블)
    const { data: generalJobs, error: e3 } = await supabase
        .from('biz_ads')
        .select('id, title, status, tier, expires_at')
        .eq('tier', 'GENERAL')
        .eq('status', 'ACTIVE');
    
    console.log(`\n=== tier='GENERAL' & status='ACTIVE' 광고 수(biz_ads): ${generalJobs?.length || 0} ===`);

    // TestTitle655656 직접 검색
    const { data: testAd, error: e4 } = await supabase
        .from('biz_ads')
        .select('*')
        .ilike('title', '%TestTitle655656%');

    console.log(`\n=== 'TestTitle655656' 검색 결과 ===`);
    if (testAd && testAd.length > 0) {
        testAd.forEach(ad => {
            console.log(`  ID: ${ad.id}`);
            console.log(`  title: ${ad.title}`);
            console.log(`  tier: ${ad.tier}`);
            console.log(`  status: ${ad.status}`);
            console.log(`  expires_at: ${ad.expires_at}`);
            console.log(`  created_at: ${ad.created_at}`);
            console.log(`  total_points: ${ad.total_points}`);
        });
    } else {
        console.log("  검색 결과 없음");
    }
}

run();

