import { supabaseAdmin } from '../lib/supabase';

async function fixBalances() {
    const { data: users, error } = await supabaseAdmin.from('users').select('id, paid_points').gt('paid_points', 0);
    
    if (error) {
        console.error("Error fetching users:", error);
        return;
    }
    
    if (!users || users.length === 0) {
        console.log("No users need fixing.");
        return;
    }
    
    for (const user of users) {
        // check if they have point_recharge_history
        const { data: history } = await supabaseAdmin.from('point_recharge_history')
                                       .select('id')
                                       .eq('user_id', user.id);
        
        if (!history || history.length === 0) {
            console.log(`Fixing user ${user.id} with ${user.paid_points} points`);
            // Insert dummy history
            await supabaseAdmin.from('point_recharge_history').insert({
                user_id: user.id,
                amount: user.paid_points,
                remained_point: user.paid_points,
                recharge_method: 'SYSTEM_FIX',
                status: 'COMPLETED'
            });
        }
    }
    console.log("Done fixing balances.");
}
fixBalances();
