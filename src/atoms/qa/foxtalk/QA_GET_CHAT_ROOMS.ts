'use server';

import { supabase, supabaseAdmin } from '@/lib/supabase';

export const QA_GET_CHAT_ROOMS = async (userId?: string, userRole?: string) => {
    const tServerStart = performance.now();
    const perfStats: Record<string, number> = {};
    
    try {
        const normalizedUserId = userId ? userId.toLowerCase().trim() : undefined;
        
        // 1. 방 정보 조회 (my_participant 조인 완전히 제거하여 렉 해소)
        const tStep1Start = performance.now();
        let query = supabase
            .from('foxtalk_rooms')
            .select(`
                *,
                employer:employer_id(id, login_id, nickname, name, business_name),
                seeker:seeker_id(id, login_id, nickname, name)
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

        query = query
            .order('created_at', { ascending: false })
            .limit(100);

        const { data: rooms, error } = await query;
        perfStats['step1_rooms_ms'] = performance.now() - tStep1Start;

        if (error) throw error;

        const roomList = rooms || [];
        if (roomList.length === 0) {
            return { 
                success: true, 
                data: [],
                performance: {
                    ...perfStats,
                    server_total_ms: performance.now() - tServerStart
                }
            };
        }

        const roomIds = roomList.map(r => r.id);

        // 2단계: 최신 메시지와 내 참가 정보 조회를 병렬 실행 (PromiseLike<void>[] 사용)
        const tParallel1Start = performance.now();
        let allMessages: any[] = [];
        let myParticipants: any[] = [];
        const promises1: PromiseLike<void>[] = [];

        // 2-1. 메시지 일괄 조회 프로미스
        const tMsgStart = performance.now();
        const msgPromise = supabase
            .from('foxtalk_messages')
            .select('room_id, content, created_at, participant_id')
            .in('room_id', roomIds)
            .order('created_at', { ascending: false })
            .then(res => {
                perfStats['detail_msg_ms'] = performance.now() - tMsgStart;
                if (res.error) throw res.error;
                allMessages = res.data || [];
            });
        promises1.push(msgPromise);

        // 2-2. 내 참가 정보 일괄 조회 프로미스 (조인 분리)
        const tPartStart = performance.now();
        if (normalizedUserId) {
            const partPromise = supabase
                .from('foxtalk_participants')
                .select('id, room_id, last_read_at, session_id')
                .in('room_id', roomIds)
                .eq('session_id', normalizedUserId)
                .then(res => {
                    perfStats['detail_participant_ms'] = performance.now() - tPartStart;
                    if (res.error) throw res.error;
                    myParticipants = res.data || [];
                });
            promises1.push(partPromise);
        }

        // 병렬 쿼리 실행 대기
        await Promise.all(promises1);
        perfStats['step2_3_parallel_ms'] = performance.now() - tParallel1Start; // widget 로그명과 일치시킴

        // 3단계: 내 참가 정보를 기반으로 안읽은 메시지 쿼리 실행
        const tStep3Start = performance.now();
        const unreadCountMap: Record<string, number> = {};
        roomList.forEach(r => {
            unreadCountMap[r.id] = 0;
        });

        let unreadMsgs: any[] = [];
        if (normalizedUserId && myParticipants.length > 0) {
            const orConditions = myParticipants.map(p => {
                const lastRead = p.last_read_at || '1970-01-01T00:00:00.000Z';
                return `and(room_id.eq.${p.room_id},created_at.gt.${lastRead},participant_id.neq.${p.id})`;
            }).join(',');

            const { data: msgs, error: unreadError } = await supabase
                .from('foxtalk_messages')
                .select('room_id')
                .or(orConditions);

            perfStats['detail_unread_ms'] = performance.now() - tStep3Start;
            if (unreadError) throw unreadError;
            unreadMsgs = msgs || [];

            unreadMsgs.forEach(msg => {
                if (unreadCountMap[msg.room_id] !== undefined) {
                    unreadCountMap[msg.room_id] += 1;
                }
            });
        }
        perfStats['step3_unread_ms'] = performance.now() - tStep3Start;

        // 4단계: 메모리 매핑 및 데이터 데코레이션
        const tStep4Start = performance.now();
        const latestMsgMap: Record<string, any> = {};
        if (allMessages) {
            allMessages.forEach(msg => {
                if (!latestMsgMap[msg.room_id]) {
                    latestMsgMap[msg.room_id] = msg;
                }
            });
        }

        const decoratedRooms = roomList.map((room: any) => {
            const latestMsg = latestMsgMap[room.id];
            const unreadCount = unreadCountMap[room.id] || 0;
            const myPart = myParticipants.find(p => p.room_id === room.id);

            return {
                ...room,
                latest_message: latestMsg ? latestMsg.content : null,
                latest_message_at: latestMsg ? latestMsg.created_at : null,
                unread_count: unreadCount,
                my_participant: myPart ? [myPart] : [] // 프론트엔드가 기대하는 my_participant 배열 복원
            };
        });
        perfStats['step4_decorate_ms'] = performance.now() - tStep4Start;

        return { 
            success: true, 
            data: decoratedRooms,
            performance: {
                ...perfStats,
                server_total_ms: performance.now() - tServerStart
            }
        };
    } catch (error: any) {
        console.error('QA_GET_CHAT_ROOMS Error:', error);
        return { 
            success: false, 
            error: '방 목록을 불러오지 못했습니다.',
            performance: {
                ...perfStats,
                server_total_ms: performance.now() - tServerStart
            }
        };
    }
};

