import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

export async function QA_GET_ALL_BIZ_ADS() {
    nvLog('AT', '▶️ QA_GET_ALL_BIZ_ADS 시작');

    try {
        const { data: bizAds, error: bErr } = await supabaseAdmin
            .from('biz_ads')
            .select(`
                *,
                user:users (
                    id, nickname, email, verified_business_name, login_id
                )
            `)
            .order('created_at', { ascending: false });

        if (bErr) {
            nvLog('AT', '❌ QA_GET_ALL_BIZ_ADS (biz_ads) 에러', bErr.message);
        }

        const { data: standaloneJobs, error: jErr } = await supabaseAdmin
            .from('jobs')
            .select(`
                *,
                user:users (
                    id, nickname, email, verified_business_name, login_id
                )
            `)
            .is('linked_ad_id', null)
            .order('created_at', { ascending: false });

        if (jErr) {
            nvLog('AT', '❌ QA_GET_ALL_BIZ_ADS (jobs) 에러', jErr.message);
        }

        const allList = [
            ...(bizAds || []).map(ad => ({ ...ad, is_job: false })),
            ...(standaloneJobs || []).map(job => ({ ...job, is_job: true }))
        ];

        allList.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

        return { success: true, data: allList, error: null };
    } catch (err: any) {
        nvLog('AT', '❌ QA_GET_ALL_BIZ_ADS 실패', err.message);
        return { success: false, data: [], error: err.message };
    }
}
