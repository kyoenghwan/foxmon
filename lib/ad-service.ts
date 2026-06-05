'use server';

import { supabase, supabaseAdmin } from './supabase';
import { applyRollingLogic } from './ad-rolling-logic';

export interface AdItem {
    id: string;
    company: string;
    company_name?: string; // DB 호환용
    title: string;
    location: string;
    pay: string;
    image?: string;
    logo_url?: string;
    color?: string;
    theme?: string;
    category?: string;     // Mock/카테고리명 호환용
    category1?: string;    // DB 카테고리1
    category2?: string;    // DB 카테고리2
    keywords?: string[];   // 태그 배열
    action_type?: string;
    effect_intensity?: string;
    bg_opacity?: string;
    time?: string;
    is_big: boolean; // Supabase 스네이크 케이스 대응
    tier: 'PREMIUM_MAIN' | 'SIDE' | 'PREMIUM' | 'SPECIAL' | 'LINE' | 'GENERAL' | 'AD_GENERAL';
    weight: number;
    exposure_count: number; // Supabase 스네이크 케이스 대응
    last_exposed_at: string; // Supabase ISO String
    created_at?: string; // 등록일시 (신규 광고 판별용)
    option_bold?: boolean;
    option_color?: boolean;
    option_color_value?: string;
    option_bg?: boolean;
    option_bg_value?: string;
    option_highlight?: boolean;
    option_highlight_value?: string;
    option_icon?: boolean;
    option_general_icons?: string[];
    option_double_slot?: boolean;
    option_jump?: boolean;
    isRealAd?: boolean; // 실제 DB 연동 광고 여부
    is_fixed?: boolean; // 고정 배너 여부
    merchant_tier?: 'NORMAL' | 'VIP' | 'VVIP' | 'VVVIP';
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

    const merchantTiers: ('NORMAL' | 'VIP' | 'VVIP' | 'VVVIP')[] = ['NORMAL', 'VIP', 'VVIP', 'VVVIP'];
    const merchant_tier = merchantTiers[i % merchantTiers.length];

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
        merchant_tier: merchant_tier,
        is_fixed: i % 15 === 0, // 데모용 고정 광고 모킹
    };
});



// 전역 캐시 인터페이스 및 캐시 맵 정의
interface AdCache {
    ads: AdItem[];
    lastFetched: number;
    isFetching: boolean;
}

const adCache: Record<string, AdCache> = {};
const CACHE_TTL_MS = 60 * 1000; // 60초 캐시 (1분)

/**
 * DB에서 직접 특정 티어의 활성 광고 데이터를 가져오는 내부 헬퍼 함수
 */
