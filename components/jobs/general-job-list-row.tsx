'use client';

import Link from 'next/link';

interface GeneralJobListRowProps {
    company: string;
    title: string;
    location: string;
    pay: string;
    time: string;
}

export function GeneralJobListRow({ company, title, location, pay, time }: GeneralJobListRowProps) {
    // Extract short location
    const shortLocation = location.split(' ').slice(0, 2).join(' ') || location;

    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors bg-white">
            <td className="py-3 px-2 md:px-4 text-[12px] text-gray-600 font-medium whitespace-nowrap text-center">
                {shortLocation}
            </td>
            <td className="py-3 px-2 md:px-4">
                <Link href="#" className="flex items-center gap-2 group">
                    <span className="text-[14px] font-bold text-gray-900 group-hover:text-primary transition-colors max-w-[150px] sm:max-w-[200px] md:max-w-md lg:max-w-lg truncate">
                        {title}
                    </span>
                </Link>
            </td>
            <td className="py-3 px-2 md:px-4 text-[12px] text-gray-500 font-medium text-center whitespace-nowrap truncate max-w-[80px] md:max-w-[120px]">
                {company}
            </td>
            <td className="py-3 px-2 md:px-4 text-[12px] text-gray-600 font-medium text-center whitespace-nowrap hidden md:table-cell">
                여자
            </td>
            <td className="py-3 px-2 md:px-4 text-[12px] md:text-[13px] font-black text-gray-900 whitespace-nowrap text-center">
                {pay}
            </td>
            <td className="py-3 px-2 md:px-4 text-[12px] text-gray-500 font-medium whitespace-nowrap text-center hidden sm:table-cell">
                {time}
            </td>
        </tr>
    );
}
