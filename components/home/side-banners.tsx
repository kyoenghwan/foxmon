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
        async function fetchSideAds() {
            setLoading(true);
            try {
                // 사이드 배너용으로 SIDE 티어 광고를 활용 (좌4, 우4)
                const [left, right] = await Promise.all([
                    getRotatedAds('SIDE', 4),
                    getRotatedAds('SIDE', 4)
                ]);
                setLeftAds(left);
                setRightAds(right);
            } catch (error) {
                console.error("Failed to fetch side ads:", error);
            }
            setLoading(false);
        }
        fetchSideAds();
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
