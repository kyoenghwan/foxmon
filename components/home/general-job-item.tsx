'use client';

import { MapPin, Clock } from 'lucide-react';
import Link from 'next/link';

interface GeneralJobItemProps {
    company: string;
    title: string;
    location: string;
    pay: string;
    time: string;
    id: string;
}

export function GeneralJobItem({ company, title, location, pay, time, id }: GeneralJobItemProps) {
    return (
        <div className="w-full aspect-[2/1] group transition-all">
            <Link href={`/jobs/${id}`} className="flex flex-col rounded-lg border border-gray-100 bg-white hover:border-primary/30 hover:shadow-sm transition-all h-full p-2.5 md:p-3">
                <div className="flex flex-col h-full w-full relative z-10 p-0">
                    {/* --- [상단: 상호명 50%, 지역 50%] --- */}
                    <div className="flex w-full h-[50%] gap-2 pb-1.5">
                        {/* 상호명 영역 (1:1 비율 왼쪽) */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <span className="font-bold text-[13px] sm:text-[14px] lg:text-[15px] text-primary truncate tracking-tight">
                                {company}
                            </span>
                        </div>
                        {/* 지역 영역 (1:1 비율 오른쪽) */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center items-end text-right">
                            <div className="flex items-center gap-1 text-[11px] sm:text-[12px] text-gray-500 truncate tracking-tight">
                                <span className="shrink-0 text-gray-400 border border-gray-200 px-1 py-[1px] leading-none bg-gray-50 mr-0.5 rounded-[2px] font-bold">
                                    {location.split(' ')[0] || '전국'}
                                </span>
                                <span className="truncate font-medium">{location.split(' ').slice(1).join(' ') || location}</span>
                            </div>
                        </div>
                    </div>

                    {/* --- [하단: 가로 줄, 광고글, 급여/시간] --- */}
                    <div className="flex flex-col w-full h-[50%] pt-1.5 sm:pt-2 border-t border-dashed border-gray-200 justify-between">
                        {/* 광고글 (멘트) */}
                        <div className="w-full relative overflow-hidden">
                            <h4 className="font-bold text-[11px] sm:text-[12px] lg:text-[13px] text-gray-800 line-clamp-1 leading-[1.3] group-hover:text-primary transition-colors tracking-tight">
                                {title}
                            </h4>
                        </div>

                        {/* 급여 및 등록시간 */}
                        <div className="flex items-end justify-between mt-auto w-full pb-0.5">
                            <div className="text-[13px] sm:text-[14px] lg:text-[15px] font-black text-[#e53e3e] truncate tracking-tight">
                                {pay} <span className="text-[#e53e3e] text-[10px] md:text-[11px] font-black pb-[1px] ml-0.5">↑</span>
                            </div>
                            <div className="flex items-center text-[9px] sm:text-[10px] lg:text-[11px] text-gray-400 whitespace-nowrap">
                                <Clock className="w-2.5 h-2.5 mr-0.5" /> {time}
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
