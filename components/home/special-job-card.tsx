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
}

export function SpecialJobCard({ company, title, location, pay, color = 'orange', isBig }: SpecialJobCardProps) {
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
        <Link href="#" className={`group relative block rounded-lg border-2 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${isBig ? 'h-full min-h-[260px]' : 'h-[110px] md:h-[120px]'} p-2.5 md:p-3 flex flex-col justify-between ${scheme}`}>
            
            {/* 1. 상단: 업체명/지역 (로고 없음) */}
            <div className="flex gap-2 mb-2 justify-between items-start">
                <div className="flex flex-col min-w-0 py-0.5">
                    <h3 className="font-bold text-[14px] md:text-[15px] text-gray-900 truncate tracking-tight group-hover:text-current transition-colors">
                        {displayName}
                    </h3>
                    <div className="flex items-center text-[11px] md:text-[12px] text-gray-500 truncate tracking-tight mt-0.5">
                        <span className="shrink-0 text-current border border-current/30 px-1 py-0.5 leading-none bg-white/50 mr-1.5 rounded-sm">
                            {location.split(' ')[0] || '전국'}
                        </span>
                        <span className="truncate">{location.split(' ').slice(1).join(' ') || location}</span>
                    </div>
                </div>
                <Zap className={`${isBig ? 'w-5 h-5' : 'w-3.5 h-3.5'} fill-current opacity-20 flex-shrink-0 mt-1`} />
            </div>

            {/* 2. 중단: 간단한 멘트 */}
            <div className="mb-2 flex-1 flex flex-col justify-center">
                <p className="text-[12px] md:text-[13px] text-gray-800 line-clamp-1 leading-[1.4] font-bold tracking-tight bg-white/60 inline-block w-fit px-1 rounded-sm">
                    {title}
                </p>
            </div>

            {/* 3. 하단: 급여 정보 ও 배지 */}
            <div className="flex items-end justify-between mt-auto">
                <div className="flex items-center text-[13px] md:text-[14px] font-medium text-gray-900 truncate tracking-tight gap-1.5">
                    {payType && (
                        <span className="shrink-0 bg-gray-800 text-white text-[10px] md:text-[11px] px-1.5 py-0.5 rounded-sm">
                            {payType}
                        </span>
                    )}
                    <span className="text-[#e53e3e] inline-flex items-center gap-[1px]">
                        {payAmount} <span className="text-[#e53e3e] text-[10px] md:text-[11px] font-black pb-[1px] ml-0.5">↑</span>
                    </span>
                </div>
            </div>
            
        </Link>
    );
}
