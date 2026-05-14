import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
    try {
        const { data: settingRow } = await supabaseAdmin
            .from('site_settings')
            .select('key_value')
            .eq('key_name', 'telegram_bot_token')
            .single();

        const token = settingRow?.key_value;

        if (!token) {
            return NextResponse.json({ success: false, error: 'Telegram Bot Token is not configured in DB.' }, { status: 400 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://foxmon-d.vercel.app';
        const webhookUrl = `${appUrl}/api/webhooks/telegram`;

        const tgUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`;
        const res = await fetch(tgUrl);
        const result = await res.json();

        return NextResponse.json({ 
            success: true, 
            message: 'Webhook registration attempted.', 
            webhookUrl,
            telegram_response: result 
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
