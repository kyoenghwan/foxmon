"use server";

import { supabaseAdmin } from '@/lib/supabase';
import { getChatActor, getChatAccess } from '@/lib/chat-authorization';
import { sendChatMessagePush } from '@/lib/chat-push';

import { sendTelegramAlert } from '@/lib/telegram';

interface MessageData {
    room_id: string;
    participant_id?: string;
    content: string;
    message_type?: 'TEXT' | 'SYSTEM_JOIN' | 'SYSTEM_LEAVE' | 'SYSTEM_ALERT';
}

export const OA_INSERT_CHAT_MESSAGE = async (data: MessageData) => {
    try {
        const actor = await getChatActor();
        const { participant } = await getChatAccess(data.room_id, actor);
        const type = data.message_type || 'TEXT';
        if (!['TEXT', 'SYSTEM_JOIN', 'SYSTEM_LEAVE'].includes(type) ||
            (data.participant_id && data.participant_id !== participant.id)) throw new Error('메시지 작성 권한이 없습니다.');
        data = { ...data, participant_id: participant.id, message_type: type,
          content: type === 'SYSTEM_JOIN' ? `${participant.nickname}님이 입장하셨습니다.` :
            type === 'SYSTEM_LEAVE' ? `${participant.nickname}님이 퇴장하셨습니다.` : data.content };
        if (typeof data.content !== 'string' || !data.content.trim()) throw new Error('메시지를 입력해주세요.');
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
                const targetUserId = actor === room.seeker_id ? room.employer_id : room.seeker_id;
                
                if (targetUserId) {
                    // 발신자 정보
                    const { data: sender } = await supabaseAdmin
                        .from('users')
                        .select('nickname')
                        .eq('id', actor)
                        .single();
                        
                    const senderName = sender?.nickname || (actor === room.seeker_id ? '익명 지원자' : '업체 담당자');
                    
                    // 수신자에게 텔레그램 전송 (단방향 알림)
                    const tgMsg = `💬 <b>${senderName}</b>님으로부터 새로운 메시지가 도착했습니다.\n\n"${data.content}"\n\n👉 폭스몬 웹사이트에 접속하여 답변해 주세요.\nhttps://foxmon.co.kr`;
                    
                    try { await sendTelegramAlert(targetUserId, tgMsg); }
                    catch { console.error('저장된 메시지의 텔레그램 알림 발송 실패'); }
                }
            }
        }
        if (data.message_type === 'TEXT') {
            try { await sendChatMessagePush(message.id, actor); }
            catch { console.error('저장된 메시지의 푸시 알림 발송 실패'); }
        }
        return { success: true, data: message };
    } catch (error: any) {
        console.error('OA_INSERT_CHAT_MESSAGE Error:', error);
        return { success: false, error: '메시지 전송에 실패했습니다.' };
    }
};
