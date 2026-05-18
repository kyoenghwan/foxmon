import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testDirect() {
    console.log("Checking site_settings directly...");
    const { data: settings } = await supabaseAdmin.from('site_settings').select('*');
    console.log(settings);

    console.log("Fetching chat_id");
    const { data: settingRow } = await supabaseAdmin
        .from('site_settings')
        .select('key_value')
        .eq('key_name', 'cs_telegram_chat_id')
        .single();
    const adminChatId = settingRow?.key_value?.trim();
    console.log("adminChatId:", adminChatId);

    console.log("Fetching bot token");
    let { data: settingRow2 } = await supabaseAdmin
        .from('site_settings')
        .select('key_value')
        .eq('key_name', 'telegram_cs_bot_token')
        .single();
    let token = settingRow2?.key_value?.trim();
    console.log("token:", token);

    if (adminChatId && token) {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: adminChatId,
                text: "Test from within site_settings check",
                parse_mode: 'HTML'
            })
        });
        console.log("Result:", await res.json());
    }
}
testDirect();
