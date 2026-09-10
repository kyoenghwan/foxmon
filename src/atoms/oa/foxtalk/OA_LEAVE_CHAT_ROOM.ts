"use server";

import { supabaseAdmin } from '@/lib/supabase';
import { getChatActor, getChatAccess } from '@/lib/chat-authorization';
import { OA_INSERT_CHAT_MESSAGE } from './OA_INSERT_CHAT_MESSAGE';

export const OA_LEAVE_CHAT_ROOM = async (roomId: string, sessionId: string, nickname?: string) => {
    try {
        const actor = await getChatActor();
        if (actor !== sessionId) throw new Error('본인의 참여 정보만 변경할 수 있습니다.');
        await getChatAccess(roomId, actor);
        // 1. 방 정보 확인
        const { data: room } = await supabaseAdmin
            .from('foxtalk_rooms')
            .select('type, id')
            .eq('id', roomId)
            .single();

        if (!room) throw new Error('방을 찾을 수 없습니다.');

        // 시스템 메시지 기록
        const leaveMessage = nickname ? `${nickname}님이 퇴장하셨습니다.` : '상대방이 퇴장하셨습니다.';
        const messageResult = await OA_INSERT_CHAT_MESSAGE({
            room_id: roomId,
            content: leaveMessage,
            message_type: 'SYSTEM_LEAVE'
        });
        if (!messageResult.success) throw new Error('퇴장 메시지를 저장하지 못했습니다.');

        // 1:1 방이든 오픈방이든 나간 사람의 참가 정보만 left_at 으로 업데이트하여 목록에서 퇴장 처리
        const { error: leaveError } = await supabaseAdmin
            .from('foxtalk_participants')
            .update({ left_at: new Date().toISOString() })
            .eq('room_id', roomId)
            .eq('session_id', sessionId);
        if (leaveError) throw leaveError;

        return { success: true };
    } catch (error: any) {
        console.error('OA_LEAVE_CHAT_ROOM Error:', error);
        return { success: false, error: '대화방 나가기에 실패했습니다.' };
    }
};
