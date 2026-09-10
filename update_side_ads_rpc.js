const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const checkSql = `SELECT id, title, tier, status, expires_at FROM public.biz_ads WHERE tier = 'SIDE';`;
    const { data } = await supabase.rpc('execute_sql', { sql: checkSql });
    console.table(data);
}
check();
