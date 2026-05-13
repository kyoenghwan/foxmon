'use server';

import { supabaseAdmin } from './supabase';
import { AdItem, getRawMockAds } from './ad-service';
import { applyRollingLogic } from './ad-rolling-logic';

export interface RankingSimResult {
    ad: AdItem;
    currentRank: number;
    prevRank: number | null; // 1 min ago
    prev5Rank: number | null; // 5 min ago
}

export async function getAdRankingSimulation(tier: 'PREMIUM_MAIN' | 'SIDE' | 'PREMIUM' | 'SPECIAL' | 'LINE' | 'GENERAL' | 'AD_GENERAL' = 'PREMIUM_MAIN'): Promise<RankingSimResult[]> {
    const targetTable = tier === 'GENERAL' ? 'jobs' : 'biz_ads';

    const { data, error } = await supabaseAdmin
        .from(targetTable)
        .select('*')
        .eq('tier', tier);

    let rawAds: AdItem[] = [];
    if (!error && data && data.length > 0) {
        rawAds = data.map((item: any) => ({
            ...item,
            company: item.company || item.company_name || '업체명 없음',
            pay: item.pay || (item.salary_type ? `[${item.salary_type}] ${item.salary_amount}` : item.salary_amount) || '급여협의',
            image: item.image || item.logo_url || '',
            isRealAd: true
        })) as AdItem[];
    }

    // 실제 홈페이지 화면과 동일하게 가상 배너(Mock Data)로 50개 슬롯을 채움
    if (rawAds.length < 50) {
        const mockAdsForTier = await getRawMockAds(tier);
        rawAds = [...rawAds, ...mockAdsForTier.slice(0, 50 - rawAds.length)];
    }

    // 시뮬레이션을 위한 기준 시간
    const nowMs = Date.now();
    const prevMs = nowMs - 60 * 1000;
    const prev5Ms = nowMs - 5 * 60 * 1000;

    // 모의 롤링 실행 (리스트는 충분히 길게 50까지 계산)
    const currentList = applyRollingLogic(rawAds, 50, nowMs);
    const prevList = applyRollingLogic(rawAds, 50, prevMs);
    const prev5List = applyRollingLogic(rawAds, 50, prev5Ms);

    // 고유 광고별로 현재 순위를 매핑 (더블 슬롯인 경우 _dup가 아닌 첫 번째 등장 위치 기준)
    const results: RankingSimResult[] = [];
    const processedIds = new Set<string>();

    for (let i = 0; i < currentList.length; i++) {
        const ad = currentList[i];
        const originalId = ad.id.replace('_dup', '');
        if (processedIds.has(originalId)) continue;
        processedIds.add(originalId);

        // 이전 순위 탐색 헬퍼
        const findRank = (list: AdItem[]) => {
            const idx = list.findIndex(a => a.id.replace('_dup', '') === originalId);
            return idx >= 0 ? idx + 1 : null;
        };

        results.push({
            ad,
            currentRank: i + 1,
            prevRank: findRank(prevList),
            prev5Rank: findRank(prev5List),
        });
    }

    return results;
}

export interface AdHistoryLog {
    id: string;
    ad_id: string;
    company: string;
    title: string;
    tier: string;
    event_type: string;
    message: string;
    created_at: string;
}

export async function logAdEvent(adId: string, company: string, title: string, tier: string, eventType: string, message: string) {
    try {
        await supabaseAdmin.from('ad_history_logs').insert([{
            ad_id: adId,
            company,
            title,
            tier,
            event_type: eventType,
            message
        }]);
    } catch (e) {
        console.error('Failed to log ad event:', e);
    }
}

export async function getAdHistoryLogs(tier: string): Promise<AdHistoryLog[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('ad_history_logs')
            .select('*')
            .eq('tier', tier)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error('Failed to fetch ad history logs:', e);
        return [];
    }
}
