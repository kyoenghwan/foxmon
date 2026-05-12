'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';

interface BannerPopupProps {
    banners: any[];
}

export function SiteBannerPopup({ banners }: BannerPopupProps) {
    const [visibleBanners, setVisibleBanners] = useState<any[]>([]);

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

    // Show only the first active banner as a popup to avoid spamming the user
    const banner = visibleBanners[0];

    const handleClose = () => {
        setVisibleBanners(prev => prev.filter(b => b.id !== banner.id));
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
                {/* 이미지 및 링크 영역 */}
                {banner.link_url ? (
                    <Link href={banner.link_url} onClick={handleClose} className="block w-full bg-gray-100">
                        <img 
                            src={banner.image_url} 
                            alt={banner.title} 
                            className="w-full h-auto object-contain"
                        />
                    </Link>
                ) : (
                    <div className="w-full bg-gray-100 flex items-center justify-center">
                        <img 
                            src={banner.image_url} 
                            alt={banner.title} 
                            className="w-full h-auto object-contain"
                        />
                    </div>
                )}

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
