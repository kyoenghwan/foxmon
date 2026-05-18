"use server";

import { supabaseAdmin } from '@/lib/supabase';

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

        return { success: true, data: message };
    } catch (error: any) {
        console.error('OA_INSERT_CS_MESSAGE Error:', error);
        return { success: false, error: '메시지 전송에 실패했습니다.' };
    }
};
