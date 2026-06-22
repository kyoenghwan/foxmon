'use server';

import { supabase } from '@/lib/supabase';

/**
 * QA_GET_LIVE_CHAT_ROOM
 * LIVE 타입 고정 채팅방 정보를 조회합니다.
 */
export async function QA_GET_LIVE_CHAT_ROOM() {
    try {
        const { data, error } = await supabase
            .from('foxtalk_rooms')
            .select('*')
            .eq('type', 'LIVE')
            .limit(1)
            .single();

        if (error) {
            console.error('[QA_GET_LIVE_CHAT_ROOM] 조회 실패:', error.message);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (err: any) {
        console.error('[QA_GET_LIVE_CHAT_ROOM] 예외:', err);
        return { success: false, error: err.message };
    }
}
