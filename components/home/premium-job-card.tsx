'use client';

import React from 'react';
import { 
  Flame, Snowflake, Sparkles, Zap, Ghost, Monitor, 
  Trees, Waves, Cherry, Stars, Sun, Thermometer, 
  Terminal, Music, Gem, ShieldAlert, Heart, Skull,
  Crown, Lightbulb, Star
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';

// 텍스트 오버플로우 시 마퀴(Marquee) 효과를 주는 컴포넌트
function MarqueeText({ children, className }: { children: React.ReactNode, className: string }) {
    const textRef = React.useRef<HTMLDivElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = React.useState(false);

    React.useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && textRef.current) {
                setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth);
            }
        };
        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [children]);

    return (
        <div ref={containerRef} className="w-full overflow-hidden relative flex items-center">
            <div 
                ref={textRef} 
                className={`${className} whitespace-nowrap ${isOverflowing ? 'hover:animate-marquee-slow inline-block pr-10' : 'truncate'}`}
                style={{ minWidth: 'min-content' }}
            >
                {children}
            </div>
            {/* 전역 style 애니메이션 추가 (오직 여기서만 필요) */}
            <style jsx>{`
                @keyframes marquee-slow {
                    0% { transform: translateX(0); }
                    50% { transform: translateX(calc(-100% + 150px)); }
                    55% { transform: translateX(calc(-100% + 150px)); }
                    100% { transform: translateX(0); }
                }
                .hover\\:animate-marquee-slow:hover {
                    animation: marquee-slow 4s linear infinite;
                }
            `}</style>
        </div>
    );
}

// 22종류의 모든 임팩트 타입 정의
type ImpactType = 
    | 'gold' | 'neon' | 'neon_crazy' | 'fire' | 'ice' | 'emerald' | 'glitch' | 'storm' | 'ghost' 
    | 'forest' | 'ocean' | 'sakura' | 'galaxy' | 'sun' | 'lava' | 'matrix' | 'retro' 
    | 'diamond' | 'platinum' | 'aura' | 'candy' | 'toxic' | 'none';

interface PremiumJobCardProps {
    company: string;
    title: string;
    location: string;
    pay: string;
    image: string;
    tags?: string[];
    isBig?: boolean;
    impactType?: ImpactType;
    id: string;
}

// 테마별 설정을 관리하는 매핑 객체 - 원래의 역동적인(Dynamic) 스타일로 복구
const THEME_CONFIG: Record<string, any> = {
    gold: { label: 'GOLD', color: 'text-yellow-600', bg: 'bg-yellow-400', border: 'border-yellow-500/50', icon: Crown, animClass: 'animate-shimmer' },
    neon: { label: 'NEON', color: 'text-purple-600', bg: 'bg-primary', border: 'border-purple-500/40', icon: Lightbulb, animClass: 'animate-retro' },
    neon_crazy: { label: 'CRAZY', color: 'text-purple-700', bg: 'bg-gradient-to-r from-red-500 to-blue-500', border: 'border-transparent', icon: Zap, animClass: 'animate-rainbow-border' },
    fire: { label: 'FIRE', color: 'text-orange-900', bg: 'bg-red-600', border: 'border-orange-500', icon: Flame, animClass: 'animate-fire' },
    ice: { label: 'ICE', color: 'text-blue-900', bg: 'bg-cyan-500', border: 'border-cyan-200', icon: Snowflake, animClass: 'animate-ice' },
    emerald: { label: 'EMERALD', color: 'text-emerald-900', bg: 'bg-emerald-600', border: 'border-emerald-500', icon: Sparkles, animClass: 'animate-emerald' },
    glitch: { label: 'CYBER', color: 'text-green-400', bg: 'bg-fuchsia-600', border: 'border-cyan-500', icon: Monitor, animClass: 'animate-glitch' },
    storm: { label: 'STORM', color: 'text-blue-900', bg: 'bg-blue-600', border: 'border-blue-400', icon: Zap, animClass: 'animate-storm' },
    ghost: { label: 'GHOST', color: 'text-gray-900', bg: 'bg-gray-500', border: 'border-gray-400', icon: Ghost, animClass: 'animate-ghost' },
    forest: { label: 'FOREST', color: 'text-green-900', bg: 'bg-green-700', border: 'border-green-600', icon: Trees, animClass: 'animate-forest' },
    ocean: { label: 'OCEAN', color: 'text-blue-900', bg: 'bg-blue-800', border: 'border-blue-700', icon: Waves, animClass: 'animate-ocean' },
    sakura: { label: 'SAKURA', color: 'text-pink-900', bg: 'bg-pink-400', border: 'border-pink-300', icon: Cherry, animClass: 'animate-sakura' },
    galaxy: { label: 'GALAXY', color: 'text-purple-900', bg: 'bg-indigo-900', border: 'border-purple-600', icon: Stars, animClass: 'animate-galaxy' },
    sun: { label: 'SUNLIGHT', color: 'text-orange-900', bg: 'bg-orange-400', border: 'border-orange-300', icon: Sun, animClass: 'animate-sun' },
    lava: { label: 'LAVA', color: 'text-red-900', bg: 'bg-red-800', border: 'border-red-700', icon: Thermometer, animClass: 'animate-lava' },
    matrix: { label: 'MATRIX', color: 'text-green-500', bg: 'bg-green-800', border: 'border-green-400', icon: Terminal, animClass: 'animate-matrix' },
    retro: { label: 'RETRO', color: 'text-pink-600', bg: 'bg-pink-500', border: 'border-cyan-400', icon: Music, animClass: 'animate-retro' },
    diamond: { label: 'DIAMOND', color: 'text-blue-600', bg: 'bg-blue-300', border: 'border-cyan-200', icon: Gem, animClass: 'animate-diamond' },
    platinum: { label: 'PLATINUM', color: 'text-gray-600', bg: 'bg-gray-300', border: 'border-gray-200', icon: ShieldAlert, animClass: 'animate-platinum' },
    aura: { label: 'AURA', color: 'text-purple-600', bg: 'bg-fuchsia-400', border: 'border-fuchsia-300', icon: Heart, animClass: 'animate-aura' },
    candy: { label: 'CANDY', color: 'text-pink-600', bg: 'bg-rose-400', border: 'border-rose-300', icon: Sparkles, animClass: 'animate-candy' },
    toxic: { label: 'TOXIC', color: 'text-lime-600', bg: 'bg-lime-500', border: 'border-lime-400', icon: Skull, animClass: 'animate-toxic' },
    none: { label: 'HIT', color: 'text-gray-900', bg: 'bg-purple-700', border: 'border-gray-200', icon: Crown, animClass: '' }
};

