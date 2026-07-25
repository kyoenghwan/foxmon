'use server';

import { supabaseAdmin } from '@/lib/supabase';

export const QA_GET_TOTAL_UNREAD_CHAT_COUNT = async (userId?: string) => {
    try {
        if (!userId) return { success: true, data: 0 };
        const rawUserId = userId.trim();
        const normalizedUserId = rawUserId.toLowerCase();

        // 1. 유저가 참여 중인 채팅방 정보 및 마지막 읽은 시간 조회 (CS 고객센터 방 제외)
        const { data: participants, error: partError } = await supabaseAdmin
            .from('foxtalk_participants')
            .select(`
                id,
                room_id,
                last_read_at,
                foxtalk_rooms!inner(
                    id,
                    type,
                    last_message_at
                )
            `)
            .or(`session_id.eq.${rawUserId},session_id.eq.${normalizedUserId}`)
            .neq('foxtalk_rooms.type', 'CS');

        if (partError) throw partError;
        if (!participants || participants.length === 0) {
            return { success: true, data: 0 };
        }

        let totalUnreadCount = 0;

        participants.forEach((p: any) => {
            const room = p.foxtalk_rooms;
            if (!room || !room.last_message_at) return;

            const lastReadTime = p.last_read_at ? new Date(p.last_read_at).getTime() : 0;
            const lastMsgTime = new Date(room.last_message_at).getTime();

            if (lastMsgTime > lastReadTime + 1000) {
                totalUnreadCount += 1;
            }
        });

        return { success: true, data: totalUnreadCount };
    } catch (error: any) {
        console.error('QA_GET_TOTAL_UNREAD_CHAT_COUNT Error:', error);
        return { success: false, error: '안읽은 메시지 수를 조회하는 중 오류가 발생했습니다.' };
    }
};
