'use client';

import React from 'react';
import { MarqueeText } from '@/components/ui/marquee-text';

export interface PremiumMainBannerCardProps {
    company: string;
    title: string;
    location?: string;
    category?: string;
    pay?: string;
    salary_type?: string;
    salary_amount?: string;
    pay_type?: string;
    pay_amount?: string;
    logo_url?: string;
    image?: string;
    theme?: string;
    premium_banner_mode?: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

export function PremiumMainBannerCard({
    company,
    title,
    location,
    category,
    pay,
    salary_type,
    salary_amount,
    pay_type,
    pay_amount,
    logo_url,
    image,
    theme,
    premium_banner_mode,
    className = '',
    style,
    onClick,
}: PremiumMainBannerCardProps) {
    const isUploadMode = theme === 'UPLOAD' || premium_banner_mode === 'upload';

    // 로고 이미지 URL
    const logoUrl = logo_url || (image && image !== logo_url ? logo_url : undefined);
    const hasLogo = !!logoUrl;

    // 배너 배경 오버레이 이미지 (업로드 모드이거나, 로고와 별개의 배경 이미지일 때만 사용)
    const bannerBgImage = (image && image !== logoUrl) ? image : null;

    // 테마별 은은한 프리미엄 그라데이션 맵
    const themeMap: Record<string, string> = {
        gold: 'from-yellow-950 via-amber-900 to-black',
        platinum: 'from-slate-800 via-gray-900 to-black',
        diamond: 'from-cyan-950 via-blue-950 to-black',
        ruby: 'from-rose-950 via-red-950 to-black',
        sapphire: 'from-blue-950 via-indigo-950 to-black',
        emerald: 'from-emerald-950 via-teal-950 to-black',
        amethyst: 'from-purple-950 via-fuchsia-950 to-black',
        obsidian: 'from-gray-900 via-black to-black'
    };

    const bgGradient = theme && theme !== 'none' && themeMap[theme] 
        ? `bg-gradient-to-br ${themeMap[theme]}` 
        : 'bg-gradient-to-br from-indigo-950 via-purple-950 to-black';

    // 급여 데이터 파싱 (뱃지와 파란/흰색 포인트 텍스트 분리)
    let parsedPayType = '';
    let parsedPayAmount = pay || (salary_type ? `[${salary_type}] ${salary_amount}` : salary_amount) || (pay_amount ? `${pay_type || ''} ${pay_amount}` : '');

    if (parsedPayAmount?.includes(']') && parsedPayAmount?.startsWith('[')) {
        const splitIndex = parsedPayAmount.indexOf(']');
        parsedPayType = parsedPayAmount.substring(1, splitIndex).trim();
        parsedPayAmount = parsedPayAmount.substring(splitIndex + 1).trim();
    } else if (parsedPayAmount === '추후협의') {
        parsedPayType = '협의';
        parsedPayAmount = '추후협의';
    } else if (parsedPayAmount) {
        const parts = parsedPayAmount.split(' ');
        if (parts.length > 1 && ['시급', '일급', '주급', '월급', '건당', '협의', '기타'].includes(parts[0] || '')) {
            parsedPayType = parts[0];
            parsedPayAmount = parts.slice(1).join(' ');
        }
    }

    const companyDisplay = company || '업체명 미입력';
    const titleDisplay = title || '채용 제목이 들어가는 영역입니다.';
    const locationDisplay = location || '지역';
    const categoryDisplay = category ? ` · ${category}` : '';

    return (
        <div
            className={`w-full h-full rounded-2xl ${isUploadMode ? 'bg-black' : bgGradient} shadow-md relative overflow-hidden group cursor-pointer border border-white/10 select-none ${className}`}
            style={style}
            onClick={onClick}
        >
            {isUploadMode && image ? (
                /* 1) 직접 업로드 모드: 꽉 찬 반투명 블러 배경 + 원본 비율 왜곡 없는 중앙 이미지 (GIF 애니메이션 지원) */
                <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
                    {/* 1. 배경 레이어: 2:1 영역을 꽉 채우는 반투명 블러 오버레이 */}
                    <img 
                        src={image} 
                        alt="" 
                        className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-60 pointer-events-none" 
                    />
                    {/* 2. 전면 레이어: 1.5:1 등 원본 비율 100% 유지 (깨짐 방지 / GIF 동작) */}
                    <img 
                        src={image} 
                        alt={titleDisplay || "배너 이미지"} 
                        className="relative z-10 w-full h-full object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-20 pointer-events-none" />
                </div>
            ) : (
                /* 2) 템플릿 모드: 위(로고+상호), 중간(제목 마키), 아래(지역/직종 + 오른쪽 끝 급여) */
                <div className="relative z-20 w-full h-full p-4 sm:p-5 flex flex-col justify-between">
                    {/* 은은한 배경 오버레이 (배경 이미지가 별도로 있을 경우만) */}
                    {bannerBgImage && (
                        <div 
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 mix-blend-overlay opacity-50 z-0 pointer-events-none"
                            style={{ backgroundImage: `url(${bannerBgImage})` }}
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 z-10 pointer-events-none" />

                    {/* [위쪽 영역]: 왼쪽 크게 로고 + 오른쪽 상호명 */}
                    <div className="relative z-20 flex items-center gap-3 w-full">
                        {hasLogo && (
                            <div className="w-[90px] h-[60px] sm:w-[105px] sm:h-[70px] shrink-0 overflow-hidden rounded-lg shadow-sm">
                                <img 
                                    src={logoUrl} 
                                    alt={companyDisplay} 
                                    className="w-full h-full object-fill rounded-lg block" 
                                />
                            </div>
                        )}
                        <h3 className="text-white font-black text-lg sm:text-xl md:text-2xl truncate flex-1 tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                            {companyDisplay}
                        </h3>
                    </div>

                    {/* [중간 영역]: 공고 제목 (길면 오른쪽->왼쪽으로 스르륵 지나는 마키 Ticker) */}
                    <div className="relative z-20 w-full my-auto py-1">
                        <MarqueeText className="text-white/95 font-black text-sm sm:text-base md:text-lg tracking-wide drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                            {titleDisplay}
                        </MarqueeText>
                    </div>

                    {/* [아래쪽 영역]: 왼쪽 (지역 / 직종) + 오른쪽 끝 (급여 뱃지 및 금액) */}
                    <div className="relative z-20 flex items-center justify-between gap-2 w-full pt-2 border-t border-white/15">
                        {/* 왼쪽: 지역 / 직종 */}
                        <div className="text-white/80 font-bold text-xs sm:text-sm truncate">
                            <span>{locationDisplay}</span>
                            <span className="opacity-75">{categoryDisplay}</span>
                        </div>

                        {/* 오른쪽 끝: 급여 뱃지 + 급여액 */}
                        {parsedPayAmount && (
                            <div className="flex items-center gap-1.5 shrink-0 ml-auto font-black">
                                {parsedPayType && (
                                    <span className="px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-black tracking-wide border border-white/20 shadow-sm">
                                        {parsedPayType}
                                    </span>
                                )}
                                <span className="text-white font-black text-base sm:text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                                    {parsedPayAmount}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* 은은한 배경 우측 하단 장식용 글로우 */}
                    <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none z-10" />
                </div>
            )}
        </div>
    );
}
