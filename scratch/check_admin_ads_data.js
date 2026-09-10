const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);

async function checkData() {
    console.log('=== BIZ_ADS 테이블 데이터 ===');
    const { data: bizAds, error: bErr } = await supabase.from('biz_ads').select('id, title, tier, status, company_name, created_at, expires_at');
    console.log('biz_ads count:', bizAds?.length, 'error:', bErr);
    console.log(bizAds);

    console.log('\n=== JOBS 테이블 데이터 (상위 20개) ===');
    const { data: jobs, error: jErr } = await supabase.from('jobs').select('id, title, tier, status, company_name, created_at, expires_at').limit(20);
    console.log('jobs count:', jobs?.length, 'error:', jErr);
    console.log(jobs);
}

checkData();
