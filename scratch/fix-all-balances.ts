import { supabaseAdmin } from '../lib/supabase';

async function run() {
    const { data: users } = await supabaseAdmin.from('users').select('id, email, paid_points').gt('paid_points', 0);
    const { data: recharges } = await supabaseAdmin.from('point_recharge_history').select('user_id, remained_point');

    for (const u of users || []) {
        const sum = (recharges || []).filter(r => r.user_id === u.id).reduce((acc, curr) => acc + Number(curr.remained_point), 0);
        
        if (sum !== Number(u.paid_points)) {
            const diff = Number(u.paid_points) - sum;
            if (diff > 0) {
                console.log(`Fixing User ${u.id} (${u.email}): missing ${diff} points`);
                const { error } = await supabaseAdmin.from('point_recharge_history').insert({
                    user_id: u.id,
                    cash_amount: diff,
                    point_amount: diff,
                    remained_point: diff,
                    bonus_ratio: 0,
                    is_first_charge: false
                });
                if (error) console.log("INSERT ERROR:", error);
            }
        }
    }
}
run();
