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
            // Supabase 쿼리의 or 구문을 활용
            if (normalizedUserId) {
                query = query.or(`type.in.(OPEN,SECRET),and(type.eq.1ON1,seeker_id.eq.${normalizedUserId})`);
            } else {
                query = query.in('type', ['OPEN', 'SECRET']);
            }
        }

        const { data: rooms, error } = await query;

        if (error) throw error;
        
        // 각 방의 최근 메시지 및 안읽은 카운트 조회
        const decoratedRooms = await Promise.all((rooms || []).map(async (room: any) => {
            // 1. 최근 메시지 1개 쿼리
            const { data: latestMsg } = await supabase
                .from('foxtalk_messages')
                .select('content, created_at, participant_id')
                .eq('room_id', room.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            // 2. 안읽은 메시지 카운팅
            let unreadCount = 0;
            if (normalizedUserId) {
                const { data: participant } = await supabase
                    .from('foxtalk_participants')
                    .select('id, last_read_at')
                    .eq('room_id', room.id)
                    .eq('session_id', normalizedUserId)
                    .maybeSingle();

                if (participant) {
                    const lastReadAt = participant.last_read_at || '1970-01-01T00:00:00.000Z';
                    const { count, error: countErr } = await supabase
                        .from('foxtalk_messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('room_id', room.id)
                        .neq('participant_id', participant.id)
                        .gt('created_at', lastReadAt);
                    
                    if (!countErr && count !== null) {
                        unreadCount = count;
                    }
                }
            }

            return {
                ...room,
                latest_message: latestMsg ? latestMsg.content : null,
                latest_message_at: latestMsg ? latestMsg.created_at : null,
                unread_count: unreadCount
            };
        }));

        return { success: true, data: decoratedRooms };
    } catch (error: any) {
        console.error('QA_GET_CHAT_ROOMS Error:', error);
        return { success: false, error: '방 목록을 불러오지 못했습니다.' };
    }
};
