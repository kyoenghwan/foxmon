"use server";

import { supabaseAdmin } from '@/lib/supabase';

import { sendTelegramAlert } from '@/lib/telegram';

interface MessageData {
    room_id: string;
    participant_id?: string;
    content: string;
    message_type?: 'TEXT' | 'SYSTEM_JOIN' | 'SYSTEM_LEAVE' | 'SYSTEM_ALERT';
}

export const OA_INSERT_CHAT_MESSAGE = async (data: MessageData) => {
    try {
        const { data: message, error } = await supabaseAdmin
            .from('foxtalk_messages')
            .insert([{
                room_id: data.room_id,
                participant_id: data.participant_id || null,
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

        // --- 텔레그램 양방향 연동 로직 ---
        if (data.message_type === 'TEXT' && data.participant_id) {
            // 방 정보 조회
            const { data: room } = await supabaseAdmin
                .from('foxtalk_rooms')
                .select('type, employer_id, seeker_id')
                .eq('id', data.room_id)
                .single();

            if (room && room.type === '1ON1') {
                // 발신자가 구직자면 사장님에게, 사장님이면 구직자에게 (단, 구직자가 텔레그램 연동을 했을 경우)
                const targetUserId = data.participant_id === room.seeker_id ? room.employer_id : room.seeker_id;
                
                if (targetUserId) {
                    // 발신자 정보
                    const { data: sender } = await supabaseAdmin
                        .from('users')
                        .select('nickname')
                        .eq('id', data.participant_id)
                        .single();
                        
                    const senderName = sender?.nickname || (data.participant_id === room.seeker_id ? '익명 지원자' : '업체 담당자');
                    
                    // 수신자에게 텔레그램 전송 (단방향 알림)
                    const tgMsg = `💬 <b>${senderName}</b>님으로부터 새로운 메시지가 도착했습니다.\n\n"${data.content}"\n\n👉 폭스몬 웹사이트에 접속하여 답변해 주세요.\nhttps://foxmon.co.kr`;
                    
                    await sendTelegramAlert(targetUserId, tgMsg);
                }
            }
        }

        return { success: true, data: message };
    } catch (error: any) {
        console.error('OA_INSERT_CHAT_MESSAGE Error:', error);
        return { success: false, error: '메시지 전송에 실패했습니다.' };
    }
};
