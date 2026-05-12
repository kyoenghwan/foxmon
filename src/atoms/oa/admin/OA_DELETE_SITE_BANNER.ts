import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

export async function OA_DELETE_SITE_BANNER(id: string) {
    nvLog('AT', '▶️ OA_DELETE_SITE_BANNER 시작', { id });

    try {
        const { error } = await supabaseAdmin
            .from('site_banners')
            .delete()
            .eq('id', id);

        if (error) {
            nvLog('AT', '❌ OA_DELETE_SITE_BANNER 에러', error.message);
            return { success: false, error: error.message };
        }

        nvLog('AT', '✅ OA_DELETE_SITE_BANNER 성공');
        return { success: true, error: null };
    } catch (err: any) {
        nvLog('AT', '❌ OA_DELETE_SITE_BANNER 시스템 에러', err.message);
        return { success: false, error: err.message };
    }
}
