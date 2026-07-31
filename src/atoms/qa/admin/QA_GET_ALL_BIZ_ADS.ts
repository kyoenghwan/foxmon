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

        const { data: linkedJobs } = await supabaseAdmin
            .from('jobs')
            .select('*')
            .not('linked_ad_id', 'is', null);

        const linkedJobMap = new Map<string, any>();
        (linkedJobs || []).forEach(j => {
            if (j.linked_ad_id) linkedJobMap.set(j.linked_ad_id, j);
        });

        const formattedBizAds = (bizAds || []).map(ad => {
            const linkedJob = linkedJobMap.get(ad.id);
            return {
                ...ad,
                title: ad.title || linkedJob?.title || '제목 없음',
                company_name: ad.company_name || ad.company || linkedJob?.company_name || linkedJob?.company || '업체명 없음',
                location: ad.location || linkedJob?.location || '',
                pay: ad.pay || (linkedJob?.salary_type ? `[${linkedJob.salary_type}] ${linkedJob.salary_amount}` : linkedJob?.salary_amount) || '',
                is_job: false
            };
        });

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

        const formattedJobs = (standaloneJobs || []).map(job => ({
            ...job,
            company_name: job.company_name || job.company || '업체명 없음',
            is_job: true
        }));

        const allList = [...formattedBizAds, ...formattedJobs];
        allList.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

        return { success: true, data: allList, error: null };
    } catch (err: any) {
        nvLog('AT', '❌ QA_GET_ALL_BIZ_ADS 실패', err.message);
        return { success: false, data: [], error: err.message };
    }
}
