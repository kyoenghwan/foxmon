import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

export async function QA_GET_SITE_BANNERS() {
    nvLog('AT', '▶️ QA_GET_SITE_BANNERS 시작');

    try {
        const { data, error } = await supabaseAdmin
            .from('site_banners')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            nvLog('AT', '❌ QA_GET_SITE_BANNERS 에러', error.message);
            return { success: false, data: [], error: error.message };
        }

        return { success: true, data: data, error: null };
    } catch (err: any) {
        nvLog('AT', '❌ QA_GET_SITE_BANNERS 실패', err.message);
        return { success: false, data: [], error: err.message };
    }
}
