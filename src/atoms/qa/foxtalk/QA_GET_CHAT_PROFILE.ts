'use server';

import { supabase } from '@/lib/supabase';

/**
 * QA_GET_CHAT_PROFILE
 * 사용자의 채팅 전용 프로필을 조회합니다.
 * 없으면 null을 반환합니다.
 */
export async function QA_GET_CHAT_PROFILE(userId: string) {
    try {
        const { data, error } = await supabase
            .from('foxtalk_chat_profiles')
            .select('*')
            .eq('user_id', userId)
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows found (정상 케이스)
            console.error('[QA_GET_CHAT_PROFILE] 조회 실패:', error.message);
            return { success: false, error: error.message };
        }

        return { success: true, data: data || null };
    } catch (err: any) {
        console.error('[QA_GET_CHAT_PROFILE] 예외:', err);
        return { success: false, error: err.message };
    }
}
