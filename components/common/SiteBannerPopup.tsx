'use client';

import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface BannerPopupProps {
    banners: any[];
}

export function SiteBannerPopup({ banners }: BannerPopupProps) {
    const [visibleBanners, setVisibleBanners] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!banners || banners.length === 0) return;

        // Check localStorage to see if any banner was hidden for today
        const filtered = banners.filter(banner => {
            const hideUntil = localStorage.getItem(`hide_banner_${banner.id}`);
            if (!hideUntil) return true;
            
            // If the hide expiration time has passed, show it again
            return new Date().getTime() > parseInt(hideUntil, 10);
        });

        setVisibleBanners(filtered);
    }, [banners]);

    if (visibleBanners.length === 0) return null;

    // 현재 선택된 배너
    const banner = visibleBanners[currentIndex] || visibleBanners[0];

    const handleClose = () => {
        setVisibleBanners(prev => {
            const next = prev.filter(b => b.id !== banner.id);
            if (currentIndex >= next.length) {
                setCurrentIndex(Math.max(0, next.length - 1));
            }
            return next;
        });
    };

    const handleHideToday = () => {
        const expireTime = new Date().getTime() + 24 * 60 * 60 * 1000;
        localStorage.setItem(`hide_banner_${banner.id}`, expireTime.toString());
        handleClose();
    };

    const handleCloseAll = () => {
        setVisibleBanners([]);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                {/* 이미지 및 링크 영역 (캐러셀) */}
                <div className="relative w-full bg-gray-100 flex items-center justify-center group">
                    {visibleBanners.length > 1 && (
                        <>
                            <button 
                                onClick={(e) => { e.preventDefault(); setCurrentIndex(prev => prev === 0 ? visibleBanners.length - 1 : prev - 1); }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white rounded-full z-10 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={(e) => { e.preventDefault(); setCurrentIndex(prev => prev === visibleBanners.length - 1 ? 0 : prev + 1); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white rounded-full z-10 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            
                            {/* 페이지 인디케이터 */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                                {visibleBanners.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {banner.link_url ? (
                        <Link href={banner.link_url} onClick={handleClose} className="block w-full">
                            <img 
                                src={banner.image_url} 
                                alt={banner.title} 
                                className="w-full h-auto max-h-[75vh] object-contain"
                            />
                        </Link>
                    ) : (
                        <img 
                            src={banner.image_url} 
                            alt={banner.title} 
                            className="w-full h-auto max-h-[75vh] object-contain"
                        />
                    )}
                </div>

                {/* 하단 컨트롤 영역 */}
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            onChange={handleHideToday}
                            className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 cursor-pointer"
                        />
                        <span className="text-[13px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors">
                            오늘 하루 보지 않기
                        </span>
                    </label>
                    <div className="flex items-center gap-4">
                        {visibleBanners.length > 1 && (
                            <button 
                                onClick={handleCloseAll}
                                className="text-[13px] font-black text-gray-400 hover:text-gray-700 transition-colors"
                            >
                                모두 닫기
                            </button>
                        )}
                        <button 
                            onClick={handleClose}
                            className="text-[13px] font-black text-gray-800 hover:text-primary transition-colors"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
