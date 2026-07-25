'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getRotatedAds, recordAdExposure, AdItem } from '@/lib/ad-service';
import { useSession } from 'next-auth/react';

import { useAdStore } from '@/hooks/use-ad-store';
import { useJobModal } from '@/hooks/use-job-modal';
import { PremiumMainBannerCard } from './PremiumMainBannerCard';

// 메인 배너 컴포넌트
export function MainBanner() {
    const { data: session } = useSession();
    const { premiumMainAds, isPremiumMainAdsLoaded, fetchPremiumMainAds } = useAdStore();
    const { openModal } = useJobModal();
    const [loading, setLoading] = useState(!isPremiumMainAdsLoaded);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardWidth, setCardWidth] = useState(400);
    const [cardHeight, setCardHeight] = useState(200);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [itemsPerView, setItemsPerView] = useState(1);
    
    const ads = premiumMainAds;

    const GAP = 16; // 카드 사이 간격 (px)

    // 반응형 배너 갯수 및 카드 너비 조절 (컨테이너 크기에 맞춰 동적 계산)
    useEffect(() => {
        const container = document.getElementById('main-banner-container');
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 800) {
                setItemsPerView(1.5);
                if (container) {
                    const parentWidth = container.clientWidth;
                    // 중앙배너 1개 너비 = (부모너비 - 16px) / 2
                    const subWidth = (parentWidth - GAP) / 2;
                    // 메인배너 1개 너비 = 중앙배너 1.5개 너비
                    const mWidth = subWidth * 1.5;
                    const mHeight = mWidth / 2; // 2:1 비율
                    setCardWidth(mWidth);
                    setCardHeight(mHeight);
                } else {
                    // Fallback
                    const parentWidth = Math.min(width - 32, 425 - 32);
                    const subWidth = (parentWidth - GAP) / 2;
                    const mWidth = subWidth * 1.5;
                    setCardWidth(mWidth);
                    setCardHeight(mWidth / 2);
                }
            } else if (width >= 800 && width < 1024) {
                setItemsPerView(1);
                setCardWidth(406);
                setCardHeight(203);
            } else {
                setItemsPerView(2);
                setCardWidth(406); // PC 환경에서는 배너 카드 크기를 406px로 고정
                setCardHeight(203);
            }
        };

        handleResize();
        
        let resizeObserver: ResizeObserver | null = null;
        if (container && typeof window !== 'undefined' && 'ResizeObserver' in window) {
            resizeObserver = new ResizeObserver(() => {
                handleResize();
            });
            resizeObserver.observe(container);
        }

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (resizeObserver && container) {
                resizeObserver.unobserve(container);
            }
        };
    }, [ads]);


    // 1. Firestore에서 공정한 알고리즘이 적용된 광고 가져오기
    useEffect(() => {
        async function initAds() {
            if (!isPremiumMainAdsLoaded) {
                setLoading(true);
                await fetchPremiumMainAds();
                setLoading(false);
            }
        }
        initAds();
    }, [isPremiumMainAdsLoaded, fetchPremiumMainAds]);

    const originalLength = ads.length;
    let extendedBanners = [...ads];
    while (extendedBanners.length > 0 && extendedBanners.length < 6) {
        extendedBanners = [...extendedBanners, ...ads];
    }

    useEffect(() => {
        if (originalLength === 0 || isHovered) return;

        const timer = setInterval(() => {
            handleNext();
        }, 4000); // 노출 시간을 조금 더 길게 조정 (4초)

        return () => clearInterval(timer);
    }, [currentIndex, originalLength, isHovered]);

    const handleNext = () => {
        if (originalLength === 0) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev + 1);
    };

    // 무한 루프 구현
    useEffect(() => {
        if (originalLength === 0) return;
        if (currentIndex >= originalLength) {
            const timer = setTimeout(() => {
                setIsTransitioning(false);
                setCurrentIndex(0);
            }, 750);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, originalLength]);

    // 광고 클릭 시 노출 데이터 갱신 및 상세 모달 팝업 열기
    const handleAdClick = (banner: AdItem) => {
        recordAdExposure(banner.id);
        const jobDataForModal = {
            ...banner,
            content: (banner as any).detail_content || (banner as any).content || '',
            employer_name: banner.company || banner.company_name || '폭스몬',
            image_url: banner.image || banner.logo_url || ''
        };
        openModal(jobDataForModal);
    };

    if (loading) {
        return (
            <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center animate-pulse">
                <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
            </div>
        );
    }

    if (ads.length === 0) {
        return (
            <div className="w-full h-full bg-white border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                <p className="text-gray-400 font-bold mb-2">등록된 프리미엄 광고가 없습니다.</p>
                {session?.user?.role !== 'VIEWER' && (
                    <Link href="/biz/ads">
                        <Button variant="outline" size="sm" className="font-bold">광고 등록하기</Button>
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div 
            id="main-banner-container"
            className="relative w-full overflow-hidden rounded-xl"
            style={{ height: `${cardHeight}px` }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`flex items-center h-full ${isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''}`}
                style={{
                    gap: `${GAP}px`,
                    transform: `translateX(-${currentIndex * (cardWidth + GAP)}px)`,
                }}
            >
                {extendedBanners.map((banner, idx) => (
                    <div
                        key={`banner_${idx}_${banner.id}`}
                        className="flex-shrink-0"
                        style={{ 
                            width: `${cardWidth}px`,
                            height: `${cardHeight}px`
                        }}
                    >
                        <PremiumMainBannerCard
                            company={banner.company || (banner as any).company_name}
                            title={banner.title}
                            location={banner.location}
                            category={(banner as any).category1 || banner.category}
                            pay={banner.pay}
                            salary_type={(banner as any).salary_type}
                            salary_amount={(banner as any).salary_amount}
                            pay_type={(banner as any).pay_type}
                            pay_amount={(banner as any).pay_amount}
                            logo_url={(banner as any).logo_url || (banner as any).logo}
                            image={banner.image}
                            theme={banner.theme}
                            premium_banner_mode={(banner as any).premium_banner_mode}
                            onClick={() => handleAdClick(banner)}
                        />
                    </div>
                ))}
            </div>

            {/* 좌우 네비게이션 버튼 (필요 시) */}
        </div>
    );
}

