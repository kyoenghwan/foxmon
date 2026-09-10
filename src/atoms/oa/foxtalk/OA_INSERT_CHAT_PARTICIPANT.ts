"use server";

import { supabaseAdmin } from '@/lib/supabase';
import { getChatActor, getChatAccess } from '@/lib/chat-authorization';

interface ParticipantData {
    room_id: string;
    session_id: string;
    nickname: string;
    avatar_type: string;
    password?: string;
}

export const OA_INSERT_CHAT_PARTICIPANT = async (data: ParticipantData) => {
    try {
        const actor = await getChatActor();
        if (data.session_id !== actor) throw new Error('본인의 참여 정보만 변경할 수 있습니다.');
        await getChatAccess(data.room_id, actor, data.password, true);
        const { data: participant, error } = await supabaseAdmin
            .from('foxtalk_participants')
            .upsert([{
                room_id: data.room_id,
                session_id: data.session_id,
                nickname: data.nickname,
                avatar_type: data.avatar_type,
                last_read_at: new Date().toISOString(),
                left_at: null,
            }], { onConflict: 'room_id, session_id' })
            .select()
            .single();

        if (error) throw error;

        return { success: true, data: participant };
    } catch (error: any) {
        console.error('OA_INSERT_CHAT_PARTICIPANT Error:', error);
        return { success: false, error: '참여 처리에 실패했습니다.' };
    }
};
