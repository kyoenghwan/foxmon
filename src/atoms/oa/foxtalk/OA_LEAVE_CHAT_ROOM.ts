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

        if (room.type === '1ON1') {
            // 1:1 방은 한쪽이 나가면 방 자체를 비활성화 (is_active = false) 하여 양쪽 목록에서 숨김 처리
            // 시스템 메시지 남기기
            await OA_INSERT_CHAT_MESSAGE({
                room_id: roomId,
                content: `대화가 종료되었습니다.`,
                message_type: 'SYSTEM_LEAVE'
            });

            await supabaseAdmin
                .from('foxtalk_rooms')
                .update({ is_active: false })
                .eq('id', roomId);
        } else {
            // 오픈방/비밀방의 경우 내 참가 정보만 삭제
            if (nickname) {
                await OA_INSERT_CHAT_MESSAGE({
                    room_id: roomId,
                    content: `${nickname}님이 퇴장하셨습니다.`,
                    message_type: 'SYSTEM_LEAVE'
                });
            }

            await supabaseAdmin
                .from('foxtalk_participants')
                .delete()
                .eq('room_id', roomId)
                .eq('session_id', sessionId);
        }

        return { success: true };
    } catch (error: any) {
        console.error('OA_LEAVE_CHAT_ROOM Error:', error);
        return { success: false, error: '대화방 나가기에 실패했습니다.' };
    }
};
