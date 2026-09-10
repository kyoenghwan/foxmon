const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);

async function checkColumn() {
    const { data: bData, error: bErr } = await supabase.from('biz_ads').select('id, status, deleted_at').limit(1);
    console.log('biz_ads deleted_at select:', bData, bErr?.message);

    const { data: jData, error: jErr } = await supabase.from('jobs').select('id, status, deleted_at').limit(1);
    console.log('jobs deleted_at select:', jData, jErr?.message);
}

checkColumn();
