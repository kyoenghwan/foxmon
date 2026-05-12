import { supabaseAdmin } from '../lib/supabase';

async function run() {
    const { data: users } = await supabaseAdmin.from('users').select('id, email, paid_points, bonus_points').gt('paid_points', 0);
    const { data: recharges } = await supabaseAdmin.from('point_recharge_history').select('user_id, remained_point');

    let mismatchFound = false;
    for (const u of users || []) {
        const sum = (recharges || []).filter(r => r.user_id === u.id).reduce((acc, curr) => acc + Number(curr.remained_point), 0);
        if (sum !== Number(u.paid_points)) {
            console.log(`>>> MISMATCH DETECTED FOR ${u.email}: Paid=${u.paid_points}, Sum=${sum}`);
            mismatchFound = true;
        }
    }
    if (!mismatchFound) console.log("All points match!");
}
run();
