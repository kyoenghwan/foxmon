"use server";

import { supabaseAdmin } from '@/lib/supabase';
import { QA_GET_CS_ROOM } from '@/src/atoms/qa/support/QA_GET_CS_ROOM';
import { OA_INSERT_CS_ROOM } from '@/src/atoms/oa/support/OA_INSERT_CS_ROOM';
import { OA_INSERT_CHAT_PARTICIPANT } from '@/src/atoms/oa/foxtalk/OA_INSERT_CHAT_PARTICIPANT';

export interface CSFlowData {
    session_id: string;
    nickname: string;
    avatar_type: string;
}

export const FA_CS_CHAT_FLOW = async (data: CSFlowData) => {
    try {
        // 1. 기존 CS 방 조회
        const roomRes = await QA_GET_CS_ROOM(data.session_id);
        let room = roomRes.data;

        // 2. 방이 없으면 생성
        if (!room) {
            const createRes = await OA_INSERT_CS_ROOM({
                session_id: data.session_id,
                nickname: data.nickname
            });
            if (!createRes.success) throw new Error(createRes.error);
            room = createRes.data;
        }

        if (!room) throw new Error('방 정보가 없습니다.');

        // 3. 고객 참여자 등록 (upsert)
        await OA_INSERT_CHAT_PARTICIPANT({
            room_id: room.id,
            session_id: data.session_id,
            nickname: data.nickname,
            avatar_type: data.avatar_type
        });

        // 4. site_settings 의 고객센터 전용 계정을 동일 방에 참가자로 등록 (실시간 상담·수신용)
        const { data: adminSetting } = await supabaseAdmin
            .from('site_settings')
            .select('key_value')
            .eq('key_name', 'cs_admin_user_id')
            .single();
        const adminUserId = adminSetting?.key_value?.trim();
        if (adminUserId && adminUserId !== data.session_id) {
            await OA_INSERT_CHAT_PARTICIPANT({
                room_id: room.id,
                session_id: adminUserId,
                nickname: '폭스몬 고객센터',
                avatar_type: 'fox1',
            });
        }

        return { success: true, data: room };
    } catch (error: any) {
        console.error('FA_CS_CHAT_FLOW Error:', error);
        return { success: false, error: error.message || '채팅방 진입에 실패했습니다.' };
    }
};
