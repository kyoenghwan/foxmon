'use client';

import React from 'react';
import { 
  Flame, Snowflake, Sparkles, Zap, Ghost, Monitor, 
  Trees, Waves, Cherry, Stars, Sun, Thermometer, 
  Terminal, Music, Gem, ShieldAlert, Heart, Skull,
  Crown, Lightbulb, Star, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { useJobModal } from '@/hooks/use-job-modal';

function MarqueeText({ children, className, style }: { children: React.ReactNode, className: string, style?: React.CSSProperties }) {
    const textRef = React.useRef<HTMLDivElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = React.useState(false);

    React.useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && textRef.current) {
                setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth);
            }
        };
        const timer = setTimeout(checkOverflow, 100);
        window.addEventListener('resize', checkOverflow);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkOverflow);
        }
    }, [children]);

    return (
        <div ref={containerRef} className="w-full overflow-hidden relative flex items-center" style={style}>
            {isOverflowing ? (
                <div className={`${className.replace(/truncate|line-clamp-\d/g, '').trim()} whitespace-nowrap inline-block`} style={{ animation: 'marquee-scroll 8s linear infinite' }}>
                    <span className="mr-12">{children}</span>
                    <span>{children}</span>
                </div>
            ) : (
                <div ref={textRef} className={`${className} truncate`}>
                    {children}
                </div>
            )}
            <style jsx>{`
                @keyframes marquee-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(calc(-50% - 1.5rem)); }
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
    category?: string;
    pay: string;
    image: string;
    tags?: string[];
    isBig?: boolean;
    isSide?: boolean;
    impactType?: ImpactType;
    effectIntensity?: string; // 기존: 'high' | 'medium' | 'low' | 'none', 확장: 'shimmer', 'pulse' 등 명시적 애니메이션 키
    hideLogo?: boolean;
    tier?: string;
    id: string;
    customColor?: string;
    bgOpacity?: string;
    status?: string;
    merchant_tier?: 'NORMAL' | 'VIP' | 'VVIP' | 'VVVIP';
    rawAd?: any;
    onClick?: (e: React.MouseEvent) => void;
}

function MerchantTierBadge({ tier }: { tier: 'VIP' | 'VVIP' | 'VVVIP' }) {
    if (tier === 'VIP') {
        return (
            <span className="inline-flex items-center gap-0.5 px-1 py-[0.5px] rounded text-[8px] font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 border border-amber-300/40 shadow-[0_0_6px_rgba(245,158,11,0.4)] shrink-0 ml-1 select-none">
                🎖️ 우수
            </span>
        );
    }
    if (tier === 'VVIP') {
        return (
            <span className="inline-flex items-center gap-0.5 px-1 py-[0.5px] rounded text-[8px] font-black bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 text-white border border-fuchsia-400/40 shadow-[0_0_8px_rgba(168,85,247,0.6)] shrink-0 ml-1 select-none animate-pulse">
                🏆 으뜸
            </span>
        );
    }
    if (tier === 'VVVIP') {
        return (
            <span className="inline-flex items-center gap-0.5 px-1 py-[0.5px] rounded text-[8px] font-black bg-gradient-to-r from-rose-500 via-amber-400 to-blue-600 text-white border border-amber-300/50 shadow-[0_0_12px_rgba(239,68,68,0.7)] shrink-0 ml-1 select-none animate-bounce">
                👑 명가
            </span>
        );
    }
    return null;
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

export function PremiumJobCard({ company, title, location, category, pay, image, tags, isBig, isSide, impactType = 'none', effectIntensity = 'medium', hideLogo = false, tier, id, customColor, bgOpacity, status, merchant_tier = 'NORMAL', rawAd, onClick }: PremiumJobCardProps) {
    const { t } = useLanguage();
    const { openModal } = useJobModal();
    
    // 1. 업체명 파싱
    let displayName = company;
    if (displayName?.includes('(') && displayName?.includes(')')) {
        const match = displayName.match(/(.*)\((.*)\)/);
        if (match) displayName = match[1].trim();
    }

    // 2. 급여 데이터 파싱
    let payType = '';
    let payAmount = pay || '';
    if (payAmount?.includes(']') && payAmount?.startsWith('[')) {
        // 구형 데이터 포맷: [월급] 3,000,000
        const parts = payAmount.split(']');
        payType = parts[0].replace('[', '').trim();
        payAmount = parts[1].trim();
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

    // 3. 지역 데이터 파싱 (다중 선택 시 마키 효과 적용)
    let sido = '전국';
    let sigungus = '';
    let isMultiSigungu = false;
    
    if (location) {
        const parts = location.split(' ');
        if (parts.length >= 2) {
            sido = parts[0];
            sigungus = parts.slice(1).join(' ');
            isMultiSigungu = sigungus?.includes(',');
        } else {
            sido = parts[0];
        }
    }

    const config = THEME_CONFIG[impactType] || THEME_CONFIG.none;
    const Icon = config.icon;
    const isImpact = impactType !== 'none';
    const isCrazy = impactType === 'neon_crazy';
    const isCyber = impactType === 'glitch';

    const [intensity, action] = effectIntensity && effectIntensity?.includes('::') 
        ? effectIntensity.split('::') 
        : [effectIntensity, effectIntensity]; // 하위 호환성

    let animClass = config.animClass;
    let opacityClass = 'opacity-50'; // 기본적으로 액션이 더 잘보이게 50%
    
    // 명시적인 액션(애니메이션) 타입 지정 (테마와 액션 분리)
    if (intensity === 'none' || action === 'none') {
        animClass = '';
        opacityClass = 'opacity-10'; // 정적일 땐 은은하게
    } else if (intensity === 'low') {
        opacityClass = 'opacity-30';
        animClass = action ? `animate-${action} duration-1000` : (config.animClass ? `${config.animClass} duration-1000` : '');
    } else if (intensity === 'medium' || intensity === 'high') {
        opacityClass = intensity === 'high' ? 'opacity-80' : 'opacity-60';
        animClass = action && action !== 'high' && action !== 'medium' && action !== 'low' ? `animate-${action}` : config.animClass;
    } else if (action) {
        // 커스텀 액션 (shimmer, pulse, rainbow-border 등)
        opacityClass = 'opacity-60';
        animClass = `animate-${action}`;
    }

    // color 파싱 (DB에서 '색상::투명도' 형태로 저장된 경우 대응)
    let finalCustomColor = customColor;
    let finalBgOpacity = bgOpacity;

    if (customColor && customColor.includes('::')) {
        const parts = customColor.split('::');
        finalCustomColor = parts[0];
        finalBgOpacity = parts[1] || bgOpacity;
    }

    const parsedOpacity = parseInt(finalBgOpacity || ((tier === 'GENERAL' || tier === 'AD_GENERAL') ? '5' : '0'), 10);
    const validOpacity = isNaN(parsedOpacity) ? 0 : Math.max(0, Math.min(100, parsedOpacity));
    const hexOpacity = Math.round((validOpacity / 100) * 255).toString(16).padStart(2, '0').toUpperCase();

    // 정확한 액션 이름 추출 (intensity 키워드 제외)
    const actualAction = (action && !['high', 'medium', 'low', 'none'].includes(action || '')) 
        ? action 
        : (config.animClass ? config.animClass.replace('animate-', '') : '');

    // 오버레이 형태의 애니메이션 (내부를 스윕하거나 지나가는 효과)
    const overlayAnims = ['shimmer', 'diamond', 'emerald', 'matrix', 'ocean', 'platinum', 'rainbow-border'];
    const isOverlayAnim = overlayAnims?.includes(actualAction || '');

    // 래퍼에 애니메이션 클래스를 적용할지 여부 (오버레이 전용이 아니면 래퍼에 적용)
    const wrapperAnimClass = (!isOverlayAnim && actualAction !== 'rainbow-border') ? animClass : '';

    return (
        <div className={`relative ${
            isBig ? 'h-full min-h-[292px] w-full' : 
            isSide ? 'aspect-[2/3] w-full xl:w-[130px]' : 
            hideLogo ? 'aspect-[17/8] w-full xl:w-[195px]' : 
            'aspect-[3/2] w-full xl:w-[195px]'
        } min-w-0 group p-[3px]`}>
            
            {/* --- [배로 아래 배경 레이어] --- */}
            {(isImpact || wrapperAnimClass) && (
                <div className={`absolute inset-0 overflow-hidden rounded-xl z-0 ${wrapperAnimClass}`}>
                    {!isCrazy && !isCyber && action !== 'rainbow-border' && isImpact && (
                        <div className={`absolute inset-0 ${opacityClass} blur-[1px] ${config.bg}`} />
                    )}
                    {/* 크레이지 테마이거나 액션이 무지개 테두리일 때 */}
                    {(isCrazy || action === 'rainbow-border') && (
                        <div className="absolute inset-[-250%] animate-rainbow-border opacity-100" />
                    )}
                </div>
            )}

            <Link 
                href={`/jobs/${id}`} 
                prefetch={false}
                onClick={(e) => {
                    if (onClick) {
                        onClick(e);
                    }
                    if (rawAd) {
                        e.preventDefault();
                        const jobDataForModal = {
                            ...rawAd,
                            content: rawAd.detail_content || rawAd.content || '',
                            employer_name: rawAd.company || rawAd.company_name || '폭스몬',
                            image_url: rawAd.image || rawAd.logo_url || ''
                        };
                        openModal(jobDataForModal);
                    }
                }}
                className={`relative h-full w-full rounded-[calc(0.75rem-3px)] overflow-hidden shadow-sm transition-all duration-300 ${isSide ? 'p-1' : 'p-1 sm:p-1.5 lg:p-1.5'} flex flex-col justify-between z-10 ${
                    isCyber ? 'bg-black/95 text-white' : 'bg-white'
                }`}
            >
                {/* --- [내부 배경 투명도 레이어] --- */}
                {finalCustomColor && (
                    <div 
                        className="absolute inset-0 pointer-events-none z-[0]" 
                        style={{ 
                            backgroundColor: hexOpacity !== '00' ? `${finalCustomColor}${hexOpacity}` : 'transparent',
                            boxShadow: `0 0 0 1px ${finalCustomColor}40 inset`
                        }} 
                    />
                )}
                {/* --- [오버레이 효과 레이어 (글자 뒤)] --- */}
                {!isCrazy && isOverlayAnim && (
                    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-[calc(0.75rem-3px)]">
                        {/* Shimmer / Diamond 효과는 별도의 백그라운드 그라디언트가 필요함 */}
                        {(actualAction === 'shimmer' || actualAction === 'diamond') && (
                            <div className={`absolute inset-x-[-100%] inset-y-0 bg-gradient-to-r from-transparent via-white to-transparent skew-x-[-25deg] ${animClass} opacity-70`} />
                        )}
                        
                        {/* 자체 배경이 있는 오버레이 애니메이션 (emerald, matrix, ocean, platinum 등) */}
                        {actualAction !== 'shimmer' && actualAction !== 'diamond' && actualAction !== 'rainbow-border' && isImpact && (
                            <div className={`absolute inset-0 ${animClass} opacity-30 mix-blend-overlay`} />
                        )}
                    </div>
                )}
                
                {isCrazy && (
                    <div className="absolute inset-0 pointer-events-none z-0 animate-flicker mix-blend-overlay bg-purple-500/5" />
                )}

                {/* --- [콘텐츠 영역 (최상단)] --- */}
                <div className={`flex flex-col h-full w-full relative z-10 ${isSide ? 'gap-1' : ''}`}>
                    
                    {isSide ? (
                        <>
                            {/* 사이드 배너용 세로 레이아웃 */}
                            <div className="w-full aspect-[3/2] bg-gray-50 flex items-center justify-center rounded-sm border border-gray-100 overflow-hidden shrink-0">
                                {image ? (
                                    <div className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${image})` }} />
                                ) : (
                                    <div className="text-gray-300 font-black text-[12px] bg-gray-100 w-full h-full flex items-center justify-center tracking-widest text-center leading-[1.1]">NO<br/>LOGO</div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                                {/* 1. 지역 영역 */}
                                <div className="flex items-center gap-1 text-[10px] max-[424px]:text-[2.2vw] text-gray-500 w-full min-w-0">
                                    {category && (
                                        <span className={`shrink-0 border px-1.5 py-[2px] rounded-[2px] text-[9px] sm:text-[10px] font-black shadow-sm ${
                                            isCyber ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200'
                                        }`}>
                                            {category}
                                        </span>
                                    )}
                                    <div className={`flex-1 flex items-center gap-1 shrink-0 border px-1 py-[1px] leading-[1.1] font-bold rounded-[2px] overflow-hidden ${isCyber ? 'text-black bg-cyan-400 border-none' : isImpact ? `${config.color} ${config.bg.replace('bg-', 'bg-')}/10 ${config.border}` : (tier === 'GENERAL' || tier === 'AD_GENERAL') && customColor ? 'bg-white' : 'text-[#2b6cb0] border-[#2b6cb0] bg-[#ebf8ff]'}`} style={(tier === 'GENERAL' || tier === 'AD_GENERAL') && customColor ? { color: customColor, borderColor: customColor } : {}}>
                                        <span className="shrink-0">{sido}</span>
                                        {sigungus && (
                                            <>
                                                <span className="shrink-0 opacity-50">|</span>
                                                {isMultiSigungu ? (
                                                    <div className="flex-1 overflow-hidden relative flex items-center h-full">
                                                        <div className="whitespace-nowrap inline-block animate-[marquee-scroll_6s_linear_infinite]">
                                                            <span className="mr-6">{sigungus}</span>
                                                            <span className="mr-6">{sigungus}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="truncate">{sigungus}</span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* 2. 상호 영역 */}
                                <div className="flex items-center gap-1.5 w-full">
                                    <div className={`shrink-0 flex items-center justify-center px-1.5 py-[2px] rounded-sm text-[9px] font-black shadow-sm ${
                                        isCyber ? 'bg-cyan-900 text-cyan-200 border border-cyan-700' :
                                        isImpact ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 border border-amber-200' : 
                                        (tier === 'GENERAL' || tier === 'AD_GENERAL') && customColor ? 'bg-white' :
                                        'bg-gray-100 text-gray-700 border border-gray-300'
                                    }`} style={(tier === 'GENERAL' || tier === 'AD_GENERAL') && customColor ? { color: customColor, borderColor: customColor } : {}}>
                                        {merchant_tier === 'VVVIP' ? (
                                            <>명가</>
                                        ) : merchant_tier === 'VVIP' ? (
                                            <>으뜸</>
                                        ) : merchant_tier === 'VIP' ? (
                                            <>우수</>
                                        ) : (
                                            <>일반</>
                                        )}
                                    </div>
                                    <MarqueeText className={`font-black text-[12px] sm:text-[13px] tracking-tight transition-colors line-clamp-2 leading-tight ${isCyber ? 'text-green-400 font-mono' : config.color}`} style={(tier === 'GENERAL' || tier === 'AD_GENERAL') && customColor ? { color: customColor } : {}}>
                                        {displayName}
                                    </MarqueeText>
                                </div>

                                {/* 3. 제목 영역 */}
                                <div className="w-full relative overflow-hidden flex items-center gap-1">
                                    <div className="flex-1 min-w-0">
                                        <MarqueeText className={`text-[13px] sm:text-[14px] max-[424px]:text-[3.5vw] leading-[1.3] font-black tracking-tight px-1 rounded-[2px] ${isCyber ? 'text-yellow-300 border-l-2 border-yellow-300 pl-1' : isImpact ? `${config.color.replace('text-', 'text-')} ${config.bg}/5` : 'text-gray-800 bg-green-200/50'}`}>
                                            {title}
                                        </MarqueeText>
                                    </div>
                                </div>

                                {/* 4. 급여 영역 */}
                                <div className="flex items-center justify-between w-full pt-1 border-t border-dashed border-gray-200">
                                    <div className="flex items-center text-[12px] sm:text-[13px] max-[424px]:text-[3vw] font-bold text-gray-900 truncate tracking-tight gap-1.5 flex-1 min-w-0">
                                        {payType && (
                                            <span className={`shrink-0 text-white text-[9.5px] sm:text-[10px] max-[424px]:text-[2.2vw] px-1.5 py-[1px] max-[424px]:px-1 max-[424px]:py-[0.5px] rounded-sm shadow-sm ${isImpact ? config.bg : 'bg-[#805ad5]'}`}>
                                                {payType}
                                            </span>
                                        )}
                                        <span className={`text-[#e53e3e] truncate font-black ${isCyber ? 'text-[#ff5555]' : ''}`}>
                                            {payAmount}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : hideLogo ? (
                        <>
                            {/* --- 로고 없는 컴팩트 레이아웃 (일반 배너 등) --- */}
                            {/* 상단: 지역 + 업체명 */}
                            <div className="flex items-center gap-1.5 pb-1 w-full overflow-hidden">
                                {/* 1. 업체명 / 닉네임 (왼쪽 배치) */}
                                <div className="flex-1 min-w-0">
                                    <MarqueeText className={`font-black text-[12px] sm:text-[13px] lg:text-[14px] max-[424px]:text-[2.8vw] tracking-tight transition-colors line-clamp-1 leading-tight ${
                                        isCyber ? 'text-green-400 font-mono' : config.color
                                    }`} style={(tier === 'GENERAL' || tier === 'AD_GENERAL') && customColor ? { color: customColor } : {}}>
                                        {displayName}
                                    </MarqueeText>
                                </div>
                                
                                {/* 2. 지역 뱃지 (오른쪽 배치, 타 배너와 동일한 폰트/스타일) */}
                                <div className={`flex items-center gap-1 shrink-0 border px-1.5 py-[2px] leading-normal font-black rounded-[4px] text-[9px] sm:text-[10px] max-[424px]:text-[2.5vw] overflow-hidden ${
                                    isCyber ? 'bg-gray-800 text-gray-300 border-gray-700' : 
                                    isImpact ? `${config.color} ${config.bg.replace('bg-', 'bg-')}/10 ${config.border}` : 
                                    (tier === 'GENERAL' || tier === 'AD_GENERAL') && customColor ? 'bg-white text-gray-600' :
                                    'bg-gray-100 text-gray-600 border-gray-200'
                                }`} style={(tier === 'GENERAL' || tier === 'AD_GENERAL') && customColor ? { color: customColor, borderColor: customColor } : {}}>
                                    <span className="shrink-0">{sido}</span>
                                    {sigungus && (
                                        <>
                                            <span className="shrink-0 opacity-50">|</span>
                                            {isMultiSigungu ? (
                                                <div className="flex-1 overflow-hidden relative flex items-center h-full">
                                                    <div className="whitespace-nowrap inline-block animate-[marquee-scroll_6s_linear_infinite]">
                                                        <span className="mr-6">{sigungus}</span>
                                                        <span className="mr-6">{sigungus}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="truncate">{sigungus}</span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* 중간: 광고 제목 */}
                            <div className="flex-1 w-full flex flex-col justify-center relative overflow-hidden py-0.5 my-0.5">
                                <div className="w-full flex items-center gap-1.5">
                                    {category && (
                                        <span className={`shrink-0 border px-1 py-[1px] rounded-[2px] text-[10px] lg:text-[11px] max-[424px]:text-[2.2vw] font-black ${
                                            isCyber ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200'
                                        }`}>
                                            {category}
                                        </span>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <MarqueeText className={`text-[14px] sm:text-[15px] lg:text-[16px] max-[424px]:text-[3.2vw] leading-[1.3] font-black tracking-tight px-1 rounded-[2px] ${
                                            isCyber ? 'text-yellow-300 border-l-2 border-yellow-300 pl-1' :
                                            isImpact ? `${config.color.replace('text-', 'text-')} ${config.bg}/5` :
                                            'text-gray-800'
                                        }`}>
                                            {title}
                                        </MarqueeText>
                                    </div>
                                </div>
                            </div>

                            {/* 하단: 급여 및 뱃지 */}
                            <div className="flex items-end justify-between mt-auto w-full pt-1 pb-0.5">
                                <div className="flex items-center text-[11px] sm:text-[12px] lg:text-[13px] max-[424px]:text-[2.5vw] font-bold text-gray-900 truncate tracking-tight gap-1.5">
                                    {payType && (
                                        <span className={`shrink-0 text-white text-[9.5px] sm:text-[10px] lg:text-[11px] max-[424px]:text-[2.2vw] px-1.5 py-0.5 rounded-sm shadow-sm ${
                                            isImpact ? config.bg : 'bg-[#805ad5]'
                                        }`}>
                                            {payType}
                                        </span>
                                    )}
                                    <span className={`text-gray-800 ${isCyber ? 'text-white' : ''}`}>
                                        {payAmount}
                                    </span>
                                </div>
                                <div className={`shrink-0 flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] lg:text-[11px] max-[424px]:text-[2.2vw] font-black shadow-[0_1px_3px_rgba(0,0,0,0.1)] border transition-all ${
                                    isCyber ? 'bg-cyan-900 text-cyan-200 border-cyan-700 shadow-[0_0_8px_rgba(34,211,238,0.3)]' :
                                    merchant_tier === 'VVVIP' ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-blue-600 text-white border-amber-300 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-bounce' : 
                                    merchant_tier === 'VVIP' ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white border-fuchsia-400 shadow-[0_0_10px_rgba(168,85,247,0.4)] animate-pulse' :
                                    merchant_tier === 'VIP' ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]' :
                                    'bg-slate-100 text-slate-500 border-slate-200/80 shadow-none'
                                }`}>
                                    {merchant_tier === 'VVVIP' ? (
                                        <><Crown className="w-3 h-3 max-[424px]:w-[2.5vw] max-[424px]:h-[2.5vw] justify-center mr-1 text-white animate-bounce" /> 명가</>
                                    ) : merchant_tier === 'VVIP' ? (
                                        <><Zap className="w-3 h-3 max-[424px]:w-[2.5vw] max-[424px]:h-[2.5vw] justify-center mr-1 text-yellow-200" /> 으뜸</>
                                    ) : merchant_tier === 'VIP' ? (
                                        <><Crown className="w-3 h-3 max-[424px]:w-[2.5vw] max-[424px]:h-[2.5vw] justify-center mr-1 text-amber-800" /> 우수</>
                                    ) : (
                                        <><Star className="w-3 h-3 max-[424px]:w-[2.5vw] max-[424px]:h-[2.5vw] justify-center mr-1 text-slate-400" /> 일반</>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col w-full h-full justify-between pb-0.5">
                            {/* 상단: 로고 50%, 상호명 50% */}
                            <div className="flex w-full h-[45%] gap-2 shrink-0">
                                {/* 로고 영역 (1.5:1 비율) */}
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
                                
                                {/* 상호명 영역 (지역명 위, 상호명 아래) */}
                                <div className={`flex-1 min-w-0 flex flex-col justify-center space-y-1`}>
                                    <div className="flex items-center w-full min-w-0">
                                <div className={`flex items-center gap-1 shrink-0 border px-1 py-[1px] leading-normal font-black rounded-[4px] text-[9px] sm:text-[10px] max-[424px]:text-[2.5vw] w-full overflow-hidden ${
                                            isCyber ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200'
                                        }`}>
                                            <span className="shrink-0">{sido}</span>
                                            {sigungus && (
                                                <>
                                                    <span className="shrink-0 opacity-50">|</span>
                                                    {isMultiSigungu ? (
                                                        <div className="flex-1 overflow-hidden relative flex items-center h-full">
                                                            <div className="whitespace-nowrap inline-block animate-[marquee-scroll_6s_linear_infinite]">
                                                                <span className="mr-6">{sigungus}</span>
                                                                <span className="mr-6">{sigungus}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="truncate">{sigungus}</span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <MarqueeText className={`font-black text-[13px] sm:text-[14px] max-[424px]:text-[3.5vw] tracking-tight transition-colors line-clamp-2 leading-tight ${
                                        isCyber ? 'text-green-400 font-mono' : config.color
                                    }`}>
                                        {displayName}
                                    </MarqueeText>
                                </div>
                            </div>

                            {/* 중간: 광고글 (멘트) */}
                            <div className="w-full relative overflow-hidden flex items-center gap-1.5 shrink-0">
                                {category && (
                                    <span className={`shrink-0 border px-1 py-[1px] rounded-[2px] text-[10px] sm:text-[11px] max-[424px]:text-[2.2vw] font-black ${
                                        isCyber ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                        {category}
                                    </span>
                                )}
                                <div className="flex-1 min-w-0">
                                    <MarqueeText className={`text-[13px] sm:text-[14px] max-[424px]:text-[3.5vw] leading-[1.3] font-black tracking-tight px-1 rounded-[2px] ${
                                        isCyber ? 'text-yellow-300 border-l-2 border-yellow-300 pl-1' :
                                        isImpact ? `${config.color.replace('text-', 'text-')} ${config.bg}/5` :
                                        'text-gray-800 bg-green-200/50'
                                    }`}>
                                        {title}
                                    </MarqueeText>
                                </div>
                            </div>

                            {/* 하단: 급여 및 뱃지 */}
                            <div className="flex items-end justify-between w-full shrink-0">
                                <div className="flex items-center text-[12px] sm:text-[13px] max-[424px]:text-[3.2vw] font-bold text-gray-900 truncate tracking-tight gap-1 sm:gap-1.5">
                                    {payType && (
                                        <span className={`shrink-0 text-white text-[9px] sm:text-[10px] max-[424px]:text-[2.2vw] px-1 sm:px-1.5 max-[424px]:px-1 py-[1px] sm:py-0.5 max-[424px]:py-0 rounded-sm shadow-sm ${
                                            isImpact ? config.bg : 'bg-[#805ad5]'
                                        }`}>
                                            {payType}
                                        </span>
                                    )}
                                    <span className={`text-gray-800 ${isCyber ? 'text-white' : ''}`}>
                                        {payAmount}
                                    </span>
                                </div>
                                <div className={`shrink-0 flex items-center px-1 sm:px-1.5 py-[1px] sm:py-0.5 rounded-[4px] text-[9px] sm:text-[10px] max-[424px]:text-[2.5vw] font-black shadow-[0_1px_3px_rgba(0,0,0,0.1)] border transition-all ${
                                    isCyber ? 'bg-cyan-900 text-cyan-200 border-cyan-700 shadow-[0_0_8px_rgba(34,211,238,0.3)]' :
                                    merchant_tier === 'VVVIP' ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-blue-600 text-white border-amber-300 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-bounce' : 
                                    merchant_tier === 'VVIP' ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white border-fuchsia-400 shadow-[0_0_10px_rgba(168,85,247,0.4)] animate-pulse' :
                                    merchant_tier === 'VIP' ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]' :
                                    'bg-slate-100 text-slate-500 border-slate-200/80 shadow-none'
                                }`}>
                                    {merchant_tier === 'VVVIP' ? (
                                        <>
                                            <Crown className="w-[10px] h-[10px] max-[424px]:w-[2.5vw] max-[424px]:h-[2.5vw] sm:w-3 sm:h-3 justify-center mr-0.5 sm:mr-1 text-white animate-bounce" /> 명가
                                        </>
                                    ) : merchant_tier === 'VVIP' ? (
                                        <>
                                            <Zap className="w-[10px] h-[10px] max-[424px]:w-[2.5vw] max-[424px]:h-[2.5vw] sm:w-3 sm:h-3 justify-center mr-0.5 sm:mr-1 text-yellow-200" /> 으뜸
                                        </>
                                    ) : merchant_tier === 'VIP' ? (
                                        <>
                                            <Crown className="w-[10px] h-[10px] max-[424px]:w-[2.5vw] max-[424px]:h-[2.5vw] sm:w-3 sm:h-3 justify-center mr-0.5 sm:mr-1 text-amber-800" /> 우수
                                        </>
                                    ) : (
                                        <>
                                            <Star className="w-[10px] h-[10px] max-[424px]:w-[2.5vw] max-[424px]:h-[2.5vw] sm:w-3 sm:h-3 justify-center mr-0.5 sm:mr-1 text-slate-400" /> 일반
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* --- [COMPLETED Status Overlay] --- */}
                {status === 'COMPLETED' && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-[1px] rounded-[calc(0.75rem-3px)]">
                        <div className="bg-white/10 border border-white/20 text-white font-black px-4 py-1.5 rounded-full backdrop-blur-md shadow-2xl flex items-center gap-1.5 text-sm sm:text-base transform rotate-[-5deg]">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                            채용마감
                        </div>
                    </div>
                )}
                
                <div className={`absolute inset-0 border rounded-[calc(0.75rem-3px)] pointer-events-none transition-colors z-30 ${
                    isImpact ? config.border : 'border-gray-200 group-hover:border-purple-700'
                }`} />
            </Link>
        </div>
    );
}  
