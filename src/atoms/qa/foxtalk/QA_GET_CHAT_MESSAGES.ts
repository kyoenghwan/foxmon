import { supabase } from '@/lib/supabase';

export const QA_GET_CHAT_MESSAGES = async (roomId: string) => {
    try {
        const { data: messages, error } = await supabase
            .from('foxtalk_messages')
            .select(`
                *,
                participant:foxtalk_participants(nickname, avatar_type)
            `)
            .eq('room_id', roomId)
            .order('created_at', { ascending: true }) // 옛날 것부터 최신으로
            .limit(100);

        if (error) throw error;

        return { success: true, data: messages || [] };
    } catch (error: any) {
        console.error('QA_GET_CHAT_MESSAGES Error:', error);
        return { success: false, error: '메시지를 불러오지 못했습니다.' };
    }
};
