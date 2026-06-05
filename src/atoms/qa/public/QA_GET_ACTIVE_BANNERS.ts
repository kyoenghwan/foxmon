import { createClient } from '@/utils/supabase/server';

interface BannerCache {
    data: any[];
    lastFetched: number;
    isFetching: boolean;
}

const bannerCache: Record<string, BannerCache> = {};
const CACHE_TTL_MS = 60 * 1000; // 60초 캐시 (1분)

export async function QA_GET_ACTIVE_BANNERS(type: 'POPUP' | 'MAIN_BANNER' = 'POPUP') {
    const now = Date.now();
    const cache = bannerCache[type];

    // 캐시가 존재하고 TTL 만료 전인 경우 즉시 캐시 데이터 반환
    if (cache && (now - cache.lastFetched < CACHE_TTL_MS)) {
        return cache.data;
    }

    // 이미 백그라운드나 다른 요청에서 패칭 중인 경우 기존 캐시 데이터 반환 (없으면 빈 배열)
    if (cache && cache.isFetching) {
        return cache.data;
    }

    if (!bannerCache[type]) {
        bannerCache[type] = { data: [], lastFetched: 0, isFetching: false };
    }

    bannerCache[type].isFetching = true;

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
            return bannerCache[type].data || []; // 에러 시 기존 캐시 반환
        }

        bannerCache[type].data = data || [];
        bannerCache[type].lastFetched = Date.now();
        return bannerCache[type].data;
    } catch (e: any) {
        console.error('QA_GET_ACTIVE_BANNERS 시스템 에러:', e.message);
        return bannerCache[type].data || [];
    } finally {
        bannerCache[type].isFetching = false;
    }
}

