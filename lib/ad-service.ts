import { supabase } from './supabase';

export interface AdItem {
    id: string;
    company: string;
    title: string;
    location: string;
    pay: string;
    image?: string;
    color?: string;
    time?: string;
    is_big: boolean; // Supabase 스네이크 케이스 대응
    tier: 'PREMIUM' | 'SPECIAL' | 'GENERAL';
    weight: number;
    exposure_count: number; // Supabase 스네이크 케이스 대응
    last_exposed_at: string; // Supabase ISO String
    created_at?: string; // 등록일시 (신규 광고 판별용)
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
    const tier: 'PREMIUM' | 'SPECIAL' | 'GENERAL' = i < 50 ? 'PREMIUM' : i < 100 ? 'SPECIAL' : 'GENERAL';
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
 * 핵심 공정 롤링 + 신규 등반 주입 로직
 */
function applyRollingLogic(ads: AdItem[], count: number): AdItem[] {
    const nowMs = Date.now();
    const tenMinsMs = 10 * 60 * 1000;

    // 1. 등록일(created_at) 최신순으로 전체 정렬 (base order)
    ads.sort((a, b) => {
        const timeA = new Date(a.created_at || a.last_exposed_at || 0).getTime();
        const timeB = new Date(b.created_at || b.last_exposed_at || 0).getTime();
        return timeB - timeA;
    });

    const newAds: AdItem[] = [];
    const oldAds: AdItem[] = [];

    // 2. 그룹 분리 (신규 광고 vs 기존 롤링 광고)
    for (const ad of ads) {
        const adTime = new Date(ad.created_at || ad.last_exposed_at || 0).getTime();
        if (nowMs - adTime <= tenMinsMs) {
            newAds.push(ad);
        } else {
            oldAds.push(ad);
        }
    }

    // 3. 기존 광고 그룹 1분 단위 순환 롤링 (Cyclic Rolling)
    let rolledOldAds = oldAds;
    if (oldAds.length > 0) {
        const currentMinute = Math.floor(nowMs / 60000);
        // % 연산으로 offset 구하기 (오래된 순번일수록 위로 올라가는 롤링 효과)
        const offset = currentMinute % oldAds.length;
        rolledOldAds = [...oldAds.slice(offset), ...oldAds.slice(0, offset)];
    }

    // 4. 신규 광고 10위 진입 후 1분마다 등반 (강제 주입 로직)
    const resultAds = [...rolledOldAds];

    // 신규 광고들은 이미 최신순(newAds)이므로 뒤에서부터(가장 먼저 등록한 것부터)
    // 현재 시간에 맞춰 순위치기 시킵니다.
    for (let i = newAds.length - 1; i >= 0; i--) {
        const ad = newAds[i];
        const adTime = new Date(ad.created_at || ad.last_exposed_at || 0).getTime();
        const ageMins = Math.floor((nowMs - adTime) / 60000);
        
        // ageMins: 0분 -> 9번 인덱스 (10위 진입)
        // ageMins: 9분 -> 0번 인덱스 (1위 등반 성공)
        const targetIndex = Math.max(0, 9 - ageMins);
        
        if (targetIndex >= resultAds.length) {
            resultAds.push(ad);
        } else {
            resultAds.splice(targetIndex, 0, ad);
        }
    }

    // 최종 산출된 리스트에서 count 만큼 노출
    return resultAds.slice(0, count);
}

/**
 * Fair Ad Rotation Service (Supabase)
 */
export async function getRotatedAds(tier: 'PREMIUM' | 'SPECIAL' | 'GENERAL', count: number = 10): Promise<AdItem[]> {
    if (!IS_SUPABASE_ENABLED) {
        const filtered = MOCK_ADS.filter(ad => ad.tier === tier);
        return applyRollingLogic(filtered, count);
    }

    try {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('tier', tier);

        if (error || !data || data.length === 0) {
            return getMockAds(tier, count);
        }

        let ads: AdItem[] = data as AdItem[];
        return applyRollingLogic(ads, count);
    } catch (error) {
        return getMockAds(tier, count);
    }
}

/**
 * Internal Helper for Fallback Mocking
 */
function getMockAds(tier: 'PREMIUM' | 'SPECIAL' | 'GENERAL', count: number): AdItem[] {
    const filtered = MOCK_ADS.filter(ad => ad.tier === tier);
    return applyRollingLogic(filtered, count);
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
        const { error } = await supabase.rpc('increment_exposure', { ad_id: adId });

        if (error) {
            // RPC가 없는 경우 대비 수동 업데이트 (원자성 보장 안됨)
            const { data: current } = await supabase.from('jobs').select('exposure_count').eq('id', adId).single();
            await supabase
                .from('jobs')
                .update({
                    exposure_count: (current?.exposure_count || 0) + 1,
                    last_exposed_at: new Date().toISOString()
                })
                .eq('id', adId);
        }
    } catch (error) {
        console.error("Supabase Error (recordAdExposure):", error);
    }
}
