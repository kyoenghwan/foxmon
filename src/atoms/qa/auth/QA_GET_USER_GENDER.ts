'use server';

import { supabaseAdmin } from '@/lib/supabase';

/**
 * QA_GET_USER_GENDER
 * 사용자의 성별을 조회합니다.
 */
export async function QA_GET_USER_GENDER(userId: string): Promise<{ success: boolean; gender: string | null }> {
    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('gender')
            .eq('id', userId)
            .single();

        if (error || !data) {
            return { success: false, gender: null };
        }

        return { success: true, gender: data.gender };
    } catch {
        return { success: false, gender: null };
    }
}
