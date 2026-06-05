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

    const { sideAds, isSideAdsLoaded, fetchSideAds } = useAdStore();
    const [loading, setLoading] = useState(!isSideAdsLoaded);
    const containerRef = useRef<HTMLDivElement>(null);

    const leftAds = sideAds.slice(0, 4);
    const rightAds = sideAds.slice(4, 8);

    useEffect(() => {
        async function initSideAds() {
            if (!isSideAdsLoaded) {
                setLoading(true);
                await fetchSideAds();
                setLoading(false);
            }
        }
        initSideAds();

        // 1분(60초)마다 배너 순서 순환을 위해 비동기 백그라운드 강제 재호출
        const intervalId = setInterval(() => {
            fetchSideAds(true);
        }, 60000);

        return () => clearInterval(intervalId);
    }, [isSideAdsLoaded, fetchSideAds]);

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
        <div className="fixed top-[220px] left-0 w-full z-20 pointer-events-none flex justify-center">
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
