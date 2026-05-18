import { supabase, supabaseAdmin } from '@/lib/supabase';

export const QA_GET_CHAT_ROOMS = async (userId?: string, userRole?: string) => {
    try {
        let query = supabase
            .from('foxtalk_rooms')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(100);

        let isAdmin = false;
        if (userId) {
            // 사이트 관리자인지 확인 (RLS 우회를 위해 supabaseAdmin 사용)
            const { data: adminSetting } = await supabaseAdmin
                .from('site_settings')
                .select('key_value')
                .eq('key_name', 'cs_admin_user_id')
                .single();
            if (adminSetting?.key_value?.trim() === userId) {
                isAdmin = true;
            }
        }

        if (isAdmin) {
            // 관리자는 1ON1 방 중 본인이 포함된 방 + OPEN, SECRET, CS 방 전체를 볼 수 있음
            query = query.or(`type.in.(OPEN,SECRET,CS),and(type.eq.1ON1,employer_id.eq.${userId}),and(type.eq.1ON1,seeker_id.eq.${userId})`);
        } else if (userRole === 'EMPLOYER') {
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
