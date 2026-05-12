import { supabaseAdmin } from '../lib/supabase';

async function run() {
    const { error } = await supabaseAdmin.from('point_transactions').insert({
        user_id: '872fa168-e834-4f7b-8a7e-e8c1c73955b0', // This is the user's ID
        type: 'SPEND',
        amount: 1,
        balance_after: 0,
        description: 'test'
    });
    console.log("Error:", error?.message || error);
}
run();
