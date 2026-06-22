'use server';

import { supabase } from '@/lib/supabase';

interface UpsertChatProfileParams {
    user_id: string;
    chat_nickname: string;
    avatar_type?: string;
}

/**
 * OA_UPSERT_CHAT_PROFILE
 * 채팅 전용 프로필을 생성하거나 수정합니다.
 * user_id 기준 UPSERT (이미 있으면 업데이트, 없으면 생성)
 */
export async function OA_UPSERT_CHAT_PROFILE(params: UpsertChatProfileParams) {
    try {
        const { user_id, chat_nickname, avatar_type = 'fox1' } = params;

        if (!chat_nickname || chat_nickname.trim().length === 0) {
            return { success: false, error: '닉네임을 입력해주세요.' };
        }
        if (chat_nickname.trim().length > 20) {
            return { success: false, error: '닉네임은 20자 이내로 입력해주세요.' };
        }

        const { data, error } = await supabase
            .from('foxtalk_chat_profiles')
            .upsert({
                user_id,
                chat_nickname: chat_nickname.trim(),
                avatar_type,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) {
            console.error('[OA_UPSERT_CHAT_PROFILE] 저장 실패:', error.message);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (err: any) {
        console.error('[OA_UPSERT_CHAT_PROFILE] 예외:', err);
        return { success: false, error: err.message };
    }
}
