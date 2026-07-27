'use server';

import { supabase, supabaseAdmin } from '@/lib/supabase';

export const QA_GET_CHAT_ROOMS = async (userId?: string, userRole?: string) => {
    const tServerStart = performance.now();
    const perfStats: Record<string, number> = {};
    
    try {
        const normalizedUserId = userId ? userId.toLowerCase().trim() : undefined;
        
        // 1. 방 정보 및 참여자 정보 일괄 조인 조회 (네트워크 RTT 1회로 단축)
        const tStep1Start = performance.now();
        let query = supabaseAdmin
            .from('foxtalk_rooms')
            .select(`
                *,
                employer:employer_id(id, login_id, nickname, name, business_name),
                seeker:seeker_id(id, login_id, nickname, name),
                foxtalk_participants(id, last_read_at, left_at, session_id)
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
        } else {
            // 일반 회원 / 업체 회원 공통: 본인이 연관된 1ON1 방이거나, OPEN/SECRET 방을 봄
            if (normalizedUserId) {
                query = query.or(`type.in.(OPEN,SECRET),and(type.eq.1ON1,employer_id.eq.${normalizedUserId}),and(type.eq.1ON1,seeker_id.eq.${normalizedUserId})`);
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

        // 2단계: (삭제됨 - 1단계 조인 쿼리로 통합됨)
        perfStats['step2_3_parallel_ms'] = 0;
        perfStats['detail_participant_ms'] = 0;

        // 3단계 & 4단계: 타임스탬프 비교로 안읽음 상태(EXISTS)를 O(1)로 판정하고 매핑
        const tStep4Start = performance.now();
        const decoratedRooms = roomList.map((room: any) => {
            // 조인된 전체 참여자 목록에서 내 정보 추출
            const myPart = room.foxtalk_participants?.find(
                (p: any) => p.session_id?.toLowerCase().trim() === normalizedUserId
            );
            
            // 타임스탬프 비교를 통해 안읽은 메시지 존재 여부 판정
            let hasNew = false;
            if (myPart) {
                const lastReadTime = myPart.last_read_at ? new Date(myPart.last_read_at).getTime() : 0;
                const lastMsgTime = room.last_message_at ? new Date(room.last_message_at).getTime() : 0;
                
                // 마지막 읽은 시간보다 마지막 메시지 시간이 더 뒤라면 새 메시지 있음
                hasNew = lastMsgTime > lastReadTime;
            }

            // 프론트 전달 시 foxtalk_participants 필드는 제외하여 패이로드 크기 축소 (보안 및 데이터 최소화)
            const { foxtalk_participants, ...roomData } = room;

            return {
                ...roomData,
                // 로비에서는 최신 메시지 텍스트를 로딩하지 않으므로 null 처리하거나 기본 안내
                latest_message: hasNew ? "새로운 대화가 있습니다." : (room.last_message_at ? "최근 대화내용이 있습니다." : "대화 내용이 없습니다."),
                latest_message_at: room.last_message_at || null,
                // 프론트 호환성을 위해 unread_count가 1이상이면 뱃지를 띄우게 세팅 (뱃지 내부 텍스트는 N으로 표시될 것임)
                unread_count: hasNew ? 1 : 0,
                my_participant: myPart ? [myPart] : []
            };
        });
        
        // 💡 내가 대화방을 나갔으면(left_at이 채워져 있거나 참여 정보가 없으면) 로비 목록에서 숨김!
        const filteredRooms = decoratedRooms.filter((room: any) => {
            const myPart = room.my_participant?.[0];
            if (!myPart || myPart.left_at) {
                return false;
            }
            return true;
        });

        perfStats['step4_decorate_ms'] = performance.now() - tStep4Start;

        return { 
            success: true, 
            data: filteredRooms,
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

