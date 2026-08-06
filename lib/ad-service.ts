'use server';

import { supabase, supabaseAdmin } from './supabase';
import { applyRollingLogic } from './ad-rolling-logic';
import { unstable_cache } from 'next/cache';
import { safeIconsArray } from './utils';

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
    status?: string;
    close_date?: string;
    salary_type?: string;
    salary_amount?: string;
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
const CACHE_TTL_MS = 5 * 60 * 1000; // 5분 캐시 (300초)

/**
 * 광고 데이터 변경(결제/등록/삭제 등) 시 서버 메모리 캐시를 즉시 무효화하는 함수.
 * revalidatePath만으로는 이 커스텀 메모리 캐시를 비울 수 없으므로 반드시 호출해야 합니다.
 */
export async function invalidateAdCache(tier?: string) {
    if (tier) {
        delete adCache[tier];
    } else {
        // tier 미지정 시 모든 캐시 삭제
        Object.keys(adCache).forEach(key => delete adCache[key]);
    }
}

/**
 * DB에서 직접 특정 티어의 활성 광고 데이터를 가져오는 내부 헬퍼 함수
 */
/**
 * DB에서 직접 특정 티어의 활성 광고 데이터를 가져오는 내부 헬퍼 함수 (디버그 로그 리턴 포함)
 */