async function fetchAdsFromDB(
    tier: 'PREMIUM_MAIN' | 'SIDE' | 'PREMIUM' | 'SPECIAL' | 'LINE' | 'GENERAL' | 'AD_GENERAL'
): Promise<AdItem[]> {
    if (!IS_SUPABASE_ENABLED) {
        return MOCK_ADS.filter(ad => ad.tier === tier);
    }

    try {
        const targetTable = tier === 'GENERAL' ? 'jobs' : 'biz_ads';
        const jobsSelectFields = 'id, author_id, company_id, company_name, title, content, category, location, pay, image_url, tier, is_big, exposure_count, last_exposed_at, created_at, user_id, status, expires_at, view_count, detail_images, work_type, work_hours, benefits, contact_info, address, updated_at, source_origin, salary_type, salary_amount, logo_url, contact_name, contact_phone, kakao_id, line_id, telegram_id, wechat_id, employment_type, category1, category2, work_time, amenities, keywords, design_mode, detail_bg_color, detail_bg_image, exposure_period, option_bold, option_color, option_bg, option_icon, option_jump, total_points, option_color_value, option_bg_value, option_bold_expires_at, option_color_expires_at, option_bg_expires_at, option_icon_expires_at, option_jump_expires_at, option_highlight, option_highlight_value, option_highlight_expires_at, option_general_icons, option_general_icons_expires_at, is_subscription';
        const bizAdsSelectFields = 'id, author_id, company_id, company_name, title, content, category, location, pay, image_url, tier, is_big, exposure_count, last_exposed_at, created_at, user_id, status, expires_at, view_count, detail_images, work_type, work_hours, benefits, contact_info, address, updated_at, source_origin, salary_type, salary_amount, logo_url, contact_name, contact_phone, kakao_id, line_id, telegram_id, wechat_id, employment_type, category1, category2, work_time, amenities, keywords, design_mode, detail_bg_color, detail_bg_image, exposure_period, option_bold, option_color, option_bg, option_icon, option_jump, total_points, option_color_value, option_bg_value, option_bold_expires_at, option_color_expires_at, option_bg_expires_at, option_icon_expires_at, option_jump_expires_at, option_highlight, option_highlight_value, option_highlight_expires_at, option_general_icons, option_general_icons_expires_at, color, bg_opacity, theme, effect_intensity, is_subscription, option_double_slot, option_double_slot_expires_at, claim_code';

        let queryBuilder;
        if (targetTable === 'jobs') {
            queryBuilder = supabaseAdmin
                .from('jobs')
                .select(`${jobsSelectFields}, users(merchant_tier)`)
                .eq('tier', tier);
        } else {
            queryBuilder = supabaseAdmin
                .from('biz_ads')
                .select(bizAdsSelectFields)
                .eq('tier', tier);
        }

        const { data, error } = await queryBuilder;

        if (error || !data || data.length === 0) {
            if (error) {
                console.error(`[fetchAdsFromDB] Supabase error for tier ${tier}:`, error);
            }
            return [];
        }

        let rawAds = data;
        let userMap: Record<string, string> = {};

        if (targetTable === 'biz_ads') {
            const userIds = Array.from(new Set(data.map((item: any) => item.user_id).filter(Boolean)));
            if (userIds.length > 0) {
                const { data: usersData, error: usersError } = await supabaseAdmin
                    .from('users')
                    .select('id, merchant_tier')
                    .in('id', userIds);
                if (usersError) {
                    console.error("[fetchAdsFromDB] Error fetching users for merchant_tier:", usersError);
                }
                if (usersData) {
                    usersData.forEach((u: any) => {
                        userMap[u.id] = u.merchant_tier || 'NORMAL';
                    });
                }
            }
        }

        const now = new Date();
        const activeRealAds = rawAds.filter((item: any) => {
            const isValidStatus = item.status === 'ACTIVE' || item.status === 'CLAIM_PENDING';
            if (!isValidStatus) return false;

            if (!item.expires_at) return true;
            const expireDate = new Date(item.expires_at);
            if (expireDate.getFullYear() === 2000) return false;
            return expireDate > now;
        });

        const ads: AdItem[] = activeRealAds.map((item: any) => {
            let merchant_tier = 'NORMAL';
            if (targetTable === 'biz_ads') {
                merchant_tier = userMap[item.user_id] || 'NORMAL';
            } else {
                if (item.users) {
                    if (Array.isArray(item.users)) {
                        merchant_tier = item.users[0]?.merchant_tier || 'NORMAL';
                    } else {
                        merchant_tier = item.users.merchant_tier || 'NORMAL';
                    }
                }
            }
            return {
                ...item,
                company: item.company_name || item.company || '업체명 없음',
                pay: item.pay || (item.salary_type ? `[${item.salary_type}] ${item.salary_amount}` : item.salary_amount) || '급여협의',
                image: item.image_url || item.image || item.logo_url || '',
                merchant_tier: merchant_tier as 'NORMAL' | 'VIP' | 'VVIP' | 'VVVIP',
                isRealAd: true,
                is_fixed: item.is_fixed || false
            };
        });

        return ads;
    } catch (err) {
        console.error(`[fetchAdsFromDB] Exception in fetch for tier ${tier}:`, err);
        return [];
    }
}

/**
 * 캐시 유효성을 검사하고 백그라운드 패치를 진행하는 내부 헬퍼 함수
 */
