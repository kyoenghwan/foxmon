import { supabaseAdmin } from '../lib/supabase';

async function run() {
    const { data, error } = await supabaseAdmin.rpc('get_table_columns', { table_name: 'point_recharge_history' });
    if (error) {
        console.log("No RPC get_table_columns found. Fetching raw row to see keys:");
        const { data: rows } = await supabaseAdmin.from('point_recharge_history').select('*').limit(1);
        if (rows && rows.length > 0) {
            console.log("Columns from data:", Object.keys(rows[0]));
        } else {
            // Since there is no row, we insert a dummy row that is expected to fail to see the error message which might include the columns
            const { error: insertError } = await supabaseAdmin.from('point_recharge_history').insert({ dummy_col: 1 });
            console.log("Insert Error:", insertError?.message || insertError);
        }
    } else {
        console.log("Columns:", data);
    }
}
run();
