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

    // 1. Firestore에서 공정한 알고리즘이 적용된 광고 가져오기
    useEffect(() => {
        async function fetchAds() {
            setLoading(true);
            const rotatedAds = await getRotatedAds('PREMIUM', 5);
            setAds(rotatedAds);
            setLoading(false);
        }
        fetchAds();
    }, []);

    const originalLength = ads.length;
    const extendedBanners = [...ads, ...ads, ...ads];

    useEffect(() => {
        if (originalLength === 0) return;

        const timer = setInterval(() => {
            handleNext();
        }, 4000); // 노출 시간을 조금 더 길게 조정 (4초)

        return () => clearInterval(timer);
    }, [currentIndex, originalLength]);

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
        <div className="relative w-full !h-full overflow-hidden rounded-xl">
            <div
                className={`flex gap-4 h-full ${isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''}`}
                style={{
                    transform: `translateX(calc(-${currentIndex * 50}% - ${currentIndex * 8}px))`,
                }}
            >
                {extendedBanners.map((banner, idx) => (
                    <div
                        key={`${banner.id}-${idx}`}
                        className={`flex-shrink-0 h-full rounded-2xl ${banner.color || 'bg-gradient-to-br from-gray-700 to-gray-900'} p-6 shadow-md relative overflow-hidden group cursor-pointer`}
                        style={{ width: 'calc((100% - 16px) / 2)' }}
                        onClick={() => handleAdClick(banner.id)}
                    >
                        {/* 가독성을 위한 어두운 그라데이션 오버레이 (강화) */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

                        {/* 호버 시 밝기 조절 */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-15" />

                        <div className="relative z-20 h-full flex flex-col justify-between">
                            <div className="space-y-3">
                                <h3 className="text-white font-black text-2xl mb-1 line-clamp-1 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform origin-left duration-300">
                                    {banner.company}
                                </h3>
                                <p className="text-white/95 text-base font-bold line-clamp-2 max-w-[90%] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-snug">
                                    {banner.title}
                                </p>
                            </div>

                            <div className="flex flex-col gap-1">
                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{banner.location}</p>
                                <Link href={`/jobs/${banner.id}`} onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="secondary"
                                        size="default"
                                        className="font-bold bg-white text-gray-900 border-none hover:bg-gray-100 px-6 py-2 h-10 shadow-lg"
                                        onClick={() => handleAdClick(banner.id)}
                                    >
                                        상세보기
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* 장식용 요소 */}
                        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="absolute right-5 top-4 text-white/10 font-black text-4xl italic select-none">
                            {((idx % originalLength) + 1).toString().padStart(2, '0')}
                        </div>
                    </div>
                ))}
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

