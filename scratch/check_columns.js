const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    // biz_ads 컬럼 확인
    const { data: ba } = await supabase.from('biz_ads').select('*').limit(1);
    if (ba && ba[0]) {
        console.log("=== biz_ads 컬럼 목록 ===");
        console.log(Object.keys(ba[0]).join('\n'));
    }

    // jobs 컬럼 확인
    const { data: j } = await supabase.from('jobs').select('*').limit(1);
    if (j && j[0]) {
        console.log("\n=== jobs 컬럼 목록 ===");
        console.log(Object.keys(j[0]).join('\n'));
    }

    // ad_history_logs 컬럼
    const { data: h } = await supabase.from('ad_history_logs').select('*').limit(1);
    console.log("\n=== ad_history_logs 컬럼 ===");
    if (h && h[0]) console.log(Object.keys(h[0]).join('\n'));
    else console.log("(데이터 없음)");
}

check();
