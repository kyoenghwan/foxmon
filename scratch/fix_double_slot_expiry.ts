import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function fixDb() {
    const { supabaseAdmin } = await import('../lib/supabase');

    const { data, error } = await supabaseAdmin
        .from('biz_ads')
        .update({
            option_double_slot: true,
            option_double_slot_expires_at: '2026-08-12T23:59:59.999+00:00'
        })
        .eq('id', '9a2ffd34-f767-4076-bb5b-5f7de08338d4')
        .select();

    if (error) {
        console.error("DB update error:", error);
    } else {
        console.log("DB update success:", data);
    }
}

fixDb().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
