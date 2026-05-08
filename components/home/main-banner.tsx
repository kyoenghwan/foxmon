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
    const [isTransitioning, setIsTransitioning] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [itemsPerView, setItemsPerView] = useState(1);

    // 반응형 배너 갯수 조절 (2560px 이상 4개, 1920px 이상 3개, 1280px 이상 2개, 그 미만 1개)
    useEffect(() => {
        const updateView = () => {
            if (window.innerWidth >= 2560) {
                setItemsPerView(4);
            } else if (window.innerWidth >= 1920) {
                setItemsPerView(3);
            } else if (window.innerWidth >= 1280) {
                setItemsPerView(2);
            } else {
                setItemsPerView(1);
            }
        };
        updateView();
        window.addEventListener('resize', updateView);
        return () => window.removeEventListener('resize', updateView);
    }, []);

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
            className="relative w-full !h-full overflow-hidden rounded-xl"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`flex gap-4 h-full ${isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''}`}
                style={{
                    transform: `translateX(calc(-${currentIndex * (100 / itemsPerView)}% - ${currentIndex * (16 / itemsPerView)}px))`,
                }}
            >
                {extendedBanners.map((banner, idx) => {
                    const hasImage = !!(banner.image || (banner as any).logo_url);
                    const bgUrl = hasImage ? (banner.image || (banner as any).logo_url) : null;
                    
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
                    if (payAmount.includes(']') && payAmount.startsWith('[')) {
                        const splitIndex = payAmount.indexOf(']');
                        payType = payAmount.substring(1, splitIndex).trim();
                        payAmount = payAmount.substring(splitIndex + 1).trim();
                    } else if (payAmount === '추후협의') {
                        payType = '협의';
                        payAmount = '추후협의';
                    } else {
                        const parts = payAmount.split(' ');
                        if (parts.length > 1 && ['시급', '일급', '주급', '월급', '건당', '협의', '기타'].includes(parts[0])) {
                            payType = parts[0];
                            payAmount = parts.slice(1).join(' ');
                        }
                    }

                    const isUploadMode = banner.theme === 'UPLOAD';

                    return (
                        <div
                            key={`${banner.id}-${idx}`}
                            className={`flex-shrink-0 h-full rounded-2xl ${isUploadMode ? 'bg-black' : bgClass} ${isUploadMode ? '' : 'p-6'} shadow-md relative overflow-hidden group cursor-pointer`}
                            style={{ 
                                width: itemsPerView > 1 ? `calc((100% - ${(itemsPerView - 1) * 16}px) / ${itemsPerView})` : '100%'
                            }}
                            onClick={() => handleAdClick(banner.id)}
                        >
                            {isUploadMode && hasImage ? (
                                /* 업로드 모드: 이미지만 100% 꽉 채워서 노출 (텍스트 숨김) */
                                <div className="w-full h-full relative">
                                    <div 
                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                        style={{ backgroundImage: `url(${bgUrl})` }}
                                    />
                                    {/* 호버 시 밝기 조절 */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-15" />
                                </div>
                            ) : (
                                /* 기존 템플릿 모드 */
                                <>
                                    {/* 가독성을 위한 어두운 그라데이션 오버레이 (강화) */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />

                                    {/* 호버 시 밝기 조절 */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-15" />

                                    <div className="relative z-20 h-full flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 mb-1">
                                                {hasImage && (
                                                    <div className="w-12 h-8 sm:w-[60px] sm:h-[40px] bg-white rounded-md p-1 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
                                                        <div 
                                                            className="w-full h-full bg-contain bg-center bg-no-repeat" 
                                                            style={{ backgroundImage: `url(${bgUrl})` }} 
                                                        />
                                                    </div>
                                                )}
                                                <h3 className="text-white font-black text-xl sm:text-2xl line-clamp-1 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform origin-left duration-300">
                                                    {banner.company}
                                                </h3>
                                            </div>
                                            <p className="text-white/95 text-base font-bold line-clamp-2 max-w-[90%] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-snug">
                                                {banner.title}
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-1.5 mt-auto">
                                            <p className="text-white/70 text-[11px] font-bold tracking-wider">{banner.location}</p>
                                            <div className="flex items-center gap-2">
                                                {payType && (
                                                    <span className="px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-white text-[11px] font-black tracking-wide border border-white/10 shadow-sm">
                                                        {payType}
                                                    </span>
                                                )}
                                                <span className="text-white font-black text-lg sm:text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                                                    {payAmount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 장식용 요소 */}
                                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                    <div className="absolute right-5 top-4 text-white/10 font-black text-4xl italic select-none z-10">
                                        {((idx % originalLength) + 1).toString().padStart(2, '0')}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 좌우 네비게이션 버튼 (필요 시) */}
            <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                <div className="bg-black/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold">
                    {((currentIndex % originalLength) + 1)} / {originalLength}
                </div>
            </div>
        </div>
    );
}

