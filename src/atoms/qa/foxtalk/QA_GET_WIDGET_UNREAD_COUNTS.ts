'use server';

import { supabaseAdmin } from '@/lib/supabase';

export const QA_GET_WIDGET_UNREAD_COUNTS = async (userId?: string) => {
    try {
        if (!userId) return { success: true, data: { foxTalkUnread: 0, csUnread: 0, totalUnread: 0 } };
        const rawUserId = userId.trim();
        const normalizedUserId = rawUserId.toLowerCase();

        const { data: participants, error: partError } = await supabaseAdmin
            .from('foxtalk_participants')
            .select('id, room_id, last_read_at, foxtalk_rooms!inner(type)')
            .or(`session_id.eq.${rawUserId},session_id.eq.${normalizedUserId}`);

        if (partError || !participants) {
            return { success: true, data: { foxTalkUnread: 0, csUnread: 0, totalUnread: 0 } };
        }

        let foxTalkUnread = 0;
        let csUnread = 0;

        await Promise.all(
            participants.map(async (p: any) => {
                const lastReadAt = p.last_read_at || '1970-01-01T00:00:00.000Z';
                const { count, error: countErr } = await supabaseAdmin
                    .from('foxtalk_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('room_id', p.room_id)
                    .neq('participant_id', p.id)
                    .gt('created_at', lastReadAt);

                if (!countErr && count && count > 0) {
                    if (p.foxtalk_rooms?.type === 'CS') {
                        csUnread += 1;
                    } else {
                        foxTalkUnread += 1;
                    }
                }
            })
        );

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
