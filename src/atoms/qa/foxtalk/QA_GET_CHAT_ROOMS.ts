import { supabase } from '@/lib/supabase';

export const QA_GET_CHAT_ROOMS = async (userId?: string, userRole?: string) => {
    try {
        let query = supabase
            .from('foxtalk_rooms')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(100);

        if (userRole === 'EMPLOYER') {
            // 사장님은 본인이 연관된 1ON1 방만 보임
            query = query.eq('type', '1ON1').eq('employer_id', userId);
        } else {
            // 일반 구직자는 본인이 연관된 1ON1 방이거나, OPEN/SECRET 방을 봄
            // Supabase 쿼리의 or 구문을 활용
            if (userId) {
                query = query.or(`type.in.(OPEN,SECRET),and(type.eq.1ON1,seeker_id.eq.${userId})`);
            } else {
                query = query.in('type', ['OPEN', 'SECRET']);
            }
        }

        const { data: rooms, error } = await query;

        if (error) throw error;
        
        return { success: true, data: rooms || [] };
    } catch (error: any) {
        console.error('QA_GET_CHAT_ROOMS Error:', error);
        return { success: false, error: '방 목록을 불러오지 못했습니다.' };
    }
};
