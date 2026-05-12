import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

export async function QA_GET_ALL_BIZ_ADS() {
    nvLog('AT', '▶️ QA_GET_ALL_BIZ_ADS 시작');

    try {
        const { data, error } = await supabaseAdmin
            .from('biz_ads')
            .select(`
                *,
                user:users (
                    id, nickname, email, verified_business_name, login_id
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            nvLog('AT', '❌ QA_GET_ALL_BIZ_ADS 에러', error.message);
            return { success: false, data: [], error: error.message };
        }

        return { success: true, data: data, error: null };
    } catch (err: any) {
        nvLog('AT', '❌ QA_GET_ALL_BIZ_ADS 실패', err.message);
        return { success: false, data: [], error: err.message };
    }
}