async function fetchAndCacheAds(
    tier: 'PREMIUM_MAIN' | 'SIDE' | 'PREMIUM' | 'SPECIAL' | 'LINE' | 'GENERAL' | 'AD_GENERAL'
): Promise<AdItem[]> {
    if (!adCache[tier]) {
        adCache[tier] = { ads: [], lastFetched: 0, isFetching: false };
    }

    if (adCache[tier].isFetching) {
        return adCache[tier].ads;
    }

    adCache[tier].isFetching = true;
    try {
        const ads = await fetchAdsFromDB(tier);
        adCache[tier].ads = ads;
        adCache[tier].lastFetched = Date.now();
        return ads;
    } catch (err) {
        console.error(`[fetchAndCacheAds] Exception for tier ${tier}:`, err);
        return adCache[tier].ads;
    } finally {
        adCache[tier].isFetching = false;
    }
}

/**
 * Fair Ad Rotation Service (Supabase + Memory Cache)
 */
export async function getRotatedAds(
    tier: 'PREMIUM_MAIN' | 'SIDE' | 'PREMIUM' | 'SPECIAL' | 'LINE' | 'GENERAL' | 'AD_GENERAL', 
    limitCount: number = 20,
    searchQuery?: string
): Promise<AdItem[]> {
    const filterBySearch = (items: AdItem[], query?: string) => {
        if (!query) return items;
        const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
        return items.filter(item => {
            return terms.every(term => {
                const inTitle = item.title?.toLowerCase().includes(term);
                const inCompany = (item.company || item.company_name)?.toLowerCase().includes(term);
                const inLocation = item.location?.toLowerCase().includes(term);
                const inCategory = (item.category || item.category1 || item.category2)?.toLowerCase().includes(term);
                const inKeywords = Array.isArray(item.keywords) && item.keywords.some(kw => String(kw).toLowerCase().includes(term));
                return inTitle || inCompany || inLocation || inCategory || inKeywords;
            });
        });
    };

    const now = Date.now();
    const cache = adCache[tier];

    // 캐시가 없거나 만료된 경우 업데이트 트리거
    if (!cache || now - cache.lastFetched > CACHE_TTL_MS) {
        if (!cache) {
            // 최초 패치는 동기적으로 수행하여 빈 화면이 노출되지 않도록 함
            await fetchAndCacheAds(tier);
        } else {
            // 캐시가 만료된 경우 백그라운드 비동기 갱신 수행 (대기 시간 0ms)
            fetchAndCacheAds(tier);
        }
    }

    let cachedAds = [...(adCache[tier]?.ads || [])];

    // 로컬 환경 등에서 DB 연결이 비활성화되거나 데이터가 아예 없는 경우 폴백
    if (cachedAds.length === 0 && !IS_SUPABASE_ENABLED) {
        const mockAdsForTier = MOCK_ADS.filter(ad => ad.tier === tier);
        cachedAds = mockAdsForTier;
    }

    // 메모리 내 검색 필터링
    let ads = filterBySearch(cachedAds, searchQuery);

    // 롤링 알고리즘 적용
    let rolledAds = applyRollingLogic(ads, ads.length);

    if (rolledAds.length > 0 && rolledAds.length < limitCount) {
        if (tier === 'SIDE') {
            // SIDE 배너의 경우, 실제 등록된 배너들만 순환 반복하여 limitCount를 꽉 채움
            const originalAds = [...rolledAds];
            while (rolledAds.length < limitCount) {
                rolledAds = [...rolledAds, ...originalAds.map(ad => ({
                    ...ad,
                    id: `${ad.id}_repeat_${rolledAds.length}`
                }))];
            }
            rolledAds = rolledAds.slice(0, limitCount);
        } else {
            // 타 등급은 기존대로 mock 광고를 추가하여 채워 넣음
            const mockAdsForTier = MOCK_ADS.filter(ad => ad.tier === tier);
            const filteredMock = filterBySearch(mockAdsForTier, searchQuery);
            rolledAds = [...rolledAds, ...filteredMock.slice(0, limitCount - rolledAds.length)];
            // 보충된 전체에 대해 다시 롤링 알고리즘 적용
            rolledAds = applyRollingLogic(rolledAds, limitCount);
        }
    } else if (rolledAds.length === 0) {
        if (tier === 'SIDE') {
            return [];
        } else {
            const mockAdsForTier = MOCK_ADS.filter(ad => ad.tier === tier);
            const filteredMock = filterBySearch(mockAdsForTier, searchQuery);
            rolledAds = applyRollingLogic(filteredMock, limitCount);
        }
    }

    return rolledAds.slice(0, limitCount);
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
