'use client';

import { Badge } from '@/components/ui/badge';
import { MapPin, Zap } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';

interface SpecialJobCardProps {
    company: string;
    title: string;
    location: string;
    pay: string;
    color?: string; // e.g., 'blue', 'orange', 'purple'
    isBig?: boolean;
    id: string;
    image?: string;
}

export function SpecialJobCard({ company, title, location, pay, color = 'orange', isBig, id, image }: SpecialJobCardProps) {
    const { t } = useLanguage();
    const colorSchemes: Record<string, string> = {
        orange: 'bg-gradient-to-br from-orange-50/80 to-white border-orange-100 hover:border-orange-400 text-orange-600',
        blue: 'bg-gradient-to-br from-blue-50/80 to-white border-blue-100 hover:border-blue-400 text-blue-600',
        purple: 'bg-gradient-to-br from-purple-50/80 to-white border-purple-100 hover:border-purple-400 text-purple-600',
        emerald: 'bg-gradient-to-br from-emerald-50/80 to-white border-emerald-100 hover:border-emerald-400 text-emerald-600',
    };

    const scheme = colorSchemes[color] || colorSchemes.orange;

    // 업체명에 포함된 괄호 업종 분리
    let displayName = company;
    let category = '유흥';
    if (company.includes('(') && company.includes(')')) {
        const match = company.match(/(.*)\((.*)\)/);
        if (match) {
            displayName = match[1].trim();
            category = match[2].trim();
        }
    }

    // 급여 포맷팅
    let payType = '';
    let payAmount = pay;
    if (pay.includes(']') && pay.startsWith('[')) {
        const parts = pay.split(']');
        payType = parts[0].replace('[', '').trim();
        payAmount = parts[1].trim();
    }

    return (
        <div className="w-full aspect-[2/1] group transition-all">
            <Link href={`/jobs/${id}`} className={`relative block rounded-lg border-2 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-full p-2.5 md:p-3 flex flex-col justify-between ${scheme}`}>
            
            <div className="flex flex-col h-full w-full relative z-10 p-0">
                {/* --- [상단: 로고 50%, 상호명 50%] --- */}
                <div className="flex w-full h-[50%] gap-2 pb-1.5">
                    {/* 로고 영역 (1:1 비율 왼쪽) */}
                    <div className="flex-1 min-w-0 bg-white/60 flex items-center justify-center rounded-sm border border-black/5 overflow-hidden shrink-0">
                        {image ? (
                            <div 
                                className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105"
                                style={{ backgroundImage: `url(${image})` }} 
                            />
                        ) : (
                            <div className="text-current/40 font-black text-[10px] sm:text-[11px] w-full h-full flex items-center justify-center tracking-widest text-center leading-[1.1]">NO<br/>LOGO</div>
                        )}
                    </div>
                    
                    {/* 상호명 영역 (1:1 비율 오른쪽) */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5 mt-[-2px]">
                        <h3 className="font-bold text-[13px] sm:text-[14px] lg:text-[15px] text-gray-900 truncate tracking-tight group-hover:text-current transition-colors line-clamp-2 leading-tight">
                            {displayName}
                        </h3>
                        <div className="flex flex-wrap items-center text-[10px] sm:text-[11px] text-gray-500 truncate tracking-tight mt-1">
                            <span className="shrink-0 text-current border border-current/30 px-1 py-[1px] leading-none bg-white/50 mr-1.5 rounded-[2px] font-bold">
                                {location.split(' ')[0] || '전국'}
                            </span>
                            <span className="truncate font-medium">{location.split(' ').slice(1).join(' ') || location}</span>
                        </div>
                    </div>
                </div>

                {/* --- [하단: 가로 줄, 광고글, 급여/등급] --- */}
                <div className="flex flex-col w-full h-[50%] pt-1.5 sm:pt-2 border-t border-dashed border-current/20 justify-between">
                    {/* 광고글 (멘트) */}
                    <div className="w-full relative overflow-hidden">
                        <p className="text-[11px] sm:text-[12px] lg:text-[13px] text-gray-800 line-clamp-1 leading-[1.3] font-bold tracking-tight bg-white/60 inline-block px-1 rounded-[2px]">
                            {title}
                        </p>
                    </div>

                    {/* 급여 및 뱃지 */}
                    <div className="flex items-end justify-between mt-auto w-full pb-0.5">
                        <div className="flex items-center text-[13px] sm:text-[14px] lg:text-[15px] font-bold text-gray-900 truncate tracking-tight gap-1 sm:gap-1.5">
                            {payType && (
                                <span className="shrink-0 bg-gray-800 text-white text-[9px] sm:text-[10px] lg:text-[11px] px-1 sm:px-1.5 py-[1px] sm:py-0.5 rounded-sm shadow-sm">
                                    {payType}
                                </span>
                            )}
                            <span className="text-[#e53e3e]">
                                {payAmount}
                            </span>
                        </div>
                        <div className="shrink-0 flex items-center px-1 sm:px-1.5 py-[1px] sm:py-0.5 rounded-sm text-[9px] sm:text-[10px] lg:text-[11px] font-black shadow-sm bg-white border border-current/20 text-current">
                            <Zap className="w-[10px] h-[10px] sm:w-3 sm:h-3 justify-center mr-0.5 sm:mr-1 fill-current" /> 스페셜
                        </div>
                    </div>
                </div>
            </div>
            
            </Link>
        </div>
    );
}
