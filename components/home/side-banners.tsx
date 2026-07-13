'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { getRotatedAds, recordAdExposure, AdItem } from '@/lib/ad-service';
import { useSession } from 'next-auth/react';
import { PremiumJobCard } from './premium-job-card';

import { useAdStore } from '@/hooks/use-ad-store';

export function SideBanners() {
    const { data: session } = useSession();
    const isEmployer = (session?.user as any)?.role === 'EMPLOYER';
    const isBusinessVerified = (session?.user as any)?.business_number ? true : false;
    const showAdRegister = isEmployer && isBusinessVerified;

    const { sideAds, isSideAdsLoaded, fetchSideAds, rotateSideAds } = useAdStore();
    const [loading, setLoading] = useState(!isSideAdsLoaded);
    const containerRef = useRef<HTMLDivElement>(null);

    // 디버그 로깅 주석 처리
    /*
    console.log("[SideBanners] Store state loaded:", {
        sideAdsLength: sideAds?.length,
        isSideAdsLoaded,
        loading
    });
    */

    // 1. 중복 제거된 원본 광고 리스트 추출 (서버 중복 데이터가 섞여올 시 원천 정제)
    const uniqueAds = sideAds.filter(ad => !ad.id.includes('_repeat_'));
    // console.log("[SideBanners] Unique ads after filtering repeated ones:", uniqueAds);
    
    // 2. 고정과 일반 광고 분리
    const fixedAds = uniqueAds.filter(ad => ad.is_fixed);
    const rollingAds = uniqueAds.filter(ad => !ad.is_fixed);
    // console.log("[SideBanners] Separated ads:", { fixedAds, rollingAds });
    
    // 3. 6개의 화면 슬롯 배치 구성
    const filledAds: AdItem[] = [];
    
    // 3-1. 고정 광고 배치 (최대 3개)
    const activeFixedCount = Math.min(fixedAds.length, 3);
    for (let i = 0; i < activeFixedCount; i++) {
        filledAds.push(fixedAds[i]);
    }
    
    // 3-2. 남은 슬롯을 일반 광고의 순환 반복으로 채움 (비어보이지 않게 보장)
    const remainingSlots = 6 - activeFixedCount;
    if (rollingAds.length > 0) {
        for (let i = 0; i < remainingSlots; i++) {
            filledAds.push(rollingAds[i % rollingAds.length]);
        }
    }
    // console.log("[SideBanners] Filled ads for 6 slots:", filledAds);

    const leftAds = filledAds.slice(0, 3);
    const rightAds = filledAds.slice(3, 6);
    // console.log("[SideBanners] Split wings:", { leftAds, rightAds });

    useEffect(() => {
        async function initSideAds() {
            // console.log("[SideBanners] useEffect triggered. isSideAdsLoaded:", isSideAdsLoaded);
            if (!isSideAdsLoaded) {
                // console.log("[SideBanners] Fetching side ads from store...");
                setLoading(true);
                await fetchSideAds();
                // console.log("[SideBanners] Fetching complete. Setting loading to false.");
                setLoading(false);
            }
        }
        initSideAds();

        // 1분(60초)마다 로컬 메모리 상에서 배너 순서 순환
        const intervalId = setInterval(() => {
            // console.log("[SideBanners] Rotating ads...");
            rotateSideAds();
        }, 60000);

        return () => clearInterval(intervalId);
    }, [isSideAdsLoaded, fetchSideAds, rotateSideAds]);

    const handleAdClick = (adId: string) => {
        recordAdExposure(adId);
    };

    if (loading) {
        // console.log("[SideBanners] Component rendering: Null (loading...)");
        return null;
    }
    // console.log("[SideBanners] Component rendering: Visible");

    const BannerCard = ({ ad }: { ad: AdItem }) => {
        return (
            <div
                key={ad.id}
                className="block pointer-events-auto w-full transition-transform hover:scale-[1.02]"
            >
                <PremiumJobCard
                    id={ad.id}
                    company={ad.company}
                    title={ad.title}
                    location={ad.location}
                    category={ad.category || ad.category1}
                    pay={ad.pay}
                    image={ad.logo_url || ad.image || ''}
                    isSide={true}
                    impactType={(ad.theme as any) || 'none'}
                    effectIntensity={ad.effect_intensity}
                    customColor={ad.color}
                    bgOpacity={ad.bg_opacity}
                    merchant_tier={ad.merchant_tier}
                    rawAd={ad}
                    onClick={() => handleAdClick(ad.id)}
                />
            </div>
        );
    };

    return (
        <div className="fixed top-[220px] left-0 w-full z-[45] pointer-events-none flex justify-center">
            <div ref={containerRef} className="container relative h-0">
                {/* Left Wing */}
                <div 
                    className="hidden xl:flex flex-col gap-3 absolute top-0 right-full mr-4 pointer-events-auto transition-all duration-300 w-[130px]"
                >
                    {leftAds.map((ad) => (
                        <BannerCard key={ad.id} ad={ad} />
                    ))}
                    {showAdRegister && (
                        <Link
                            href="/biz/ads/new"
                            className="w-full py-2.5 bg-primary hover:bg-orange-600 text-white text-[11px] font-black rounded-xl text-center transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1"
                        >
                            + 광고등록
                        </Link>
                    )}
                </div>

                {/* Right Wing */}
                <div 
                    className="hidden xl:flex flex-col gap-3 absolute top-0 left-full ml-4 pointer-events-auto transition-all duration-300 w-[130px]"
                >
                    {rightAds.map((ad) => (
                        <BannerCard key={ad.id} ad={ad} />
                    ))}
                    {showAdRegister && (
                        <Link
                            href="/biz/ads/new"
                            className="w-full py-2.5 bg-primary hover:bg-orange-600 text-white text-[11px] font-black rounded-xl text-center transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1"
                        >
                            + 광고등록
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
