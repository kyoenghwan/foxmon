'use client';

import React from 'react';
import { 
  Flame, Snowflake, Sparkles, Zap, Ghost, Monitor, 
  Trees, Waves, Cherry, Stars, Sun, Thermometer, 
  Terminal, Music, Gem, ShieldAlert, Heart, Skull,
  Crown, Lightbulb
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';

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
        <div className={`relative ${isBig ? 'h-full min-h-[292px]' : 'h-[120px] md:h-[130px]'} w-full group p-[3px]`}>
            
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
                className={`relative h-full w-full rounded-[calc(0.75rem-3px)] overflow-hidden shadow-sm transition-all duration-300 p-2.5 md:p-3 flex flex-col justify-between z-10 ${
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
                <div className="flex gap-2 md:gap-3 mb-1.5 relative z-10">
                    <div className="w-[80px] h-[40px] md:w-[100px] md:h-[50px] shrink-0 overflow-hidden bg-gray-50 flex items-center justify-center rounded-sm border border-gray-100">
                        {image ? (
                            <div 
                                className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105"
                                style={{ backgroundImage: `url(${image})` }} 
                            />
                        ) : (
                            <div className="text-gray-300 font-black text-[10px] bg-gray-100 w-full h-full flex items-center justify-center">NO LOGO</div>
                        )}
                    </div>
                    
                    <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                        <h3 className={`font-black text-[14px] md:text-[15px] truncate tracking-tight transition-colors ${
                            isCyber ? 'text-green-400 font-mono' : config.color
                        }`}>
                            {displayName}
                        </h3>
                        <div className="flex items-center text-[11px] md:text-[12px] text-gray-500 truncate tracking-tight mt-0.5">
                            <span className={`shrink-0 border px-1 py-0.5 leading-none mr-1.5 font-bold rounded-[2px] ${
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

                <div className="mb-1.5 flex-1 flex flex-col justify-center relative z-10">
                    <p className={`text-[12px] md:text-[13px] line-clamp-1 leading-[1.4] font-bold tracking-tight inline-block w-fit px-1 rounded-[2px] ${
                        isCyber ? 'text-yellow-300 border-l-2 border-yellow-300 pl-1' :
                        isImpact ? `${config.color.replace('text-', 'text-')} ${config.bg}/5` :
                        'text-gray-800 bg-green-200/50'
                    }`}>
                        {title}
                    </p>
                </div>

                <div className="flex items-end justify-between mt-auto relative z-10">
                    <div className="flex items-center text-[13px] md:text-[15px] font-bold text-gray-900 truncate tracking-tight gap-1.5">
                        {payType && (
                            <span className={`shrink-0 text-white text-[10px] md:text-[11px] px-1.5 py-0.5 rounded-sm shadow-sm ${
                                isImpact ? config.bg : 'bg-[#805ad5]'
                            }`}>
                                {payType}
                            </span>
                        )}
                        <span className={`text-gray-800 ${isCyber ? 'text-white' : ''}`}>
                            {payAmount}
                        </span>
                    </div>
                    <div className={`shrink-0 flex items-center border px-1.5 py-0.5 rounded-sm text-[10px] md:text-[11px] font-bold shadow-sm ${
                        isCyber ? 'bg-cyan-900 text-cyan-200 border-cyan-700' : 'bg-gray-50 text-gray-600 border-gray-300'
                    }`}>
                        <span className="mr-1 pt-0.5">🥈</span>
                        2회 180일
                    </div>
                </div>
                
                {/* [라벨 배지] */}
                {isImpact && (
                    <div className="absolute top-0 right-0 z-20">
                        <div className={`flex items-center justify-center text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg min-w-[50px] shadow-sm ${config.bg}`}>
                            <Icon className="w-2.5 h-2.5 mr-0.5" />
                            {config.label}
                        </div>
                    </div>
                )}
                
                <div className={`absolute inset-0 border rounded-lg pointer-events-none transition-colors z-30 ${
                    isImpact ? config.border : 'border-gray-200 group-hover:border-purple-700'
                }`} />
            </Link>
        </div>
    );
}
