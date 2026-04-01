import { supabase } from '@/lib/supabase';

export interface ChatRoomData {
    title: string;
    type: 'OPEN' | 'SECRET';
    room_code?: string;
    password_hash?: string;
    max_participants: number;
    created_by: string;
}

export const OA_INSERT_CHAT_ROOM = async (data: ChatRoomData) => {
    try {
        const { data: room, error } = await supabase
            .from('foxtalk_rooms')
            .insert([{
                title: data.title,
                type: data.type,
                room_code: data.room_code || null,
                password_hash: data.password_hash || null,
                max_participants: data.max_participants,
                created_by: data.created_by,
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;

        return { success: true, data: room };
    } catch (error: any) {
        console.error('OA_INSERT_CHAT_ROOM Error:', error);
        return { success: false, error: '채팅방 생성에 실패했습니다.' };
    }
};
