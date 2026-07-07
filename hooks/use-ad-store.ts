import { create } from 'zustand';
import { getRotatedAds, getRotatedAdsWithLogs, AdItem } from '@/lib/ad-service';

interface AdState {
    sideAds: AdItem[];
    isSideAdsLoaded: boolean;
    isFetchingSideAds: boolean;
    premiumMainAds: AdItem[];
    isPremiumMainAdsLoaded: boolean;
    isFetchingPremiumMainAds: boolean;
    
    // 추가: 공고 그리드 데이터 캐시
    premiumJobs: AdItem[];
    specialJobs: AdItem[];
    lineJobs: AdItem[];
    generalJobs: AdItem[];
    isJobsLoaded: boolean;
    isFetchingJobs: boolean;
    
    fetchSideAds: () => Promise<void>;
    fetchPremiumMainAds: () => Promise<void>;
    fetchJobs: (searchTerms?: string, forceRefresh?: boolean) => Promise<void>;
    setInitialData: (data: {
        sideAds: AdItem[];
        premiumMainAds: AdItem[];
        premiumJobs: AdItem[];
        specialJobs: AdItem[];
        lineJobs: AdItem[];
        generalJobs: AdItem[];
    }) => void;
    
    // 클라이언트 사이드 로테이션 액션
    rotateSideAds: () => void;
    rotateJobs: () => void;
}

export const useAdStore = create<AdState>((set, get) => ({
    sideAds: [],
    isSideAdsLoaded: false,
    isFetchingSideAds: false,
    premiumMainAds: [],
    isPremiumMainAdsLoaded: false,
    isFetchingPremiumMainAds: false,
    
    premiumJobs: [],
    specialJobs: [],
    lineJobs: [],
    generalJobs: [],
    isJobsLoaded: false,
    isFetchingJobs: false,

    fetchSideAds: async () => {
        /*
        console.log("[Zustand Store] fetchSideAds triggering...", {
            isSideAdsLoaded: get().isSideAdsLoaded,
            isFetchingSideAds: get().isFetchingSideAds
        });
        */
        if (get().isSideAdsLoaded || get().isFetchingSideAds) {
            // console.log("[Zustand Store] fetchSideAds fetch skipped due to already loaded/fetching state.");
            return;
        }
        set({ isFetchingSideAds: true });
        const start = performance.now();
        // console.log("[Zustand Store] Fetching side ads from server action/service...");
        try {
            // 실배포 성능 최적화를 위해 forceRefresh=false 로 갱신
            const res = await getRotatedAdsWithLogs('SIDE', 8, undefined, false);
            
            // F12 개발자 도구 콘솔에 DB 쿼리 전송 단계별 로그 출력 주석 처리
            /*
            console.group("🖥️ [Supabase DB Query Debug Logs] SIDE Banners Fetching Process");
            if (res.queryLogs && res.queryLogs.length > 0) {
                res.queryLogs.forEach(log => console.log(log));
            } else {
                console.log("No server-side query logs returned.");
            }
            console.groupEnd();
            */

            // console.log("[Zustand Store] Successfully fetched side ads from server:", res.ads);
            set({ sideAds: res.ads, isSideAdsLoaded: true });
            // console.log(`[Zustand Store] fetchSideAds completed in ${(performance.now() - start).toFixed(2)}ms. Store updated.`);
        } catch (error) {
            console.error("[Zustand Store] Store failed to fetch side ads:", error);
        } finally {
            set({ isFetchingSideAds: false });
        }
    },

    fetchPremiumMainAds: async () => {
        if (get().isPremiumMainAdsLoaded || get().isFetchingPremiumMainAds) return;
        set({ isFetchingPremiumMainAds: true });
        const start = performance.now();
        // console.log(`[Store Performance] fetchPremiumMainAds started...`);
        try {
            const ads = await getRotatedAds('PREMIUM_MAIN', 5);
            set({ premiumMainAds: ads, isPremiumMainAdsLoaded: true });
            // console.log(`[Store Performance] fetchPremiumMainAds completed in ${(performance.now() - start).toFixed(2)}ms`);
        } catch (error) {
            console.error("Store failed to fetch premium main ads:", error);
        } finally {
            set({ isFetchingPremiumMainAds: false });
        }
    },

    fetchJobs: async (searchTerms = '', forceRefresh = false) => {
        if (searchTerms === '' && !forceRefresh && (get().isJobsLoaded || get().isFetchingJobs)) return;
        set({ isFetchingJobs: true });
        const start = performance.now();
        // console.log(`[Store Performance] fetchJobs (general/premium/special) started...`);
        try {
            const [p, s, l, g] = await Promise.all([
                getRotatedAds('PREMIUM', 50, searchTerms),
                getRotatedAds('SPECIAL', 50, searchTerms),
                getRotatedAds('AD_GENERAL', 50, searchTerms),
                getRotatedAds('GENERAL', 50, searchTerms)
            ]);
            
            if (searchTerms === '') {
                set({ 
                    premiumJobs: p, 
                    specialJobs: s, 
                    lineJobs: l, 
                    generalJobs: g, 
                    isJobsLoaded: true 
                });
            }
            // console.log(`[Store Performance] fetchJobs completed in ${(performance.now() - start).toFixed(2)}ms`);
        } catch (error) {
            console.error("Store failed to fetch jobs:", error);
        } finally {
            set({ isFetchingJobs: false });
        }
    },

    setInitialData: (data) => {
        set({
            sideAds: data.sideAds,
            isSideAdsLoaded: true,
            premiumMainAds: data.premiumMainAds,
            isPremiumMainAdsLoaded: true,
            premiumJobs: data.premiumJobs,
            specialJobs: data.specialJobs,
            lineJobs: data.lineJobs,
            generalJobs: data.generalJobs,
            isJobsLoaded: true
        });
    },

    // 클라이언트 메모리 내에서 배너 순서 순환 회전 (고정과 일반 광고를 격리하여 회전)
    rotateSideAds: () => {
        const ads = get().sideAds;
        if (ads.length <= 1) return;
        
        // 1. 중복 제거된 원본 광고 리스트 추출
        const uniqueAds = ads.filter(ad => !ad.id.includes('_repeat_'));
        
        // 2. 고정과 일반 광고 분리
        const fixedAds = uniqueAds.filter(ad => ad.is_fixed);
        const rollingAds = uniqueAds.filter(ad => !ad.is_fixed);
        
        // 3. 각각 개별적으로 로테이션 회전
        const rotatedFixed = fixedAds.length > 1 ? [...fixedAds.slice(1), fixedAds[0]] : fixedAds;
        const rotatedRolling = rollingAds.length > 1 ? [...rollingAds.slice(1), rollingAds[0]] : rollingAds;
        
        // 4. 다시 합쳐서 스토어 상태에 저장
        set({ sideAds: [...rotatedFixed, ...rotatedRolling] });
    },

    rotateJobs: () => {
        const p = get().premiumJobs;
        const s = get().specialJobs;
        const l = get().lineJobs;
        const g = get().generalJobs;

        set({
            premiumJobs: p.length > 1 ? [...p.slice(1), p[0]] : p,
            specialJobs: s.length > 1 ? [...s.slice(1), s[0]] : s,
            lineJobs: l.length > 1 ? [...l.slice(1), l[0]] : l,
            generalJobs: g.length > 1 ? [...g.slice(1), g[0]] : g,
        });
    }
}));
