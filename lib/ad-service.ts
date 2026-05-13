'use server';

import { supabase, supabaseAdmin } from './supabase';
import { applyRollingLogic } from './ad-rolling-logic';

export interface AdItem {
    id: string;
    company: string;
    title: string;
    location: string;
    pay: string;
    image?: string;
    logo_url?: string;
    color?: string;
    theme?: string;
    time?: string;
    is_big: boolean; // Supabase 스네이크 케이스 대응
    tier: 'PREMIUM_MAIN' | 'SIDE' | 'PREMIUM' | 'SPECIAL' | 'LINE' | 'GENERAL' | 'AD_GENERAL';
    weight: number;
    exposure_count: number; // Supabase 스네이크 케이스 대응
    last_exposed_at: string; // Supabase ISO String
    created_at?: string; // 등록일시 (신규 광고 판별용)
    // 유료 옵션 필드
    option_bold?: boolean;
    option_color_value?: string;
    option_bg_value?: string;
    option_highlight_value?: string;
    option_general_icons?: string[];
    option_double_slot?: boolean;
    option_jump?: boolean;
    isRealAd?: boolean; // 실제 DB 연동 광고 여부
}

const IS_SUPABASE_ENABLED = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Mock Data for development without DB
 */
const COMPANIES = [
    '일많아용', '24시주야간', '왕갈비', '일산1등가계', '에겐실장',
    '레옹', '부천상동룸', '신림미니', '엔젤', '마징가가라오케',
    '제니', '인스타', '송파가라오케', '착한실장', '에이드',
    '여신', '구구단보장제', '하이킥', '팡팡', '온라인',
    '서진실장', '꿀벌', '성실한노력파', '성순이', '퀸',
    '블링', '에이스', '정실장', '정대표', '젠틀맨',
    '뭉크', '수원TOP실장', '워라밸', '화곡타임즈', '화곡24시'
];

const CATCHPHRASES = [
    '♥갯수보장♥ 24시 상시모집',
    '★15년 TOP 강서구 일등 업소',
    '충무로 왕갈비 순수 정통 룸싸롱',
    '1인샵♥로드샵 최고페이 보장',
    '♥♥♥한번오면 오래 머무는 집',
    '부천최고수입♥출퇴근차량지원',
    '♥초보가능♥걱정없이 돈벌어가실 분',
    '♡룸♡작업♡일반♡송파24시',
    '───▶ 수원최초 기모노 노상',
    '♥의정부♥최고TC♥편한 분위기',
    '일산 1등 하이퍼!! 수익 1등',
    '■─10개이상♥11만♥ 당일지급',
    '●가락주간1등●일요일영업함',
    '♥세상에서제일착한오빠♥ 시급6.5',
    '만콜 보장 욕심 있는 분 환영',
    '24시간 쉬는날 없이 풀가동 중'
];

const CATEGORIES = ['(노래주점)', '(룸싸롱)', '(단란주점)', '(마사지)', '(텐프로)', '(하이퍼)'];
const PAY_LIST = ['[TC] 120,000원', '[TC] 150,000원', '[시급] 65,000원', '[TC] 110,000원', '[협의]면접후결정', '[TC] 180,000원'];

let MOCK_ADS: AdItem[] = Array.from({ length: 150 }).map((_, i) => {
    let tier: 'PREMIUM_MAIN' | 'SIDE' | 'PREMIUM' | 'SPECIAL' | 'GENERAL' | 'AD_GENERAL' = 'AD_GENERAL';
    if (i < 10) tier = 'PREMIUM_MAIN';
    else if (i < 20) tier = 'SIDE';
    else if (i < 50) tier = 'PREMIUM';
    else if (i < 100) tier = 'SPECIAL';
    const company = COMPANIES[i % COMPANIES.length];
    const category = CATEGORIES[i % CATEGORIES.length];
    // 테스트 시 10%는 '방금(10분 이내) 등록된 광고'로 시뮬레이션
    const isNew = Math.random() < 0.1;
    const ageMs = isNew ? Math.random() * 600000 : 600000 + (Math.random() * 86400000);

    return {
        id: `mock-${i}`,
        company: `${company} ${category}`,
        title: CATCHPHRASES[i % CATCHPHRASES.length],
        location: '서울/경기 전지역',
        pay: PAY_LIST[i % PAY_LIST.length],
        tier: tier,
        is_big: i % 10 === 0,
        weight: 1,
        exposure_count: Math.floor(Math.random() * 20),
        last_exposed_at: new Date(Date.now() - (Math.random() * 10800000)).toISOString(),
        created_at: new Date(Date.now() - ageMs).toISOString(),
        color: ['orange', 'blue', 'purple', 'emerald'][i % 4],
        image: `https://picsum.photos/seed/fox-${i}/400/300`,
    };
});



