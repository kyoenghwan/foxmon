import { supabaseAdmin } from '../lib/supabase';

async function run() {
    const { data, error } = await supabaseAdmin.from('point_recharge_history').select('*');
    if (error) console.log(error);
    if (data && data.length > 0) {
        console.log(Object.keys(data[0]));
    } else {
        console.log("No data");
    }
}
run();
