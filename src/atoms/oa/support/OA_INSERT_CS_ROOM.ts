"use server";

import { supabaseAdmin } from '@/lib/supabase';

export interface CSRoomData {
    session_id: string; // 익명 세션 ID 또는 유저 ID
    nickname: string;
}

export const OA_INSERT_CS_ROOM = async (data: CSRoomData) => {
    try {
        // 기존 CS 방이 있는지 확인
        const { data: existingRoom } = await supabaseAdmin
            .from('foxtalk_rooms')
            .select('*')
            .eq('type', 'CS')
            .eq('created_by', data.session_id)
            .single();

        if (existingRoom) {
            return { success: true, data: existingRoom };
        }

        const title = `${data.nickname}님의 고객센터 문의`;

        const { data: newRoom, error } = await supabaseAdmin
            .from('foxtalk_rooms')
            .insert([{
                title: title,
                type: 'CS',
                max_participants: 2, // 고객, 관리자
                created_by: data.session_id,
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;
        
        return { success: true, data: newRoom };
    } catch (error: any) {
        console.error('OA_INSERT_CS_ROOM Error:', error?.message || error);
        return { success: false, error: '고객센터 방 생성에 실패했습니다.' };
    }
};
