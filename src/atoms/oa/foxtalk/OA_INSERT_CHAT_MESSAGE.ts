import { supabase } from '@/lib/supabase';

interface MessageData {
    room_id: string;
    participant_id?: string;
    content: string;
    message_type?: 'TEXT' | 'SYSTEM_JOIN' | 'SYSTEM_LEAVE' | 'SYSTEM_ALERT';
}

export const OA_INSERT_CHAT_MESSAGE = async (data: MessageData) => {
    try {
        const { data: message, error } = await supabase
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

        // Optionally update the room's last_message_at
        await supabase
            .from('foxtalk_rooms')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', data.room_id);

        return { success: true, data: message };
    } catch (error: any) {
        console.error('OA_INSERT_CHAT_MESSAGE Error:', error);
        return { success: false, error: '메시지 전송에 실패했습니다.' };
    }
};
