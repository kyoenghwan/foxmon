import { supabaseAdmin } from '../lib/supabase';

async function run() {
    const { data: rows } = await supabaseAdmin.from('point_transactions').select('*').limit(10);
    console.log("Types:", Array.from(new Set(rows?.map(r => r.type))));
}
run();
