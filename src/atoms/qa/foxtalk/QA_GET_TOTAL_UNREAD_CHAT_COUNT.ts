'use server';

import { supabaseAdmin } from '@/lib/supabase';

export const QA_GET_TOTAL_UNREAD_CHAT_COUNT = async (userId?: string) => {
    try {
        if (!userId) return { success: true, data: 0 };
        const rawUserId = userId.trim();
        const normalizedUserId = rawUserId.toLowerCase();

        // 1. 유저가 참여 중인 채팅방 정보 및 마지막 읽은 시간 조회
        const { data: participants, error: partError } = await supabaseAdmin
            .from('foxtalk_participants')
            .select('id, room_id, last_read_at')
            .or(`session_id.eq.${rawUserId},session_id.eq.${normalizedUserId}`);

        if (partError) throw partError;
        if (!participants || participants.length === 0) {
            return { success: true, data: 0 };
        }

        // 2. 참여 중인 방들의 안읽은 메시지 개수를 병렬로 카운팅
        const unreadCounts = await Promise.all(
            participants.map(async (participant) => {
                const lastReadAt = participant.last_read_at || '1970-01-01T00:00:00.000Z';
                
                const { count, error: countErr } = await supabaseAdmin
                    .from('foxtalk_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('room_id', participant.room_id)
                    .neq('participant_id', participant.id)
                    .gt('created_at', lastReadAt);

                if (countErr) {
                    console.error(`Count error for room ${participant.room_id}:`, countErr);
                    return 0;
                }
                return (count && count > 0) ? 1 : 0;
            })
        );

        const totalUnreadCount = unreadCounts.reduce((sum, count) => sum + count, 0);

        return { success: true, data: totalUnreadCount };
    } catch (error: any) {
        console.error('QA_GET_TOTAL_UNREAD_CHAT_COUNT Error:', error);
        return { success: false, error: '안읽은 메시지 수를 조회하는 중 오류가 발생했습니다.' };
    }
};
