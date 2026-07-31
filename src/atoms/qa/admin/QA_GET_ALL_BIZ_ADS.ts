import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

export async function QA_GET_ALL_BIZ_ADS() {
    nvLog('AT', '▶️ QA_GET_ALL_BIZ_ADS 시작');

    try {
        // biz_ads: user join 없이 단순 조회 (join 실패로 전체가 터지는 문제 방지)
        const { data: bizAds, error: bErr } = await supabaseAdmin
            .from('biz_ads')
            .select('*')
            .order('created_at', { ascending: false });

        if (bErr) {
            nvLog('AT', '❌ QA_GET_ALL_BIZ_ADS (biz_ads) 에러', bErr.message);
        }

        // jobs 전체 조회 (linked_ad_id 맵핑용)
        const { data: allJobs, error: jErr } = await supabaseAdmin
            .from('jobs')
            .select('*')
            .order('created_at', { ascending: false });

        if (jErr) {
            nvLog('AT', '❌ QA_GET_ALL_BIZ_ADS (jobs) 에러', jErr.message);
        }

        // linked_ad_id → jobs 정보 맵
        const linkedJobMap = new Map<string, any>();
        (allJobs || []).forEach(j => {
            if (j.linked_ad_id) linkedJobMap.set(j.linked_ad_id, j);
        });

        // biz_ads 포맷팅 (연결된 job 정보 보완)
        const formattedBizAds = (bizAds || []).map(ad => {
            const linkedJob = linkedJobMap.get(ad.id);
            return {
                ...ad,
                title: ad.title || linkedJob?.title || '제목 없음',
                company_name: ad.company_name || ad.company || linkedJob?.company_name || '업체명 없음',
                location: ad.location || linkedJob?.location || '',
                pay: ad.pay || (linkedJob?.salary_type ? `[${linkedJob.salary_type}] ${linkedJob.salary_amount}` : linkedJob?.salary_amount) || '',
                is_job: false,
            };
        });

        // 독립 구인공고 (biz_ads에 연결 안 된 것)
        const standaloneJobs = (allJobs || []).filter(j => !j.linked_ad_id).map(job => ({
            ...job,
            company_name: job.company_name || job.company || '업체명 없음',
            is_job: true,
        }));

        const allList = [...formattedBizAds, ...standaloneJobs];
        allList.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

        nvLog('AT', `✅ QA_GET_ALL_BIZ_ADS 완료: biz_ads=${formattedBizAds.length}, standaloneJobs=${standaloneJobs.length}, total=${allList.length}`);
        return { success: true, data: allList, error: null };
    } catch (err: any) {
        nvLog('AT', '❌ QA_GET_ALL_BIZ_ADS 실패', err.message);
        return { success: false, data: [], error: err.message };
    }
}