export function PremiumJobCard({ company, title, location, pay, image, tags, isBig, impactType = 'none', id }: PremiumJobCardProps) {
    const { t } = useLanguage();
    
    // 1. 업체명 파싱
    let displayName = company;
    if (displayName.includes('(') && displayName.includes(')')) {
        const match = displayName.match(/(.*)\((.*)\)/);
        if (match) displayName = match[1].trim();
    }

    // 2. 급여 데이터 파싱
    let payType = '';
    let payAmount = pay;
    if (pay.includes(']') && pay.startsWith('[')) {
        const parts = pay.split(']');
        payType = parts[0].replace('[', '').trim();
        payAmount = parts[1].trim();
    }

    const config = THEME_CONFIG[impactType] || THEME_CONFIG.none;
    const Icon = config.icon;
    const isImpact = impactType !== 'none';
    const isCrazy = impactType === 'neon_crazy';
    const isCyber = impactType === 'glitch';

    return (
        <div className={`relative ${isBig ? 'h-full min-h-[292px]' : 'aspect-[3/2]'} w-full min-w-[140px] group p-[3px]`}>
            
            {/* --- [배로 아래 배경 레이어] --- */}
            {isImpact && (
                <div className={`absolute inset-0 overflow-hidden rounded-xl z-0 ${config.animClass}`}>
                    {!isCrazy && !isCyber && (
                        <div className={`absolute inset-0 opacity-40 blur-[1px] ${config.bg}`} />
                    )}
                    {isCrazy && (
                        <div className="absolute inset-[-250%] animate-rainbow-border" />
                    )}
                </div>
            )}

            {/* --- [메인 카드 바디] --- */}
            <Link 
                href={`/jobs/${id}`} 
                className={`relative h-full w-full rounded-[calc(0.75rem-3px)] overflow-hidden shadow-sm transition-all duration-300 p-1.5 sm:p-2 lg:p-2.5 flex flex-col justify-between z-10 ${
                    isCyber ? 'bg-black/95 text-white' : 'bg-white'
                }`}
            >
                {/* --- [오버레이 효과 레이어 (글자 뒤)] --- */}
                {isImpact && !isCrazy && (
                    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                        {(impactType === 'gold' || impactType === 'diamond') && (
                            <div className={`absolute inset-x-[-100%] inset-y-0 bg-gradient-to-r from-transparent via-white to-transparent skew-x-[-25deg] ${config.animClass}`} />
                        )}
                        {impactType !== 'gold' && impactType !== 'diamond' && (
                            <div className={`absolute inset-0 ${config.animClass} opacity-30`} />
                        )}
                    </div>
                )}
                
                {isCrazy && (
                    <div className="absolute inset-0 pointer-events-none z-0 animate-flicker mix-blend-overlay bg-purple-500/5" />
                )}

                {/* --- [콘텐츠 영역 (최상단)] --- */}
                <div className="flex flex-col h-full w-full relative z-10">
                    
                    {/* --- [상단: 로고 50%, 상호명 50%] --- */}
                    <div className="flex w-full h-[50%] gap-2 pb-1.5">
                        {/* 로고 영역 (1:1 비율 왼쪽) */}
                        <div className="flex-1 min-w-0 bg-gray-50 flex items-center justify-center rounded-sm border border-gray-100 overflow-hidden shrink-0">
                            {image ? (
                                <div 
                                    className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105"
                                    style={{ backgroundImage: `url(${image})` }} 
                                />
                            ) : (
                                <div className="text-gray-300 font-black text-[10px] sm:text-[11px] bg-gray-100 w-full h-full flex items-center justify-center tracking-widest text-center leading-[1.1]">NO<br/>LOGO</div>
                            )}
                        </div>
                        
                        {/* 상호명 영역 (1:1 비율 오른쪽) */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5 mt-[-2px]">
                            <MarqueeText className={`font-black text-[13px] sm:text-[14px] lg:text-[15px] tracking-tight transition-colors line-clamp-2 leading-tight ${
                                isCyber ? 'text-green-400 font-mono' : config.color
                            }`}>
                                {displayName}
                            </MarqueeText>
                            <div className="flex flex-wrap items-center text-[10px] sm:text-[11px] text-gray-500 truncate tracking-tight mt-1">
                                <span className={`shrink-0 border px-1 py-[1px] leading-none mr-1.5 font-bold rounded-[2px] ${
                                    isCyber ? 'text-black bg-cyan-400 border-none' : 
                                    isImpact ? `${config.color} ${config.bg.replace('bg-', 'bg-')}/10 ${config.border}` : 
                                    'text-[#2b6cb0] border-[#2b6cb0] bg-[#ebf8ff]'
                                }`}>
                                    {location.split(' ')[0] || '전국'}
                                </span>
                                <span className={`truncate font-medium ${isCyber ? 'text-cyan-300' : ''}`}>
                                    {location.split(' ').slice(1).join(' ') || location}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* --- [하단: 가로 줄, 광고글, 급여/등급] --- */}
                    <div className="flex flex-col w-full h-[50%] pt-1.5 sm:pt-2 border-t border-dashed border-gray-200 justify-between">
                        {/* 광고글 (멘트) */}
                        <div className="w-full relative overflow-hidden">
                            <MarqueeText className={`text-[11px] sm:text-[12px] lg:text-[13px] leading-[1.3] font-bold tracking-tight px-1 rounded-[2px] ${
                                isCyber ? 'text-yellow-300 border-l-2 border-yellow-300 pl-1' :
                                isImpact ? `${config.color.replace('text-', 'text-')} ${config.bg}/5` :
                                'text-gray-800 bg-green-200/50'
                            }`}>
                                {title}
                            </MarqueeText>
                        </div>

                        {/* 급여 및 뱃지 */}
                        <div className="flex items-end justify-between mt-auto w-full pb-0.5">
                            <div className="flex items-center text-[13px] sm:text-[14px] lg:text-[15px] font-bold text-gray-900 truncate tracking-tight gap-1 sm:gap-1.5">
                                {payType && (
                                    <span className={`shrink-0 text-white text-[9px] sm:text-[10px] lg:text-[11px] px-1 sm:px-1.5 py-[1px] sm:py-0.5 rounded-sm shadow-sm ${
                                        isImpact ? config.bg : 'bg-[#805ad5]'
                                    }`}>
                                        {payType}
                                    </span>
                                )}
                                <span className={`text-gray-800 ${isCyber ? 'text-white' : ''}`}>
                                    {payAmount}
                                </span>
                            </div>
                            <div className={`shrink-0 flex items-center px-1 sm:px-1.5 py-[1px] sm:py-0.5 rounded-sm text-[9px] sm:text-[10px] lg:text-[11px] font-black shadow-sm ${
                                isCyber ? 'bg-cyan-900 text-cyan-200 border border-cyan-700' :
                                isImpact ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 border border-amber-200' : 
                                'bg-gray-100 text-gray-700 border border-gray-300'
                            }`}>
                                {isImpact ? (
                                    <>
                                        <Crown className="w-[10px] h-[10px] sm:w-3 sm:h-3 justify-center mr-0.5 sm:mr-1 text-amber-500" /> VVIP
                                    </>
                                ) : (
                                    <>
                                        <Star className="w-[10px] h-[10px] sm:w-3 sm:h-3 justify-center mr-0.5 sm:mr-1 text-gray-500" /> 우수업체
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
                
                <div className={`absolute inset-0 border rounded-lg pointer-events-none transition-colors z-30 ${
                    isImpact ? config.border : 'border-gray-200 group-hover:border-purple-700'
                }`} />
            </Link>
        </div>
    );
}
