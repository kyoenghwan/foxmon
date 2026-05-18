import { supabaseAdmin } from "@/lib/supabase";
import { getSiteSettings } from "@/actions/admin/siteSettings";

/**
 * 특정 유저(DB의 user_id)에게 텔레그램 메시지를 전송합니다.
 * 유저의 telegram_chat_id 가 연동되어 있지 않으면 무시합니다.
 * @param userId 텔레그램 알림을 받을 유저의 UUID
 * @param message 전송할 텍스트 메시지
 */
export async function sendTelegramAlert(userId: string, message: string): Promise<boolean> {
    try {
        // 1. 유저의 telegram_chat_id 조회
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('telegram_chat_id')
            .eq('id', userId)
            .single();

        if (userError || !user || !user.telegram_chat_id) {
            // 유저가 텔레그램을 연동하지 않았거나 찾을 수 없음 (에러가 아님, 단순 무시)
            return false;
        }

        // 2. 어드민 설정에서 텔레그램 봇 토큰 조회 (시스템 권한으로 직접 DB 조회)
        const { data: settingRow } = await supabaseAdmin
            .from('site_settings')
            .select('key_value')
            .eq('key_name', 'telegram_bot_token')
            .single();

        const token = settingRow?.key_value;

        if (!token) {
            console.error("Telegram Bot Token is not set in admin settings.");
            return false;
        }

        // 3. 텔레그램 API 호출하여 메시지 전송
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: user.telegram_chat_id,
                text: message,
                parse_mode: 'HTML' // HTML 태그(<b>, <i> 등) 지원
            })
        });

        const result = await res.json();
        if (!result.ok) {
            console.error("Failed to send Telegram message:", result);
            return false;
        }

        return true;
    } catch (e) {
        console.error("sendTelegramAlert exception:", e);
        return false;
    }
}

/**
 * 특정 텔레그램 chat_id로 직접 메시지를 전송합니다 (유저 조회 없음).
 * 고객센터 관리자 알림 등에 사용됩니다.
 * @param chatId 텔레그램 chat_id (문자열 또는 숫자)
 * @param message 전송할 텍스트 메시지
 */
export async function sendTelegramMessageDirect(chatId: string | number, message: string): Promise<boolean> {
    try {
        if (!chatId) return false;

        const { data: settingRow } = await supabaseAdmin
            .from('site_settings')
            .select('key_value')
            .eq('key_name', 'telegram_bot_token')
            .single();

        const token = settingRow?.key_value?.trim();

        if (!token) {
            console.error("Telegram Bot Token is not set in admin settings.");
            return false;
        }

        const url = `https://api.telegram.org/bot${token}/sendMessage`;
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
        if (!result.ok) {
            console.error("Failed to send Telegram direct message:", result);
            return false;
        }

        return true;
    } catch (e) {
        console.error("sendTelegramMessageDirect exception:", e);
        return false;
    }
}
