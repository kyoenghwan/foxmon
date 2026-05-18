"use server";

import { supabaseAdmin } from '@/lib/supabase';

export const QA_GET_CS_MESSAGES = async (roomId: string) => {
    try {
        if (!roomId) return { success: false, error: '방 ID가 없습니다.' };

        const { data: messages, error } = await supabaseAdmin
            .from('foxtalk_messages')
            .select(`
                *,
                participant:foxtalk_participants(*)
            `)
            .eq('room_id', roomId)
            .order('created_at', { ascending: true })
            .limit(100);

        if (error) throw error;

        return { success: true, data: messages };
    } catch (error: any) {
        console.error('QA_GET_CS_MESSAGES Error:', error);
        return { success: false, error: '메시지를 불러오는데 실패했습니다.' };
    }
};
