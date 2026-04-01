import { supabase } from '@/lib/supabase';

export const QA_GET_CHAT_ROOMS = async () => {
    try {
        const { data: rooms, error } = await supabase
            .from('foxtalk_rooms')
            .select('*')
            .eq('is_active', true)
            // .eq('type', 'OPEN') // 비밀방도 리스트에는 띄울 수 있음 (자물쇠 표시 아이콘)
            .order('created_at', { ascending: false })
            .limit(50); // 최신 50개 로드

        if (error) throw error;

        // participants 카운트 조인 (Supabase count 쿼리 활용)
        // 복잡한 조인이 필요한 경우, 간단하게 각 룸별 카운트만 따로 뷰/RPC로 만들 수도 있음
        // 일단 기본 버전은 룸 리스트만 가져옵니다.
        
        return { success: true, data: rooms || [] };
    } catch (error: any) {
        console.error('QA_GET_CHAT_ROOMS Error:', error);
        return { success: false, error: '방 목록을 불러오지 못했습니다.' };
    }
};
