'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getRotatedAds, recordAdExposure, AdItem } from '@/lib/ad-service';

// 메인 배너 컴포넌트
export function MainBanner() {
    const [ads, setAds] = useState<AdItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardWidth, setCardWidth] = useState(400);
    const [cardHeight, setCardHeight] = useState(200);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [itemsPerView, setItemsPerView] = useState(1);

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
                    const subWidth = (parentWidth - 16) / 2;
                    // 메인배너 1개 너비 = 중앙배너 1.5개 너비
                    const mWidth = subWidth * 1.5;
                    const mHeight = mWidth / 2; // 2:1 비율
                    setCardWidth(mWidth);
                    setCardHeight(mHeight);
                } else {
                    // Fallback
                    const parentWidth = Math.min(width - 32, 425 - 32);
                    const subWidth = (parentWidth - 16) / 2;
                    const mWidth = subWidth * 1.5;
                    setCardWidth(mWidth);
                    setCardHeight(mWidth / 2);
                }
            } else if (width >= 800 && width < 1024) {
                setItemsPerView(1);
                if (container) {
                    setCardWidth(container.clientWidth);
                } else {
                    setCardWidth(406);
                }
                setCardHeight(203);
            } else {
                setItemsPerView(2);
                if (container) {
                    const parentWidth = container.clientWidth;
                    setCardWidth((parentWidth - 16) / 2);
                } else {
                    setCardWidth(406); // (195px * 2) + 16px = 406px
                }
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
        async function fetchAds() {
            setLoading(true);
            // VVIP (메인 롤링) 티어만 조회
            const rotatedAds = await getRotatedAds('PREMIUM_MAIN', 5);
            setAds(rotatedAds);
            setLoading(false);
        }
        fetchAds();
    }, []);

    const originalLength = ads.length;
    const extendedBanners = [...ads, ...ads, ...ads];

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
            }, 700);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, originalLength]);

    // 광고 클릭 시 노출 데이터 갱신
    const handleAdClick = (adId: string) => {
        recordAdExposure(adId);
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
                <Link href="/jobs/post">
                    <Button variant="outline" size="sm" className="font-bold">광고 등록하기</Button>
                </Link>
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
                className={`flex gap-4 items-center h-full ${isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''}`}
                style={{
                    transform: `translateX(-${currentIndex * (cardWidth + 16)}px)`,
                }}
            >
                {extendedBanners.map((banner, idx) => {
                    const hasLogo = !!(banner as any).logo_url;
                    const logoUrl = (banner as any).logo_url;
                    
                    // 이미지가 없을 때 사용할 프리미엄 AI 느낌의 fallback 그라데이션 배열
                    const fallbackGradients = [
                        'bg-gradient-to-br from-indigo-900 via-purple-900 to-black',
                        'bg-gradient-to-br from-slate-900 via-sky-900 to-black',
                        'bg-gradient-to-br from-rose-900 via-fuchsia-900 to-black',
                        'bg-gradient-to-br from-emerald-900 via-teal-900 to-black',
                    ];
                    const bgClass = fallbackGradients[idx % fallbackGradients.length];

                    // 급여 파싱 로직
                    let payType = '';
                    let payAmount = banner.pay || '';
                    if (payAmount?.includes(']') && payAmount?.startsWith('[')) {
                        const splitIndex = payAmount.indexOf(']');
                        payType = payAmount.substring(1, splitIndex).trim();
                        payAmount = payAmount.substring(splitIndex + 1).trim();
                    } else if (payAmount === '추후협의') {
                        payType = '협의';
                        payAmount = '추후협의';
                    } else {
                        const parts = payAmount.split(' ');
                        if (parts.length > 1 && ['시급', '일급', '주급', '월급', '건당', '협의', '기타'].includes(parts[0] || '')) {
                            payType = parts[0];
                            payAmount = parts.slice(1).join(' ');
                        }
                    }

                    const isUploadMode = banner.theme === 'UPLOAD';

                    return (
                        <div
                            key={`${banner.id}`}
                            className={`flex-shrink-0 rounded-2xl ${isUploadMode ? 'bg-black' : bgClass} ${isUploadMode ? '' : 'p-4 sm:p-6'} shadow-md relative overflow-hidden group cursor-pointer`}
                            style={{ 
                                width: `${cardWidth}px`,
                                height: `${cardHeight}px`
                            }}
                            onClick={() => handleAdClick(banner.id)}
                        >
                            {isUploadMode && banner.image ? (
                                /* 업로드 모드: 이미지만 100% 꽉 채워서 노출 (텍스트 숨김) */
                                <div className="w-full h-full relative">
                                    <div 
                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                        style={{ backgroundImage: `url(${banner.image})` }}
                                    />
                                    {/* 호버 시 밝기 조절 */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-15" />
                                </div>
                            ) : (
                                /* 기존 템플릿 모드 */
                                <>
                                    {/* 템플릿 모드 배경 이미지 */}
                                    {banner.image && (
                                        <div 
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 mix-blend-overlay opacity-60"
                                            style={{ backgroundImage: `url(${banner.image})` }}
                                        />
                                    )}
                                    {/* 가독성을 위한 어두운 그라데이션 오버레이 (강화) */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />

                                    {/* 호버 시 밝기 조절 */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-15" />
                                    <div className="relative z-20 h-full flex flex-col justify-between">
                                        <div className="space-y-1.5 sm:space-y-3">
                                            <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1">
                                                {hasLogo && (
                                                    <div className="w-10 h-7 sm:w-[60px] sm:h-[40px] bg-white rounded-md p-1 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
                                                        <div 
                                                            className="w-full h-full bg-contain bg-center bg-no-repeat" 
                                                            style={{ backgroundImage: `url(${logoUrl})` }} 
                                                        />
                                                    </div>
                                                )}
                                                <h3 className="text-white font-black text-lg sm:text-xl line-clamp-1 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform origin-left duration-300">
                                                    {banner.company}
                                                </h3>
                                            </div>
                                            <p className="text-white/95 text-xs sm:text-sm font-bold line-clamp-2 max-w-[90%] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-snug">
                                                {banner.title}
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-1 sm:gap-1.5 mt-auto">
                                            <p className="text-white/70 text-[10px] sm:text-[11px] font-bold tracking-wider">{banner.location}</p>
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                {payType && (
                                                    <span className="px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-md text-white text-[9px] sm:text-[11px] font-black tracking-wide border border-white/10 shadow-sm">
                                                        {payType}
                                                    </span>
                                                )}
                                                <span className="text-white font-black text-base sm:text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                                                    {payAmount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 장식용 요소 */}
                                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 좌우 네비게이션 버튼 (필요 시) */}
            <div className="absolute bottom-4 left-4 flex gap-2 z-20">
                <div className="bg-black/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold">
                    {((currentIndex % originalLength) + 1)} / {originalLength}
                </div>
            </div>
        </div>
    );
}

