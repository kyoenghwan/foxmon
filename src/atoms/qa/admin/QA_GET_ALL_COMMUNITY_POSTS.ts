import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

export async function QA_GET_ALL_COMMUNITY_POSTS() {
    nvLog('AT', '▶️ QA_GET_ALL_COMMUNITY_POSTS 시작');

    try {
        const { data, error } = await supabaseAdmin
            .from('community_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            nvLog('AT', '❌ QA_GET_ALL_COMMUNITY_POSTS 에러', error.message);
            return { success: false, data: [], error: error.message };
        }

        return { success: true, data: data, error: null };
    } catch (err: any) {
        nvLog('AT', '❌ QA_GET_ALL_COMMUNITY_POSTS 시스템 에러', err.message);
        return { success: false, data: [], error: err.message };
    }
}
