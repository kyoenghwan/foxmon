'use client';

import { useRouter } from 'next/navigation';
import { AdItem } from '@/lib/ad-service';

export function GeneralJobListRow(job: AdItem) {
    const router = useRouter();
    const { id, company, title, location, pay, time, option_bold, option_color_value, option_highlight_value, option_general_icons, created_at } = job;
    
    // 지역 축약
    const shortLocation = location?.split(' ').slice(0, 2).join(' ') || location || '지역무관';
    const hasIcons = option_general_icons && option_general_icons.length > 0;

    // 작성일
    const dateObj = created_at ? new Date(created_at) : new Date();
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    return (
        <tr 
            onClick={() => router.push(`/jobs/${id}`)}
            className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
        >
            <td className="py-3 px-2 font-bold text-gray-800 text-center truncate max-w-[150px]">{company}</td>
            
            <td className="py-3 px-4 text-left">
                <div className="flex flex-col gap-1 min-w-0">
                    {hasIcons && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {option_general_icons?.map((icon, idx) => (
                                <span key={idx} className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-white text-gray-700 border border-gray-300 shadow-sm whitespace-nowrap">
                                    {icon}
                                </span>
                            ))}
                        </div>
                    )}
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
            </td>

            <td className="py-3 px-2 text-gray-500 text-center">{shortLocation}</td>
            
            <td className="py-3 px-2 text-center">
                <span className="text-[15px] font-black text-[#ff3b30] tracking-tighter whitespace-nowrap">{pay}</span>
            </td>

            <td className="py-3 px-2 text-gray-400 font-medium text-center text-[13px]">{dateStr}</td>
        </tr>
    );
}
