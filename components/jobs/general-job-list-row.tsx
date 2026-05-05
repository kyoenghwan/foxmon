'use client';

import Link from 'next/link';
import { AdItem } from '@/lib/ad-service';

export function GeneralJobListRow(job: AdItem) {
    const { company, title, location, pay, time, option_bold, option_color_value, option_highlight_value, option_general_icons } = job;
    
    // 지역 축약
    const shortLocation = location?.split(' ').slice(0, 2).join(' ') || location || '지역무관';
    const hasIcons = option_general_icons && option_general_icons.length > 0;

    return (
        <Link href="#" className="block w-full border-b border-gray-100 bg-white hover:bg-gray-50/80 transition-colors p-4 md:px-6 group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                {/* 1. 좌측 (모바일: 지역 - 닉네임) / (PC: 지역) */}
                <div className="flex items-center justify-between md:w-[130px] md:shrink-0 md:justify-start">
                    <span className="text-[12px] md:text-[13px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] border border-gray-200">
                        {shortLocation}
                    </span>
                    <span className="text-[12px] text-gray-400 font-medium md:hidden truncate max-w-[100px]">
                        {company}
                    </span>
                </div>

                {/* 2. 중앙 내용 (아이콘 + 제목) */}
                <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                    {/* 상단: 아이콘 배지 라인 */}
                    {hasIcons && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {option_general_icons?.map((icon, idx) => (
                                <span key={idx} className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-white text-gray-700 border border-gray-300 shadow-sm whitespace-nowrap">
                                    {icon}
                                </span>
                            ))}
                        </div>
                    )}
                    
                    {/* 하단: 채용 제목 라인 */}
                    <div className="truncate w-full mt-0.5">
                        <span 
                            className={`text-[15px] md:text-[16px] truncate tracking-tight transition-colors ${option_bold ? 'font-black' : 'font-bold'} ${!option_color_value && !option_highlight_value ? 'text-gray-900 group-hover:text-primary' : ''}`}
                            style={{
                                color: option_color_value || undefined,
                                backgroundColor: option_highlight_value || undefined,
                                padding: option_highlight_value ? '0 4px' : undefined,
                            }}
                        >
                            {title}
                        </span>
                    </div>
                </div>

                {/* 3. 우측 (모바일: 급여 크게) / (PC: 닉네임 + 급여) */}
                <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center md:w-[150px] shrink-0 gap-1 mt-1 md:mt-0">
                    <span className="text-[13px] md:text-[12px] text-gray-400 font-medium hidden md:block truncate max-w-[130px]">
                        {company}
                    </span>
                    <span className="text-[16px] md:text-[17px] font-black text-[#ff3b30] tracking-tighter">
                        {pay}
                    </span>
                </div>
            </div>
        </Link>
    );
}