async function fetchAdsFromDBInternal(
    tier: 'PREMIUM_MAIN' | 'SIDE' | 'PREMIUM' | 'SPECIAL' | 'LINE' | 'GENERAL' | 'AD_GENERAL'
): Promise<{ ads: AdItem[]; queryLogs: string[] }> {
    const dbLabel = `  🖥️  [Performance] DB Query for tier: ${tier}`;
    const queryLogs: string[] = [];
    console.time(dbLabel);
    
    queryLogs.push(`[DB Query Start] Requested tier: ${tier}`);
    queryLogs.push(`[DB Client Info] SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'Missing'}`);
    
    const isServiceRoleConfigured = !!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    queryLogs.push(`[DB Auth Status] Service role key configured (bypasses RLS): ${isServiceRoleConfigured}`);

    if (!IS_SUPABASE_ENABLED) {
        console.timeEnd(dbLabel);
        queryLogs.push(`[DB Status] Supabase is disabled. Falling back to MOCK_ADS.`);
        const fallback = MOCK_ADS.filter(ad => ad.tier === tier);
        queryLogs.push(`[DB Status] Mock fallback ads count: ${fallback.length}`);
        return { ads: fallback, queryLogs };
    }

    try {
        const targetTable = tier === 'GENERAL' ? 'jobs' : 'biz_ads';
        const jobsSelectFields = 'id, author_id, company_id, company_name, title, content, category, location, pay, image_url, tier, is_big, exposure_count, last_exposed_at, created_at, user_id, status, expires_at, view_count, detail_images, work_type, work_hours, benefits, contact_info, address, updated_at, source_origin, salary_type, salary_amount, logo_url, contact_name, contact_phone, kakao_id, line_id, telegram_id, wechat_id, employment_type, category1, category2, work_time, amenities, keywords, design_mode, detail_bg_color, detail_bg_image, exposure_period, option_bold, option_color, option_bg, option_icon, option_jump, total_points, option_color_value, option_bg_value, option_bold_expires_at, option_color_expires_at, option_bg_expires_at, option_icon_expires_at, option_jump_expires_at, option_highlight, option_highlight_value, option_highlight_expires_at, option_general_icons, option_general_icons_expires_at, is_subscription, close_date';
        const bizAdsSelectFields = 'id, author_id, company_id, company_name, title, content, category, location, pay, image_url, tier, is_big, exposure_count, last_exposed_at, created_at, user_id, status, expires_at, view_count, detail_images, work_type, work_hours, benefits, contact_info, address, updated_at, source_origin, salary_type, salary_amount, logo_url, contact_name, contact_phone, kakao_id, line_id, telegram_id, wechat_id, employment_type, category1, category2, work_time, amenities, keywords, design_mode, detail_bg_color, detail_bg_image, exposure_period, option_bold, option_color, option_bg, option_icon, option_jump, total_points, option_color_value, option_bg_value, option_bold_expires_at, option_color_expires_at, option_bg_expires_at, option_icon_expires_at, option_jump_expires_at, option_highlight, option_highlight_value, option_highlight_expires_at, option_general_icons, option_general_icons_expires_at, color, bg_opacity, theme, effect_intensity, is_subscription, option_double_slot, option_double_slot_expires_at, claim_code, close_date';

        const nowStr = new Date().toISOString();
        queryLogs.push(`[DB Target] Table: ${targetTable}, Server Current Time (ISO): ${nowStr}`);

        let queryBuilder;
        if (targetTable === 'jobs') {
            queryBuilder = supabaseAdmin
                .from('jobs')
                .select(`${jobsSelectFields}, users(merchant_tier)`)
                .eq('tier', tier)
                .in('status', ['ACTIVE', 'CLAIM_PENDING'])
                .or(`expires_at.is.null,expires_at.gt.${nowStr}`);
        } else {
            queryBuilder = supabaseAdmin
                .from('biz_ads')
                .select(bizAdsSelectFields)
                .eq('tier', tier)
                .in('status', ['ACTIVE', 'CLAIM_PENDING'])
                .or(`expires_at.is.null,expires_at.gt.${nowStr}`);
        }

        queryLogs.push(`[DB Query Executing] Sending query request to Supabase...`);
        const { data, error } = await queryBuilder;

        if (error) {
            queryLogs.push(`[DB Supabase Error] Code: ${error.code}, Message: ${error.message}, Details: ${error.details}`);
            console.error(`[fetchAdsFromDB] Supabase error for tier ${tier}:`, error);
            return { ads: [], queryLogs };
        }

        if (!data || data.length === 0) {
            queryLogs.push(`[DB Query Result] Empty. 0 records returned from Supabase.`);
            if (tier === 'SIDE') {
                queryLogs.push(`[DB Fallback] Returning MOCK_ADS for SIDE tier to prevent blank side banners.`);
                const fallback = MOCK_ADS.filter(ad => ad.tier === 'SIDE');
                return { ads: fallback, queryLogs };
            }
            return { ads: [], queryLogs };
        }

        queryLogs.push(`[DB Query Result] Received ${data.length} raw ads from Supabase.`);
        
        let rawAds = data;
        let userMap: Record<string, string> = {};

        if (targetTable === 'biz_ads') {
            const userIds = Array.from(new Set(data.map((item: any) => item.user_id).filter(Boolean)));
            if (userIds.length > 0) {
                queryLogs.push(`[DB Relation Check] Fetching merchant_tier profiles for ${userIds.length} user(s)...`);
                const { data: usersData, error: usersError } = await supabaseAdmin
                    .from('users')
                    .select('id, merchant_tier')
                    .in('id', userIds);
                if (usersError) {
                    queryLogs.push(`[DB Relation Error] Failed to fetch user profiles: ${usersError.message}`);
                    console.error("[fetchAdsFromDB] Error fetching users for merchant_tier:", usersError);
                }
                if (usersData) {
                    usersData.forEach((u: any) => {
                        userMap[u.id] = u.merchant_tier || 'NORMAL';
                    });
                    queryLogs.push(`[DB Relation Check] Successfully mapped merchant tiers.`);
                }
            }
        }

        const now = new Date();
        const activeRealAds = rawAds.filter((item: any) => {
            const isValidStatus = item.status === 'ACTIVE' || item.status === 'CLAIM_PENDING';
            if (!isValidStatus) {
                queryLogs.push(`[DB Filter Out] Ad ID: ${item.id} excluded. Invalid status: ${item.status}`);
                return false;
            }

            if (!item.expires_at) return true;
            const expireDate = new Date(item.expires_at);
            if (expireDate.getFullYear() === 2000) {
                queryLogs.push(`[DB Filter Out] Ad ID: ${item.id} excluded. expires_at is test template year 2000.`);
                return false;
            }
            const isNotExpired = expireDate > now;
            if (!isNotExpired) {
                queryLogs.push(`[DB Filter Out] Ad ID: ${item.id} excluded. Expired at ${item.expires_at} (Current Server Time is ${now.toISOString()})`);
            }
            return isNotExpired;
        });

        queryLogs.push(`[DB Filter Complete] ${activeRealAds.length} active ads remained after status & expiry check.`);

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
            const nowTime = new Date().getTime();
            const checkOpt = (val: any, exp: string | null | undefined) => {
                if (!val) return false;
                if (!exp) return true;
                const expTime = new Date(exp).getTime();
                if (expTime > nowTime) return true;
                if (item.expires_at && new Date(item.expires_at).getTime() > nowTime) return true;
                return false;
            };

            return {
                ...item,
                company: item.company_name || item.company || '업체명 없음',
                pay: item.pay || (item.salary_type ? `[${item.salary_type}] ${item.salary_amount}` : item.salary_amount) || '급여협의',
                image: item.image_url || item.image || item.logo_url || '',
                merchant_tier: merchant_tier as 'NORMAL' | 'VIP' | 'VVIP' | 'VVVIP',
                isRealAd: true,
                is_fixed: item.is_fixed || false,
                
                // 개별 옵션 실시간 만료 보정
                option_bold: checkOpt(item.option_bold, item.option_bold_expires_at),
                option_color: checkOpt(item.option_color, item.option_color_expires_at),
                option_bg: checkOpt(item.option_bg, item.option_bg_expires_at),
                option_icon: checkOpt(item.option_icon, item.option_icon_expires_at),
                option_jump: checkOpt(item.option_jump, item.option_jump_expires_at),
                option_highlight: checkOpt(item.option_highlight, item.option_highlight_expires_at),
                option_general_icons: checkOpt(item.option_general_icons, item.option_general_icons_expires_at) ? safeIconsArray(item.option_general_icons) : [],
                option_double_slot: checkOpt(item.option_double_slot, item.option_double_slot_expires_at)
            };
        });

        return { ads, queryLogs };
    } catch (err: any) {
        queryLogs.push(`[DB Exception] Caught exception: ${err.message || String(err)}`);
        console.error(`[fetchAdsFromDB] Exception in fetch for tier ${tier}:`, err);
        return { ads: [], queryLogs };
    } finally {
        console.timeEnd(dbLabel);
    }
}

