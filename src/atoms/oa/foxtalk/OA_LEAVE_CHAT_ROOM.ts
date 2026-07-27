"use server";

import { supabaseAdmin } from '@/lib/supabase';
import { OA_INSERT_CHAT_MESSAGE } from './OA_INSERT_CHAT_MESSAGE';

export const OA_LEAVE_CHAT_ROOM = async (roomId: string, sessionId: string, nickname?: string) => {
    try {
        // 1. 방 정보 확인
        const { data: room } = await supabaseAdmin
            .from('foxtalk_rooms')
            .select('type, id')
            .eq('id', roomId)
            .single();

        if (!room) throw new Error('방을 찾을 수 없습니다.');

        // 시스템 메시지 기록
        const leaveMessage = nickname ? `${nickname}님이 퇴장하셨습니다.` : '상대방이 퇴장하셨습니다.';
        await OA_INSERT_CHAT_MESSAGE({
            room_id: roomId,
            content: leaveMessage,
            message_type: 'SYSTEM_LEAVE'
        });

        // 1:1 방이든 오픈방이든 나간 사람의 참가 정보만 left_at 으로 업데이트하여 목록에서 퇴장 처리
        await supabaseAdmin
            .from('foxtalk_participants')
            .update({ left_at: new Date().toISOString() })
            .eq('room_id', roomId)
            .eq('session_id', sessionId);

        return { success: true };
    } catch (error: any) {
        console.error('OA_LEAVE_CHAT_ROOM Error:', error);
        return { success: false, error: '대화방 나가기에 실패했습니다.' };
    }
};
