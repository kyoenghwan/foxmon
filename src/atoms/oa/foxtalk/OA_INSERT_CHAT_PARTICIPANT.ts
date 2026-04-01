import { supabase } from '@/lib/supabase';

interface ParticipantData {
    room_id: string;
    session_id: string;
    nickname: string;
    avatar_type: string;
}

export const OA_INSERT_CHAT_PARTICIPANT = async (data: ParticipantData) => {
    try {
        const { data: participant, error } = await supabase
            .from('foxtalk_participants')
            .upsert([{
                room_id: data.room_id,
                session_id: data.session_id,
                nickname: data.nickname,
                avatar_type: data.avatar_type,
                last_read_at: new Date().toISOString()
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
