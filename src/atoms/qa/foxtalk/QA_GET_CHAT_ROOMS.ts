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
                seeker:seeker_id(id, login_id, nickname, name)
            `)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(100);

        let isAdmin = false;
        if (normalizedUserId) {
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

        const { data: rooms, error } = await query;

        if (error) throw error;

        const roomList = rooms || [];
        if (roomList.length === 0) {
            return { success: true, data: [] };
        }

        const roomIds = roomList.map(r => r.id);

        // 1. 모든 방에 대한 최근 메시지 일괄 조회 (최신순 정렬)
        const { data: allMessages, error: msgError } = await supabase
            .from('foxtalk_messages')
            .select('room_id, content, created_at, participant_id')
            .in('room_id', roomIds)
            .order('created_at', { ascending: false });

        if (msgError) throw msgError;

        // 2. 내 세션이 참여한 방들의 참가자 정보 일괄 조회
        const participantsMap: Record<string, any> = {};
        if (normalizedUserId) {
            const { data: participantsList, error: partError } = await supabase
                .from('foxtalk_participants')
                .select('id, room_id, last_read_at')
                .in('room_id', roomIds)
                .eq('session_id', normalizedUserId);
            
            if (partError) throw partError;

            if (participantsList) {
                participantsList.forEach(p => {
                    participantsMap[p.room_id] = p;
                });
            }
        }

        // 3. 메시지 데이터를 바탕으로 최근 메시지 매핑 및 안읽은 개수 카운팅 (0ms)
        const latestMsgMap: Record<string, any> = {};
        const unreadCountMap: Record<string, number> = {};

        // 초기화
        roomIds.forEach(id => {
            unreadCountMap[id] = 0;
        });

        if (allMessages) {
            allMessages.forEach(msg => {
                // 이미 채워진 것이 최신 메시지이므로, 비어있을 때만 (최초 1회만) 채워 넣음
                if (!latestMsgMap[msg.room_id]) {
                    latestMsgMap[msg.room_id] = msg;
                }

                // 안읽은 메시지 카운트 판정
                if (normalizedUserId) {
                    const myParticipant = participantsMap[msg.room_id];
                    if (myParticipant) {
                        const lastReadAt = myParticipant.last_read_at || '1970-01-01T00:00:00.000Z';
                        if (msg.participant_id !== myParticipant.id && msg.created_at > lastReadAt) {
                            unreadCountMap[msg.room_id] += 1;
                        }
                    }
                }
            });
        }

        const decoratedRooms = roomList.map((room: any) => {
            const latestMsg = latestMsgMap[room.id];
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
