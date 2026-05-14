import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSiteSettings } from "@/actions/admin/siteSettings";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        // 텔레그램 메시지 객체 확인
        if (body.message && body.message.text) {
            const chatId = body.message.chat.id;
            const text = body.message.text.trim();
            
            // "/start UUID" 형태의 명령어인지 확인
            if (text.startsWith('/start ')) {
                const userId = text.split(' ')[1];
                
                if (userId) {
                    // DB에 해당 유저의 텔레그램 chat_id 업데이트
                    const { data, error } = await supabaseAdmin
                        .from('users')
                        .update({ telegram_chat_id: String(chatId) })
                        .eq('id', userId)
                        .select();
                        
                    if (!error && data && data.length > 0) {
                        // 성공적으로 연동되었음을 텔레그램 봇으로 회신
                        await sendTelegramReply(chatId, "🎉 텔레그램 알림이 성공적으로 연동되었습니다!\n\n이제부터 폭스몬의 새로운 지원자나 메시지 알림을 가장 먼저 이곳에서 받아보실 수 있습니다.");
                    } else {
                        await sendTelegramReply(chatId, "⚠️ 연동에 실패했습니다. 폭스몬 마이페이지에서 다시 시도해주세요.");
                    }
                }
            } else if (text === '/start') {
                 await sendTelegramReply(chatId, "폭스몬 알림 봇입니다. 폭스몬 마이페이지의 '텔레그램 연동하기' 버튼을 통해 접속해주세요.");
            }
        }
        
        // 텔레그램 서버에는 항상 200 OK를 반환해야 계속 재시도하지 않음
        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("Telegram Webhook Error:", e);
        return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

// 텔레그램 회신용 내부 헬퍼 함수
async function sendTelegramReply(chatId: number | string, text: string) {
    try {
        // 설정에서 토큰 직접 조회 (웹훅은 세션이 없으므로 getSiteSettings 사용 불가)
        const { data: settingRow } = await supabaseAdmin
            .from('site_settings')
            .select('key_value')
            .eq('key_name', 'telegram_bot_token')
            .single();
            
        const token = settingRow?.key_value;
        
        if (!token) return false;
        
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
            })
        });
        return true;
    } catch (e) {
        console.error("sendTelegramReply Error:", e);
        return false;
    }
}

export async function GET() {
    return NextResponse.json({ message: "Telegram Webhook Endpoint is alive." });
}
