import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

export async function OA_DELETE_COMMUNITY_POST(postId: string) {
    nvLog('AT', '▶️ OA_DELETE_COMMUNITY_POST 시작', { postId });

    try {
        const { error } = await supabaseAdmin
            .from('community_posts')
            .delete()
            .eq('id', postId);

        if (error) {
            nvLog('AT', '❌ OA_DELETE_COMMUNITY_POST 에러', error.message);
            return { success: false, message: error.message };
        }

        nvLog('AT', '✅ OA_DELETE_COMMUNITY_POST 성공');
        return { success: true, message: null };
    } catch (err: any) {
        nvLog('AT', '❌ OA_DELETE_COMMUNITY_POST 시스템 에러', err.message);
        return { success: false, message: err.message };
    }
}
