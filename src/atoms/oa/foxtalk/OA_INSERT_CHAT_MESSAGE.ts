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
                    
                    // 수신자에게 텔레그램 전송 (숨겨진 링크 포함하여 답장 매핑에 사용)
                    const hiddenLink = `<a href="https://foxmon.co.kr/room/${data.room_id}">&#8203;</a>`;
                    const tgMsg = `💬 <b>${senderName}</b>\n\n${data.content}${hiddenLink}`;
                    
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
