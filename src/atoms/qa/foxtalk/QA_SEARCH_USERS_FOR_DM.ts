'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

/**
 * QA: DM용 사용자 검색
 * 닉네임 또는 login_id로 검색하여 DM 대상 후보를 반환
 */
export async function QA_SEARCH_USERS_FOR_DM(keyword: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, data: [], message: '로그인이 필요합니다.' };
        }

        const trimmed = keyword.trim();
        if (!trimmed || trimmed.length < 2) {
            return { success: false, data: [], message: '2글자 이상 입력해주세요.' };
        }

        // 닉네임 또는 login_id로 검색 (본인 제외, 최대 10명)
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('id, login_id, nickname, profile_image_url')
            .neq('id', session.user.id)
            .or(`nickname.ilike.%${trimmed}%,login_id.ilike.%${trimmed}%`)
            .limit(10);

        if (error) {
            console.error('QA_SEARCH_USERS_FOR_DM Error:', error);
            return { success: false, data: [], message: '검색 중 오류가 발생했습니다.' };
        }

        return { success: true, data: data || [] };
    } catch (err: any) {
        console.error('QA_SEARCH_USERS_FOR_DM Exception:', err);
        return { success: false, data: [], message: '시스템 오류가 발생했습니다.' };
    }
}
