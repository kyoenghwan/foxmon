'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { getRotatedAds, recordAdExposure, AdItem } from '@/lib/ad-service';
import { useSession } from 'next-auth/react';
import { PremiumJobCard } from './premium-job-card';

export function SideBanners() {
    const { data: session } = useSession();
    const isEmployer = (session?.user as any)?.role === 'EMPLOYER';
    const isBusinessVerified = (session?.user as any)?.business_number ? true : false;
    const showAdRegister = isEmployer && isBusinessVerified;

    const [leftAds, setLeftAds] = useState<AdItem[]>([]);
    const [rightAds, setRightAds] = useState<AdItem[]>([]);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchSideAds(showSpinner = true) {
            if (showSpinner) setLoading(true);
            try {
                // SIDE 티어 광고 8개를 단일 쿼리로 순서대로 조회
                const allSideAds = await getRotatedAds('SIDE', 8);
                if (allSideAds && allSideAds.length > 0) {
                    // 1234번은 좌측, 5678번은 우측 배치
                    setLeftAds(allSideAds.slice(0, 4));
                    setRightAds(allSideAds.slice(4, 8));
                } else {
                    setLeftAds([]);
                    setRightAds([]);
                }
            } catch (error) {
                console.error("Failed to fetch side ads:", error);
            }
            if (showSpinner) setLoading(false);
        }

        fetchSideAds(true);

        // 1분(60초)마다 배너 순서 순환을 위해 비동기 백그라운드 재호출
        const intervalId = setInterval(() => {
            fetchSideAds(false);
        }, 60000);

        return () => clearInterval(intervalId);
    }, []);

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
            <div ref={containerRef} className="w-full max-w-[1060px] 2xl:max-w-[1200px] relative h-0">
                {/* Left Wing */}
                <div 
                    className="hidden xl:flex flex-col gap-3 absolute top-0 right-full mr-2 pointer-events-auto transition-all duration-300 w-[110px] 2xl:w-[130px]"
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
                    className="hidden xl:flex flex-col gap-3 absolute top-0 left-full ml-2 pointer-events-auto transition-all duration-300 w-[110px] 2xl:w-[130px]"
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
