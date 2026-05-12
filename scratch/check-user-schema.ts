import { supabaseAdmin } from '../lib/supabase';
async function run() {
    const { data } = await supabaseAdmin.from('users').select('*').limit(1);
    console.log(Object.keys(data?.[0] || {}));
}
run();
