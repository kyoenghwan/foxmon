'use server';

import { supabaseAdmin } from '@/lib/supabase';

export const QA_GET_WIDGET_UNREAD_COUNTS = async (userId?: string) => {
    try {
        if (!userId) return { success: true, data: { foxTalkUnread: 0, csUnread: 0, totalUnread: 0 } };
        const rawUserId = userId.trim();
        const normalizedUserId = rawUserId.toLowerCase();

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
            .or(`session_id.eq.${rawUserId},session_id.eq.${normalizedUserId}`);

        if (partError || !participants) {
            return { success: true, data: { foxTalkUnread: 0, csUnread: 0, totalUnread: 0 } };
        }

        let foxTalkUnread = 0;
        let csUnread = 0;

        participants.forEach((p: any) => {
            const room = p.foxtalk_rooms;
            if (!room || !room.last_message_at) return;

            const lastReadTime = p.last_read_at ? new Date(p.last_read_at).getTime() : 0;
            const lastMsgTime = new Date(room.last_message_at).getTime();

            if (lastMsgTime > lastReadTime + 1000) {
                if (room.type === 'CS') {
                    csUnread += 1;
                } else {
                    foxTalkUnread += 1;
                }
            }
        });

        return {
            success: true,
            data: {
                foxTalkUnread,
                csUnread,
                totalUnread: foxTalkUnread + csUnread
            }
        };
    } catch (error: any) {
        console.error('QA_GET_WIDGET_UNREAD_COUNTS Error:', error);
        return { success: false, data: { foxTalkUnread: 0, csUnread: 0, totalUnread: 0 } };
    }
};
