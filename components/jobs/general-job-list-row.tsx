'use client';

import { useRouter } from 'next/navigation';
import { AdItem } from '@/lib/ad-service';

export function GeneralJobListRow(job: AdItem) {
    const router = useRouter();
    const { 
        id, company, title, location, pay, time, 
        option_bold, option_color, option_color_value, 
        option_highlight, option_highlight_value, 
        option_bg, option_bg_value, option_icon, 
        option_general_icons, created_at, status 
    } = job;
    
    // 지역 축약
    const shortLocation = location?.split(' ').slice(0, 2).join(' ') || location || '지역무관';
    const hasIcons = option_general_icons && option_general_icons.length > 0;

    // 작성일
    const dateObj = created_at ? new Date(created_at) : new Date();
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    // 리스트 배경색 스타일
    const hasBg = option_bg && option_bg_value;
    const bgStyle = hasBg ? {
        backgroundColor: option_bg_value,
        borderColor: option_bg_value.replace('f', 'e'),
    } : {};

    return (
        <div 
            onClick={() => {
                if (status === 'COMPLETED') {
                    alert('구인 완료된 글입니다.');
                    return;
                }
                router.push(`/jobs/${id}`, { scroll: false });
            }}
            className={`p-4 active:scale-[0.99] transition-all border-b flex flex-col gap-2.5 cursor-pointer relative group ${
                hasBg ? 'border-l-4' : 'hover:bg-gray-50/80 border-gray-100'
            }`}
            style={bgStyle}
        >
            {/* 1행: 업체명, 지역, 급여, 등록일 */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] sm:text-[13px]">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-extrabold text-gray-900 text-[14px] sm:text-[15px] shrink-0">
                        {company}
                    </span>
                    <span className="text-gray-400 shrink-0">|</span>
                    <span className="font-bold text-gray-500 shrink-0">
                        📍 {shortLocation}
                    </span>
                    <span className="text-gray-400 shrink-0">|</span>
                    <span className="bg-red-50 text-[#ff3b30] text-[11px] font-black px-2 py-0.5 rounded-full border border-red-100/50 shrink-0">
                        {pay}
                    </span>
                    {time && (
                        <>
                            <span className="text-gray-400 shrink-0">|</span>
                            <span className="font-bold text-gray-500 shrink-0">
                                ⏱️ {time}
                            </span>
                        </>
                    )}
                </div>
                <div className="text-gray-400 font-semibold shrink-0 text-[11px] sm:text-[12px] ml-auto">
                    {dateStr}
                </div>
            </div>
            
            {/* 2행: 옵션 아이콘 배지 & 구인 공고 제목 */}
            <div className="flex flex-col gap-1.5">
                {hasIcons && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        {option_general_icons?.map((icon, idx) => (
                            <span key={idx} className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white text-gray-700 border border-gray-200 shadow-sm whitespace-nowrap">
                                {icon}
                            </span>
                        ))}
                    </div>
                )}
                <div className="flex items-start gap-2">
                    {option_icon && (
                        <span className="bg-red-500 text-white text-[10px] sm:text-[11px] font-black px-1.5 py-0.5 rounded shadow-sm shrink-0 flex items-center gap-0.5 animate-pulse mt-0.5">
                            🚨 급구
                        </span>
                    )}
                    <h3 className={`text-[14px] sm:text-[15px] leading-snug group-hover:text-primary transition-colors whitespace-pre-wrap break-all flex-1 ${option_bold ? 'font-black' : 'font-bold'}`}>
                        <span 
                            style={{
                                color: (option_color && option_color_value) ? option_color_value : undefined,
                                backgroundColor: (option_highlight && option_highlight_value) ? option_highlight_value : undefined,
                                padding: (option_highlight && option_highlight_value) ? '2px 6px' : undefined,
                                borderRadius: (option_highlight && option_highlight_value) ? '4px' : undefined,
                            }}
                            className={(!option_color_value && !option_highlight_value) ? 'text-gray-800' : ''}
                        >
                            {title}
                        </span>
                    </h3>
                </div>
            </div>
        </div>
    );
}

export function GeneralJobListRowDesktop({ job, onClick }: { job: AdItem; onClick?: () => void }) {
    const router = useRouter();
    const { 
        id, company, title, location, pay, time, 
        option_bold, option_color, option_color_value, 
        option_highlight, option_highlight_value, 
        option_bg, option_bg_value, option_icon, 
        option_general_icons, created_at, status 
    } = job;
    
    // 지역 축약
    const shortLocation = location?.split(' ').slice(0, 2).join(' ') || location || '지역무관';
    const hasIcons = option_general_icons && option_general_icons.length > 0;

    // 작성일
    const dateObj = created_at ? new Date(created_at) : new Date();
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    // 리스트 배경색 스타일
    const hasBg = option_bg && option_bg_value;
    const bgStyle = hasBg ? {
        backgroundColor: option_bg_value,
    } : {};

    return (
        <tr 
            onClick={() => {
                if (status === 'COMPLETED') {
                    alert('구인 완료된 글입니다.');
                    return;
                }
                if (onClick) onClick();
                else router.push(`/jobs/${id}`, { scroll: false });
            }}
            className={`hover:bg-gray-50/50 transition-colors group cursor-pointer border-b ${
                hasBg ? 'border-l-4 border-l-primary' : 'border-gray-100'
            }`}
            style={bgStyle}
        >
            <td className="py-4 px-2 font-bold text-gray-800 text-center truncate max-w-[150px]">{company}</td>
            
            <td className="py-4 px-4 text-left">
                <div className="flex flex-col gap-1 min-w-0">
                    {hasIcons && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {option_general_icons?.map((icon, idx) => (
                                <span key={idx} className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white text-gray-700 border border-gray-200 shadow-sm whitespace-nowrap">
                                    {icon}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-2 truncate w-full mt-0.5">
                        {option_icon && (
                            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm shrink-0 flex items-center gap-0.5 animate-pulse">
                                🚨 급구
                            </span>
                        )}
                        <span 
                            className={`text-[15px] md:text-[16px] truncate tracking-tight transition-colors ${option_bold ? 'font-black' : 'font-bold'} ${!option_color_value && !option_highlight_value ? 'text-gray-900 group-hover:text-primary' : ''}`}
                            style={{
                                color: (option_color && option_color_value) ? option_color_value : undefined,
                                backgroundColor: (option_highlight && option_highlight_value) ? option_highlight_value : undefined,
                                padding: (option_highlight && option_highlight_value) ? '2px 6px' : undefined,
                                borderRadius: (option_highlight && option_highlight_value) ? '4px' : undefined,
                            }}
                        >
                            {title}
                        </span>
                    </div>
                </div>
            </td>

            <td className="py-4 px-2 text-gray-500 text-center">{shortLocation}</td>
            
            <td className="py-4 px-2 text-center">
                <span className="text-[15px] font-black text-[#ff3b30] tracking-tighter whitespace-nowrap">{pay}</span>
            </td>

            <td className="py-4 px-2 text-gray-400 font-medium text-center text-[13px]">{dateStr}</td>
        </tr>
    );
}
