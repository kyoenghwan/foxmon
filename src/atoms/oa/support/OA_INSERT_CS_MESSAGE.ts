"use server";

import { supabaseAdmin } from '@/lib/supabase';
import { sendTelegramMessageDirect } from '@/lib/telegram';

interface CSMessageData {
    room_id: string;
    participant_id?: string; // 시스템 메시지 또는 관리자일 경우 특정 마커 사용 (예: 'CS_ADMIN')
    content: string;
    message_type?: 'TEXT' | 'SYSTEM_JOIN' | 'SYSTEM_LEAVE' | 'SYSTEM_ALERT';
    sender_nickname?: string; // 텔레그램 발송용
}

export const OA_INSERT_CS_MESSAGE = async (data: CSMessageData) => {
    try {
        let actualParticipantId = null;

        // data.participant_id로 전달된 값이 'CS_ADMIN'이 아니라면 session_id로 간주하고 실제 participant_id를 조회합니다.
        if (data.participant_id && data.participant_id !== 'CS_ADMIN') {
            const { data: p } = await supabaseAdmin
                .from('foxtalk_participants')
                .select('id')
                .eq('room_id', data.room_id)
                .eq('session_id', data.participant_id)
                .single();
            if (p) {
                actualParticipantId = p.id;
            }
        }

        const { data: message, error } = await supabaseAdmin
            .from('foxtalk_messages')
            .insert([{
                room_id: data.room_id,
                participant_id: actualParticipantId, // DB의 실제 foxtalk_participants.id
                content: data.content,
                message_type: data.message_type || 'TEXT'
            }])
            .select()
            .single();

        if (error) throw error;

        // 방의 last_message_at 업데이트
        await supabaseAdmin
            .from('foxtalk_rooms')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', data.room_id);

        // --- 텔레그램 관리자에게 알림 전송 (고객이 보낸 경우) ---
        // 관리자가 보낸 경우(participant_id가 'CS_ADMIN'인 경우)에는 텔레그램을 보내지 않음
        if (data.message_type === 'TEXT' && data.participant_id && data.participant_id !== 'CS_ADMIN') {
            
            // site_settings에서 관리자 텔레그램 Chat ID 조회
            const { data: settingRow } = await supabaseAdmin
                .from('site_settings')
                .select('key_value')
                .eq('key_name', 'cs_telegram_chat_id')
                .single();
                
            const adminChatId = settingRow?.key_value;
            
            if (adminChatId) {
                // 수신자에게 텔레그램 전송 (숨겨진 링크 포함하여 답장 매핑에 사용)
                const hiddenLink = `<a href="https://foxmon.co.kr/room/${data.room_id}">&#8203;</a>`;
                const tgMsg = `🎧 <b>[고객센터 문의]</b>\n👤 <b>${data.sender_nickname || '익명'}</b>\n\n${data.content}\n\n💡 이 메시지에 <b>[답장(Reply)]</b> 기능을 사용하여 답변하면 웹사이트 실시간 채팅으로 바로 전달됩니다!${hiddenLink}`;
                
                await sendTelegramMessageDirect(adminChatId, tgMsg);
            }
        }

        return { success: true, data: message };
    } catch (error: any) {
        console.error('OA_INSERT_CS_MESSAGE Error:', error);
        return { success: false, error: '메시지 전송에 실패했습니다.' };
    }
};
