import { createClient } from '@/utils/supabase/server';
import { unstable_cache } from 'next/cache';

async function QA_GET_ACTIVE_BANNERS_INTERNAL(type: 'POPUP' | 'MAIN_BANNER' = 'POPUP') {
    try {
        const supabase = await createClient();
        const nowStr = new Date().toISOString();

        // 1. is_active = true
        // 2. type = type
        // 3. start_date가 null이거나 현재보다 과거
        // 4. end_date가 null이거나 현재보다 미래
        const { data, error } = await supabase
            .from('site_banners')
            .select('*')
            .eq('type', type)
            .eq('is_active', true)
            .or(`start_date.is.null,start_date.lte.${nowStr}`)
            .or(`end_date.is.null,end_date.gte.${nowStr}`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('QA_GET_ACTIVE_BANNERS 에러:', error.message);
            return [];
        }

        return data || [];
    } catch (e: any) {
        console.error('QA_GET_ACTIVE_BANNERS 시스템 에러:', e.message);
        return [];
    }
}

// unstable_cache 래핑 영구 공유 캐싱 (1분 캐시)
const getCachedBanners = unstable_cache(
    async (type: 'POPUP' | 'MAIN_BANNER') => {
        return QA_GET_ACTIVE_BANNERS_INTERNAL(type);
    },
    ['active-banners-query'],
    { revalidate: 60, tags: ['banners'] }
);

export async function QA_GET_ACTIVE_BANNERS(type: 'POPUP' | 'MAIN_BANNER' = 'POPUP') {
    return getCachedBanners(type);
}

