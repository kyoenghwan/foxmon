"use server";

import { supabaseAdmin } from '@/lib/supabase';

interface UpdateReadData {
    room_id: string;
    session_id: string;
}

export const OA_UPDATE_PARTICIPANT_READ = async (
    data: UpdateReadData
) => {
    try {
        const { error } = await supabaseAdmin
            .from('foxtalk_participants')
            .update({ last_read_at: new Date().toISOString() })
            .eq('room_id', data.room_id)
            .eq('session_id', data.session_id);

        if (error) throw error;
        
        return { success: true };
    } catch (error: any) {
        console.error('OA_UPDATE_PARTICIPANT_READ Error:', error);
        return { 
            success: false, 
            errorCode: 'INTERNAL_ERROR', 
            message: '읽음 처리에 실패했습니다.',
            errorDetail: error?.message
        };
    }
};
