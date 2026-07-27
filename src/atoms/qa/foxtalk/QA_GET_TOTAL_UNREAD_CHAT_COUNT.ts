'use server';

import { supabaseAdmin } from '@/lib/supabase';

export const QA_GET_TOTAL_UNREAD_CHAT_COUNT = async (userId?: string) => {
    try {
        if (!userId) return { success: true, data: 0 };
        const rawUserId = userId.trim();
        const normalizedUserId = rawUserId.toLowerCase();
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUserId);

        const userMatchIds: string[] = [rawUserId, normalizedUserId];

        const { data: userData } = isUUID
            ? await supabaseAdmin.from('users').select('id, login_id, nickname').eq('id', rawUserId).maybeSingle()
            : await supabaseAdmin.from('users').select('id, login_id, nickname').or(`login_id.eq.${rawUserId},login_id.eq.${normalizedUserId}`).maybeSingle();

        if (userData) {
            if (userData.id) userMatchIds.push(userData.id.toLowerCase());
            if (userData.login_id) userMatchIds.push(userData.login_id.toLowerCase());
            if (userData.nickname) userMatchIds.push(userData.nickname.toLowerCase());
        }

        const uniqueUserIds = Array.from(new Set(userMatchIds.filter(Boolean)));

        // QA_GET_CHAT_ROOMS 와 동일하게 1ON1 방의 employer_id/seeker_id 조인 포함
        const idConditions = uniqueUserIds.flatMap(id => [
            `and(type.eq.1ON1,employer_id.eq.${id})`,
            `and(type.eq.1ON1,seeker_id.eq.${id})`
        ]);
        const filterOr = `type.in.(OPEN,SECRET),${idConditions.join(',')}`;

        const { data: rooms, error } = await supabaseAdmin
            .from('foxtalk_rooms')
            .select(`
                id,
                type,
                last_message_at,
                employer_id,
                seeker_id,
                foxtalk_participants(id, last_read_at, left_at, session_id)
            `)
            .eq('is_active', true)
            .or(filterOr);

        if (error) throw error;

        const roomList = rooms || [];
        let unreadRoomCount = 0;

        roomList.forEach((room: any) => {
            if (!room.last_message_at) return;

            // 내 참여 정보 매칭 (foxtalk_participants 에 내가 없거나 나간 대화방이면 제외)
            const myPart = room.foxtalk_participants?.find((p: any) => {
                const sId = p.session_id ? p.session_id.toLowerCase().trim() : '';
                return uniqueUserIds.includes(sId);
            });

            // 💡 내가 대화방을 나갔거나(myPart 미존재 또는 left_at 존재) 더 이상 참여자가 아니면 안읽은 방 계산에서 완벽히 제외!
            if (!myPart || myPart.left_at) return;

            const lastReadTime = myPart.last_read_at ? new Date(myPart.last_read_at).getTime() : 0;
            const lastMsgTime = new Date(room.last_message_at).getTime();

            if (lastMsgTime > lastReadTime) {
                unreadRoomCount += 1;
            }
        });

        console.log(`💬 [QA_GET_TOTAL_UNREAD_CHAT_COUNT] 유저 ${normalizedUserId} 안읽은 대화방 수: ${unreadRoomCount}`);

        return { success: true, data: unreadRoomCount };
    } catch (error: any) {
        console.error('QA_GET_TOTAL_UNREAD_CHAT_COUNT Error:', error);
        return { success: false, error: '안읽은 메시지 수를 조회하는 중 오류가 발생했습니다.' };
    }
};
