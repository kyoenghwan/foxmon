import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
    const { data, error } = await supabaseAdmin.from('point_policies').select('*');
    console.log('SELECT:', data, error);
    
    if (data && data.length === 0) {
        const insertData = [
            { config_key: 'OPTION_PRICE_BASE_PERIOD', config_value: 70000, start_at: new Date().toISOString(), end_at: '9999-12-31' }
        ];
        const res = await supabaseAdmin.from('point_policies').insert(insertData).select();
        console.log('INSERT:', res);
    }
}
test();