/**
 * Fair Ad Rotation Service (Supabase)
 */
export async function getRotatedAds(tier: 'PREMIUM_MAIN' | 'SIDE' | 'PREMIUM' | 'SPECIAL' | 'LINE' | 'GENERAL' | 'AD_GENERAL', limitCount: number = 20): Promise<AdItem[]> {
    if (!IS_SUPABASE_ENABLED) {
        const filtered = MOCK_ADS.filter(ad => ad.tier === tier);
        return applyRollingLogic(filtered, limitCount);
    }

    try {
        // tier가 GENERAL이면 순수 구인 공고이므로 jobs, 아니면 배너 광고이므로 biz_ads를 조회합니다.
        // 데모 목적으로, 아직 결제하지 않은(PENDING) 광고도 모두 표시하기 위해 supabaseAdmin(RLS 무시)을 사용합니다.
        const targetTable = tier === 'GENERAL' ? 'jobs' : 'biz_ads';

        const { data, error } = await supabaseAdmin
            .from(targetTable)
            .select('*')
            .eq('tier', tier);

        if (error || !data || data.length === 0) {
            return getMockAds(tier, limitCount);
        }

        let ads: AdItem[] = data.map((item: any) => ({
            ...item,
            company: item.company || item.company_name || '업체명 없음',
            pay: item.pay || (item.salary_type ? `[${item.salary_type}] ${item.salary_amount}` : item.salary_amount) || '급여협의',
            image: item.image || item.logo_url || '',
            isRealAd: true
        })) as AdItem[];
        
        // 실제 광고가 모자랄 경우 가상의 광고로 나머지 영역을 채워줍니다 (항상 limitCount만큼 유지)
        if (ads.length < limitCount) {
            const mockAdsForTier = MOCK_ADS.filter(ad => ad.tier === tier);
            ads = [...ads, ...mockAdsForTier.slice(0, limitCount - ads.length)];
        }

        return applyRollingLogic(ads, limitCount);
    } catch (error) {
        return getMockAds(tier, limitCount);
    }
}

/**
 * Internal Helper for Fallback Mocking
 */
function getMockAds(tier: 'PREMIUM_MAIN' | 'SIDE' | 'PREMIUM' | 'SPECIAL' | 'LINE' | 'GENERAL' | 'AD_GENERAL', count: number): AdItem[] {
    const filtered = MOCK_ADS.filter(ad => ad.tier === tier);
    return applyRollingLogic(filtered, count);
}

/**
 * 외부 모듈(서버 액션)에서 Mock 데이터를 직접 가져오기 위한 async 헬퍼
 */
export async function getRawMockAds(tier: string): Promise<AdItem[]> {
    return MOCK_ADS.filter(ad => ad.tier === tier);
}

/**
 * 광고 노출 데이터 갱신 (Supabase)
 */
export async function recordAdExposure(adId: string) {
    if (!IS_SUPABASE_ENABLED) {
        const ad = MOCK_ADS.find(a => a.id === adId);
        if (ad) {
            ad.exposure_count += 1;
            ad.last_exposed_at = new Date().toISOString();
        }
        return;
    }

    try {
        // PostgreSQL의 단일 컬럼 업데이트 로직 (RPC 추천되나 우선 직접 호출 시도)
        const { error } = await supabaseAdmin.rpc('increment_exposure', { ad_id: adId });

        if (error) {
            // RPC가 없는 경우 대비 수동 업데이트 (원자성 보장 안됨)
            // RPC가 없는 경우 수동 업데이트 (ad_id로 테이블 식별이 어려우므로 두 테이블 모두 시도)
            const { data: currentBiz } = await supabaseAdmin.from('biz_ads').select('exposure_count').eq('id', adId).single();
            if (currentBiz) {
                await supabaseAdmin.from('biz_ads').update({
                    exposure_count: (currentBiz.exposure_count || 0) + 1,
                    last_exposed_at: new Date().toISOString()
                }).eq('id', adId);
            } else {
                const { data: currentJob } = await supabaseAdmin.from('jobs').select('exposure_count').eq('id', adId).single();
                if (currentJob) {
                    await supabaseAdmin.from('jobs').update({
                        exposure_count: (currentJob.exposure_count || 0) + 1,
                        last_exposed_at: new Date().toISOString()
                    }).eq('id', adId);
                }
            }
        }
    } catch (error) {
        console.error("Supabase Error (recordAdExposure):", error);
    }
}
