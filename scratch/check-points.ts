import { supabaseAdmin } from '../lib/supabase';

async function run() {
    const { data: users } = await supabaseAdmin.from('users').select('id, email, paid_points, bonus_points').limit(5);
    console.log("Users:", users);

    if (users && users.length > 0) {
        for (const user of users) {
            const { data: history } = await supabaseAdmin.from('point_recharge_history').select('*').eq('user_id', user.id);
            console.log(`History for ${user.email} (${user.id}):`, history);
        }
    }
}
run();
