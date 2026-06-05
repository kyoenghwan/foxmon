import { create } from 'zustand';
import { getRotatedAds, AdItem } from '@/lib/ad-service';

interface AdState {
    sideAds: AdItem[];
    isSideAdsLoaded: boolean;
    premiumMainAds: AdItem[];
    isPremiumMainAdsLoaded: boolean;
    
    // 추가: 공고 그리드 데이터 캐시
    premiumJobs: AdItem[];
    specialJobs: AdItem[];
    lineJobs: AdItem[];
    generalJobs: AdItem[];
    isJobsLoaded: boolean;
    
    fetchSideAds: (force?: boolean) => Promise<void>;
    fetchPremiumMainAds: (force?: boolean) => Promise<void>;
    fetchJobs: (force?: boolean, searchTerms?: string) => Promise<void>;
}

export const useAdStore = create<AdState>((set, get) => ({
    sideAds: [],
    isSideAdsLoaded: false,
    premiumMainAds: [],
    isPremiumMainAdsLoaded: false,
    
    premiumJobs: [],
    specialJobs: [],
    lineJobs: [],
    generalJobs: [],
    isJobsLoaded: false,

    fetchSideAds: async (force = false) => {
        if (get().isSideAdsLoaded && !force) return;
        try {
            const ads = await getRotatedAds('SIDE', 8);
            set({ sideAds: ads, isSideAdsLoaded: true });
        } catch (error) {
            console.error("Store failed to fetch side ads:", error);
        }
    },

    fetchPremiumMainAds: async (force = false) => {
        if (get().isPremiumMainAdsLoaded && !force) return;
        try {
            const ads = await getRotatedAds('PREMIUM_MAIN', 5);
            set({ premiumMainAds: ads, isPremiumMainAdsLoaded: true });
        } catch (error) {
            console.error("Store failed to fetch premium main ads:", error);
        }
    },

    fetchJobs: async (force = false, searchTerms = '') => {
        // 검색 조건이 없고 이미 로드되어 있다면 캐시 우선 반환
        if (searchTerms === '' && get().isJobsLoaded && !force) return;
        try {
            const [p, s, l, g] = await Promise.all([
                getRotatedAds('PREMIUM', 50, searchTerms),
                getRotatedAds('SPECIAL', 50, searchTerms),
                getRotatedAds('AD_GENERAL', 50, searchTerms),
                getRotatedAds('GENERAL', 50, searchTerms)
            ]);
            
            // 검색 조건이 없는 기본 목록만 글로벌 캐시로 영구 저장
            if (searchTerms === '') {
                set({ 
                    premiumJobs: p, 
                    specialJobs: s, 
                    lineJobs: l, 
                    generalJobs: g, 
                    isJobsLoaded: true 
                });
            }
        } catch (error) {
            console.error("Store failed to fetch jobs:", error);
        }
    }
}));
