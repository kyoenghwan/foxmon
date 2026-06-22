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

        // 2단계: 내 참가 정보 조회를 병렬 실행 (메시지 조회 제거)
        const tParallel1Start = performance.now();
        let myParticipants: any[] = [];
        const promises1: PromiseLike<void>[] = [];

        // 내 참가 정보 일괄 조회 프로미스
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
        perfStats['step2_3_parallel_ms'] = performance.now() - tParallel1Start;

        // 3단계 & 4단계: 타임스탬프 비교로 안읽음 상태(EXISTS)를 O(1)로 판정하고 매핑
        const tStep4Start = performance.now();
        const decoratedRooms = roomList.map((room: any) => {
            const myPart = myParticipants.find(p => p.room_id === room.id);
            
            // 타임스탬프 비교를 통해 안읽은 메시지 존재 여부 판정
            let hasNew = false;
            if (myPart) {
                const lastReadTime = myPart.last_read_at ? new Date(myPart.last_read_at).getTime() : 0;
                const lastMsgTime = room.last_message_at ? new Date(room.last_message_at).getTime() : 0;
                
                // 마지막 읽은 시간보다 마지막 메시지 시간이 더 뒤라면 새 메시지 있음
                hasNew = lastMsgTime > lastReadTime;
            }

            return {
                ...room,
                // 로비에서는 최신 메시지 텍스트를 로딩하지 않으므로 null 처리하거나 기본 안내
                latest_message: room.last_message_at ? "새로운 대화가 있습니다." : "대화 내용이 없습니다.",
                latest_message_at: room.last_message_at || null,
                // 프론트 호환성을 위해 unread_count가 1이상이면 뱃지를 띄우게 세팅 (뱃지 내부 텍스트는 N으로 표시될 것임)
                unread_count: hasNew ? 1 : 0,
                my_participant: myPart ? [myPart] : []
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

