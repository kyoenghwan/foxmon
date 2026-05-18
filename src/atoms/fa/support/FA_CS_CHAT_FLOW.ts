"use server";

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

        // 3. 방에 참여자로 등록 (이미 등록되어 있으면 중복 에러가 날 수 있으나 OA 쪽에서 처리되거나 무시됨, 여기서는 그냥 시도)
        await OA_INSERT_CHAT_PARTICIPANT({
            room_id: room.id,
            session_id: data.session_id,
            nickname: data.nickname,
            avatar_type: data.avatar_type
        });

        return { success: true, data: room };
    } catch (error: any) {
        console.error('FA_CS_CHAT_FLOW Error:', error);
        return { success: false, error: error.message || '채팅방 진입에 실패했습니다.' };
    }
};