// unstable_cache 래핑 영구 공유 캐싱 (5분 캐시)
const fetchAdsFromDBCached = unstable_cache(
    async (tier: 'PREMIUM_MAIN' | 'SIDE' | 'PREMIUM' | 'SPECIAL' | 'LINE' | 'GENERAL' | 'AD_GENERAL') => {
        return fetchAdsFromDBInternal(tier);
    },
    ['ads-db-query'],
    { revalidate: 300, tags: ['ads'] }
);

async function fetchAdsFromDB(
    tier: 'PREMIUM_MAIN' | 'SIDE' | 'PREMIUM' | 'SPECIAL' | 'LINE' | 'GENERAL' | 'AD_GENERAL'
): Promise<{ ads: AdItem[]; queryLogs: string[] }> {
    return fetchAdsFromDBInternal(tier);
}

/**
 * Fair Ad Rotation Service (Supabase + Memory Cache)
 */
export async function getRotatedAds(
    tier: 'PREMIUM_MAIN' | 'SIDE' | 'PREMIUM' | 'SPECIAL' | 'LINE' | 'GENERAL' | 'AD_GENERAL', 
    limitCount: number = 20,
    searchQuery?: string
): Promise<AdItem[]> {
    const res = await getRotatedAdsWithLogs(tier, limitCount, searchQuery, false);
    return res.ads;
}

/**
 * 디버깅용 로그 수집이 포함된 확장 로테이션 API
 */
