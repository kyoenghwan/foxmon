'use server';

import { supabase, supabaseAdmin } from '@/lib/supabase';

export const QA_GET_CHAT_ROOMS = async (userId?: string, userRole?: string) => {
    try {
        const normalizedUserId = userId ? userId.toLowerCase().trim() : undefined;
        
        let query = supabase
            .from('foxtalk_rooms')
            .select(`
                *,
                employer:employer_id(id, login_id, nickname, name, business_name),
                seeker:seeker_id(id, login_id, nickname, name),
                latest_message:foxtalk_messages(content, created_at, participant_id),
                my_participant:foxtalk_participants(id, room_id, last_read_at, session_id)
            `)
            .eq('is_active', true);

        let isAdmin = false;
        if (normalizedUserId && (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN')) {
            // 사이트 관리자인지 확인 (RLS 우회를 위해 supabaseAdmin 사용)
            const { data: adminSetting } = await supabaseAdmin
                .from('site_settings')
                .select('key_value')
                .eq('key_name', 'cs_admin_user_id')
                .single();
            if (adminSetting?.key_value?.trim() === normalizedUserId) {
                isAdmin = true;
            }
        }

        if (isAdmin) {
            // 관리자는 1ON1 방 중 본인이 포함된 방 + OPEN, SECRET, CS 방 전체를 볼 수 있음
            query = query.or(`type.in.(OPEN,SECRET,CS),and(type.eq.1ON1,employer_id.eq.${normalizedUserId}),and(type.eq.1ON1,seeker_id.eq.${normalizedUserId})`);
        } else if (userRole === 'EMPLOYER') {
            // 사장님은 본인이 연관된 1ON1 방만 보임
            query = query.eq('type', '1ON1').eq('employer_id', normalizedUserId);
        } else {
            // 일반 구직자는 본인이 연관된 1ON1 방이거나, OPEN/SECRET 방을 봄
            if (normalizedUserId) {
                query = query.or(`type.in.(OPEN,SECRET),and(type.eq.1ON1,seeker_id.eq.${normalizedUserId})`);
            } else {
                query = query.in('type', ['OPEN', 'SECRET']);
            }
        }

        // 내 참여자 정보를 session_id 기준으로 RLS 필터링되게 조인 조건 적용
        if (normalizedUserId) {
            query = query.eq('my_participant.session_id', normalizedUserId);
        }

        // 최신 메시지 순 정렬 및 최신 1건으로 제한 (referencedTable 지정)
        query = query
            .order('created_at', { referencedTable: 'foxtalk_messages', ascending: false })
            .limit(1, { referencedTable: 'foxtalk_messages' })
            .order('created_at', { ascending: false })
            .limit(100);

        const { data: rooms, error } = await query;

        if (error) throw error;

        const roomList = rooms || [];
        if (roomList.length === 0) {
            return { success: true, data: [] };
        }

        // 안읽은 메시지 맵 구축 (room_id -> count)
        const unreadCountMap: Record<string, number> = {};
        roomList.forEach(r => {
            unreadCountMap[r.id] = 0;
        });

        // 내 참여 정보(my_participant) 목록을 일괄 수집하여 안읽은 메시지 개수 조건 조회
        if (normalizedUserId) {
            const activeParticipants = roomList
                .map(r => r.my_participant?.[0])
                .filter(Boolean);

            if (activeParticipants.length > 0) {
                const orConditions = activeParticipants.map(p => {
                    const lastRead = p.last_read_at || '1970-01-01T00:00:00.000Z';
                    return `and(room_id.eq.${p.room_id},created_at.gt.${lastRead},participant_id.neq.${p.id})`;
                }).join(',');

                const { data: unreadMsgs, error: unreadError } = await supabase
                    .from('foxtalk_messages')
                    .select('room_id')
                    .or(orConditions);

                if (!unreadError && unreadMsgs) {
                    unreadMsgs.forEach(msg => {
                        if (unreadCountMap[msg.room_id] !== undefined) {
                            unreadCountMap[msg.room_id] += 1;
                        }
                    });
                }
            }
        }

        const decoratedRooms = roomList.map((room: any) => {
            const latestMsg = room.latest_message?.[0];
            const unreadCount = unreadCountMap[room.id] || 0;

            return {
                ...room,
                latest_message: latestMsg ? latestMsg.content : null,
                latest_message_at: latestMsg ? latestMsg.created_at : null,
                unread_count: unreadCount
            };
        });

        return { success: true, data: decoratedRooms };
    } catch (error: any) {
        console.error('QA_GET_CHAT_ROOMS Error:', error);
        return { success: false, error: '방 목록을 불러오지 못했습니다.' };
    }
};

