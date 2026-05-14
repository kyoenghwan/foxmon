"use server";

import { supabaseAdmin } from '@/lib/supabase';
import { sendTelegramAlert } from '@/lib/telegram';

export interface ChatRoomData {
    title: string;
    type: 'OPEN' | 'SECRET' | '1ON1';
    room_code?: string;
    password_hash?: string;
    max_participants: number;
    created_by: string;
    job_id?: string;
    employer_id?: string;
    seeker_id?: string;
}

export const OA_INSERT_CHAT_ROOM = async (data: ChatRoomData) => {
    try {
        let result = await supabaseAdmin
            .from('foxtalk_rooms')
            .insert([{
                title: data.title,
                type: data.type,
                room_code: data.room_code || null,
                password_hash: data.password_hash || null,
                max_participants: data.max_participants,
                created_by: data.created_by,
                is_active: true,
                job_id: data.job_id || null,
                employer_id: data.employer_id || null,
                seeker_id: data.seeker_id || null
            }])
            .select()
            .single();

        // 1차 시도에서 외래키 오류 발생 시 처리
        if (result.error && result.error.message.includes('violates foreign key constraint')) {
            const isJobIdError = result.error.message.includes('job_id');
            const isEmployerIdError = result.error.message.includes('employer_id');
            
            console.warn('Foreign key violation detected in foxtalk_rooms. Retrying...', result.error.message);
            result = await supabaseAdmin
                .from('foxtalk_rooms')
                .insert([{
                    title: data.title,
                    type: data.type,
                    room_code: data.room_code || null,
                    password_hash: data.password_hash || null,
                    max_participants: data.max_participants,
                    created_by: data.created_by,
                    is_active: true,
                    job_id: isJobIdError ? null : (data.job_id || null),
                    employer_id: isEmployerIdError ? null : (data.employer_id || null),
                    seeker_id: data.seeker_id || null
                }])
                .select()
                .single();
        }

        if (result.error) throw result.error;
        const room = result.data;

        // 1:1 방 생성 시 사장님에게 텔레그램 알림 전송 (비동기로 실행)
        if (data.type === '1ON1' && data.employer_id) {
            sendTelegramAlert(
                data.employer_id, 
                `🔔 <b>[폭스몬] 새로운 지원자가 연락했습니다!</b>\n\n💬 지원자 분이 <b>[${data.title}]</b> 구인글을 통해 FoxTalk 메시지를 시작했습니다.\n\n👉 폭스몬 사이트에 접속해서 답변해주세요!`
            ).catch(err => console.error("텔레그램 알림 발송 중 오류:", err));
        }

        return { success: true, data: room };
    } catch (error: any) {
        console.error('OA_INSERT_CHAT_ROOM Error (Detailed):', error?.message || error);
        return { success: false, error: error?.message || '채팅방 생성에 실패했습니다.' };
    }
};
