import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
    try {
        console.log("Fetching settings...");
        const { data: settingRow1, error: err1 } = await supabaseAdmin
            .from('site_settings')
            .select('key_value')
            .eq('key_name', 'cs_telegram_chat_id')
            .single();
        if (err1) console.error("Err1:", err1);
        const chatId = settingRow1?.key_value;
        console.log("Chat ID:", chatId);

        const { data: settingRow2, error: err2 } = await supabaseAdmin
            .from('site_settings')
            .select('key_value')
            .eq('key_name', 'telegram_bot_token')
            .single();
        if (err2) console.error("Err2:", err2);
        const token = settingRow2?.key_value;
        console.log("Token:", token ? "Exists" : "Missing");

        if (!chatId || !token) {
            console.log("Missing credentials.");
            return;
        }

        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const message = `🎧 <b>[고객센터 문의 테스트]</b>\n이 메시지가 보인다면 연결이 정상입니다.`;
        
        console.log("Sending to telegram...");
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });

        const result = await res.json();
        console.log("Telegram API Result:", result);

    } catch (e) {
        console.error("Exception:", e);
    }
}

test();
