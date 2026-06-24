'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

/**
 * OA: 일반 DM 채팅방 생성 또는 기존 방 반환
 * 두 사용자 간 기존 DM 방이 있으면 그 방을, 없으면 새로 생성
 */
export async function OA_CREATE_DM_ROOM(targetUserId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: '로그인이 필요합니다.' };
        }

        const myId = session.user.id;
        if (myId === targetUserId) {
            return { success: false, error: '자기 자신과는 대화할 수 없습니다.' };
        }

        // 기존 DM 방이 있는지 확인 (양방향 모두 확인)
        const { data: existing } = await supabaseAdmin
            .from('foxtalk_rooms')
            .select('*')
            .eq('type', '1ON1')
            .eq('is_active', true)
            .or(
                `and(employer_id.eq.${myId},seeker_id.eq.${targetUserId}),and(employer_id.eq.${targetUserId},seeker_id.eq.${myId})`
            )
            .limit(1)
            .maybeSingle();

        if (existing) {
            return { success: true, data: existing, isExisting: true };
        }

        // 대상 사용자 정보 조회
        const { data: targetUser } = await supabaseAdmin
            .from('users')
            .select('nickname, name, business_name')
            .eq('id', targetUserId)
            .single();

        // 내 정보 조회
        const { data: myUser } = await supabaseAdmin
            .from('users')
            .select('nickname, name, business_name')
            .eq('id', myId)
            .single();

        const targetNick = targetUser?.business_name || targetUser?.nickname || targetUser?.name || '상대방';
        const myNick = myUser?.business_name || myUser?.nickname || myUser?.name || '나';

        // 새 DM 방 생성
        const { data: room, error } = await supabaseAdmin
            .from('foxtalk_rooms')
            .insert({
                title: `${myNick} ↔ ${targetNick}`,
                type: '1ON1',
                max_participants: 2,
                created_by: myId,
                employer_id: myId,
                seeker_id: targetUserId,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('OA_CREATE_DM_ROOM Insert Error:', error);
            return { success: false, error: '대화방 생성에 실패했습니다.' };
        }

        // 참여자 자동 등록
        await supabaseAdmin
            .from('foxtalk_participants')
            .upsert([
                {
                    room_id: room.id,
                    session_id: myId,
                    nickname: myNick,
                    avatar_type: 'fox1',
                    joined_at: new Date().toISOString()
                },
                {
                    room_id: room.id,
                    session_id: targetUserId,
                    nickname: targetNick,
                    avatar_type: 'fox2',
                    joined_at: new Date().toISOString()
                }
            ], { onConflict: 'room_id, session_id' });

        return { success: true, data: room, isExisting: false };
    } catch (err: any) {
        console.error('OA_CREATE_DM_ROOM Exception:', err);
        return { success: false, error: err?.message || '시스템 오류가 발생했습니다.' };
    }
}