export async function getRotatedAdsWithLogs(
    tier: 'PREMIUM_MAIN' | 'SIDE' | 'PREMIUM' | 'SPECIAL' | 'LINE' | 'GENERAL' | 'AD_GENERAL', 
    limitCount: number = 20,
    searchQuery?: string,
    forceRefresh: boolean = false
): Promise<{ ads: AdItem[]; queryLogs: string[] }> {
    const apiLabel = `⚡ [Performance] getRotatedAds API (Server Action) for tier: ${tier}`;
    console.time(apiLabel);

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
    let queryLogs: string[] = [];

    // 캐시가 없거나 만료되었거나, 강제 고침 요청이 들어오면 DB 패치 수행
    if (forceRefresh || !cache || now - cache.lastFetched > CACHE_TTL_MS) {
        const dbResult = await fetchAdsFromDB(tier);
        queryLogs = [...dbResult.queryLogs];
        adCache[tier] = {
            ads: dbResult.ads,
            lastFetched: now,
            isFetching: false
        };
    } else {
        queryLogs.push(`[Cache Hit] Serving from memory cache. Cache age: ${Math.floor((now - cache.lastFetched) / 1000)}s`);
    }

    let cachedAds = [...(adCache[tier]?.ads || [])];

    // 로컬 환경 등에서 DB 연결이 비활성화되거나 데이터가 아예 없는 경우 폴백
    if (cachedAds.length === 0 && !IS_SUPABASE_ENABLED) {
        queryLogs.push(`[DB Fallback] 0 active ads found and DB is disabled. Injecting MOCK_ADS.`);
        const mockAdsForTier = MOCK_ADS.filter(ad => ad.tier === tier);
        cachedAds = mockAdsForTier;
    }

    // 일반 구인공고(GENERAL) 티어만 검색어 필터링을 수행하고, 배너 광고 등급은 검색어와 무관하게 무조건 전체 노출
    let ads = (tier === 'GENERAL') ? filterBySearch(cachedAds, searchQuery) : cachedAds;

    // 롤링 알고리즘 적용 (더블 슬롯 옵션이 2칸을 차지할 수 있도록 limitCount 전달)
    let rolledAds = applyRollingLogic(ads, limitCount);

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
        } else if (!IS_SUPABASE_ENABLED) {
            // 로컬 모킹 개발 환경에서만 mock 광고를 추가하여 채워 넣음
            const mockAdsForTier = MOCK_ADS.filter(ad => ad.tier === tier);
            const filteredMock = (tier === 'GENERAL') ? filterBySearch(mockAdsForTier, searchQuery) : mockAdsForTier;
            // 이미 롤링된 광고의 ID 목록을 추출하여 중복 유입 방지 (_dup 및 _repeat_ 제거한 원본 ID 기준)
            const rolledIds = new Set(rolledAds.map(ad => ad.id.replace('_dup', '').split('_repeat_')[0]));
            const cleanMock = filteredMock.filter(ad => !rolledIds.has(ad.id));
            rolledAds = [...rolledAds, ...cleanMock.slice(0, limitCount - rolledAds.length)];
            // 보충된 전체에 대해 다시 롤링 알고리즘 적용
            rolledAds = applyRollingLogic(rolledAds, limitCount);
        }
    } else if (rolledAds.length === 0) {
        if (tier === 'SIDE') {
            queryLogs.push(`[DB SIDE Final] 0 ads returned for SIDE tier wing banners.`);
            console.timeEnd(apiLabel);
            return { ads: [], queryLogs };
        } else if (!IS_SUPABASE_ENABLED) {
            const mockAdsForTier = MOCK_ADS.filter(ad => ad.tier === tier);
            const filteredMock = (tier === 'GENERAL') ? filterBySearch(mockAdsForTier, searchQuery) : mockAdsForTier;
            rolledAds = applyRollingLogic(filteredMock, limitCount);
        } else {
            rolledAds = [];
        }
    }

    console.timeEnd(apiLabel);
    const finalAds = rolledAds.slice(0, limitCount);
    queryLogs.push(`[DB Rotation Finish] Outputting ${finalAds.length} rotated ads to client.`);
    return { ads: finalAds, queryLogs };
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
