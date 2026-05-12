import { supabaseAdmin } from '../lib/supabase';

async function run() {
    const { data, error } = await supabaseAdmin.from('biz_ads').select('*').limit(1);
    console.log("biz_ads check:", Object.keys(data?.[0] || {}));
    if (error) console.log("biz_ads err:", error.message);
    
    const { data: d2, error: e2 } = await supabaseAdmin.from('jobs').select('*').limit(1);
    console.log("jobs check:", Object.keys(d2?.[0] || {}));
    if (e2) console.log("jobs err:", e2.message);
}
run();
