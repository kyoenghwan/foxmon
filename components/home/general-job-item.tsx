'use client';

import { MapPin, Clock } from 'lucide-react';
import Link from 'next/link';

interface GeneralJobItemProps {
    company: string;
    title: string;
    location: string;
    pay: string;
    time: string;
}

export function GeneralJobItem({ company, title, location, pay, time }: GeneralJobItemProps) {
    return (
        <Link href="#" className="flex flex-col p-3 rounded-lg border border-gray-100 bg-white hover:border-primary/30 hover:shadow-sm transition-all h-full">
            <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold text-primary truncate max-w-[80px]">{company}</span>
                <span className="text-[9px] text-gray-400 whitespace-nowrap">{time}</span>
            </div>

            <h4 className="font-bold text-gray-800 text-[11px] line-clamp-1 mb-2 leading-tight group-hover:text-primary">
                {title}
            </h4>

            <div className="mt-auto flex flex-col gap-1">
                <div className="flex items-center gap-1 text-[9px] text-gray-500">
                    <MapPin className="w-2.5 h-2.5" />
                    <span className="truncate">{location}</span>
                </div>
                <div className="text-[12px] font-black text-gray-900">
                    {pay}
                </div>
            </div>
        </Link>
    );
}
