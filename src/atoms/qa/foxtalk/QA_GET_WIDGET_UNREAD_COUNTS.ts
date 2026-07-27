'use server';

import { supabaseAdmin } from '@/lib/supabase';

export const QA_GET_WIDGET_UNREAD_COUNTS = async (userId?: string) => {
    try {
        if (!userId) return { success: true, data: { foxTalkUnread: 0, csUnread: 0, totalUnread: 0 } };
        const rawUserId = userId.trim();
        const normalizedUserId = rawUserId.toLowerCase();
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUserId);

        const userIdsToMatch: string[] = [rawUserId, normalizedUserId];

        let userData = null;
        if (isUUID) {
            const { data } = await supabaseAdmin.from('users').select('id, login_id, nickname').eq('id', rawUserId).maybeSingle();
            userData = data;
        } else {
            const { data } = await supabaseAdmin.from('users').select('id, login_id, nickname').or(`login_id.eq.${rawUserId},login_id.eq.${normalizedUserId}`).maybeSingle();
            userData = data;
        }

        if (userData) {
            if (userData.id) userIdsToMatch.push(userData.id);
            if (userData.login_id) userIdsToMatch.push(userData.login_id);
            if (userData.nickname) userIdsToMatch.push(userData.nickname);
        }

        const uniqueUserIds = Array.from(new Set(userIdsToMatch.filter(Boolean)));
        const orConditions = uniqueUserIds.map(id => `session_id.eq.${id}`).join(',');

        const { data: participants, error: partError } = await supabaseAdmin
            .from('foxtalk_participants')
            .select(`
                id,
                room_id,
                last_read_at,
                left_at,
                foxtalk_rooms!inner(
                    id,
                    type,
                    last_message_at
                )
            `)
            .or(orConditions);

        if (partError || !participants) {
            return { success: true, data: { foxTalkUnread: 0, csUnread: 0, totalUnread: 0 } };
        }

        let foxTalkUnread = 0;
        let csUnread = 0;
        const details: any[] = [];

        participants.forEach((p: any) => {
            // 💡 내가 대화방을 나갔으면(left_at 이 찍혔으면) 안읽은 계산에서 완전 제외
            if (p.left_at) return;

            const room = p.foxtalk_rooms;
            if (!room || !room.last_message_at) return;

            const lastReadTime = p.last_read_at ? new Date(p.last_read_at).getTime() : 0;
            const lastMsgTime = new Date(room.last_message_at).getTime();
            const isUnread = lastMsgTime > lastReadTime;

            if (isUnread) {
                if (room.type === 'CS') {
                    csUnread += 1;
                } else {
                    foxTalkUnread += 1;
                }
            }

            details.push({
                roomId: room.id,
                type: room.type,
                last_message_at: room.last_message_at,
                last_read_at: p.last_read_at,
                lastMsgTime,
                lastReadTime,
                isUnread
            });
        });

        return {
            success: true,
            data: {
                foxTalkUnread,
                csUnread,
                totalUnread: foxTalkUnread + csUnread,
                debug: {
                    matchedUserIds: uniqueUserIds,
                    participantsCount: participants.length,
                    details
                }
            }
        };
    } catch (error: any) {
        console.error('QA_GET_WIDGET_UNREAD_COUNTS Error:', error);
        return { success: false, data: { foxTalkUnread: 0, csUnread: 0, totalUnread: 0 } };
    }
};
