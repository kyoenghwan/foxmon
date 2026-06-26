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

    // 1. 중복 제거된 원본 광고 리스트 추출 (서버 중복 데이터가 섞여올 시 원천 정제)
    const uniqueAds = sideAds.filter(ad => !ad.id.includes('_repeat_'));
    
    // 2. 고정과 일반 광고 분리
    const fixedAds = uniqueAds.filter(ad => ad.is_fixed);
    const rollingAds = uniqueAds.filter(ad => !ad.is_fixed);
    
    // 3. 8개의 화면 슬롯 배치 구성
    const filledAds: AdItem[] = [];
    
    // 3-1. 고정 광고 배치 (최대 4개)
    const activeFixedCount = Math.min(fixedAds.length, 4);
    for (let i = 0; i < activeFixedCount; i++) {
        filledAds.push(fixedAds[i]);
    }
    
    // 3-2. 남은 슬롯을 일반 광고의 순환 반복으로 채움 (비어보이지 않게 보장)
    const remainingSlots = 8 - activeFixedCount;
    if (rollingAds.length > 0) {
        for (let i = 0; i < remainingSlots; i++) {
            filledAds.push(rollingAds[i % rollingAds.length]);
        }
    }

    const leftAds = filledAds.slice(0, 4);
    const rightAds = filledAds.slice(4, 8);

    useEffect(() => {
        async function initSideAds() {
            if (!isSideAdsLoaded) {
                setLoading(true);
                await fetchSideAds();
                setLoading(false);
            }
        }
        initSideAds();

        // 1분(60초)마다 로컬 메모리 상에서 배너 순서 순환
        const intervalId = setInterval(() => {
            rotateSideAds();
        }, 60000);

        return () => clearInterval(intervalId);
    }, [isSideAdsLoaded, fetchSideAds, rotateSideAds]);

    const handleAdClick = (adId: string) => {
        recordAdExposure(adId);
    };

    if (loading) return null; // 사이드 배너 로딩 시에는 공간만 비워둠 (혹은 심플한 스켈레톤)

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
        <div className="fixed top-[396px] left-0 w-full z-20 pointer-events-none flex justify-center">
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
