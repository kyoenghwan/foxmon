"use server";

import { supabaseAdmin } from '@/lib/supabase';

export const QA_GET_CS_ROOM = async (sessionId: string) => {
    try {
        if (!sessionId) return { success: false, error: '세션 ID가 없습니다.' };

        const { data: room, error } = await supabaseAdmin
            .from('foxtalk_rooms')
            .select('*')
            .eq('type', 'CS')
            .eq('created_by', sessionId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116: no rows returned
            throw error;
        }

        return { success: true, data: room || null };
    } catch (error: any) {
        console.error('QA_GET_CS_ROOM Error:', error);
        return { success: false, error: '방 정보를 불러오는데 실패했습니다.' };
    }
};
