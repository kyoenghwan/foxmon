'use client';

import { useLanguage } from '@/components/providers/language-provider';
import Link from 'next/link';

const industries = [
    { id: 'karaoke', nameKo: '노래주점', nameEn: 'Karaoke' },
    { id: 'danran', nameKo: '단란주점', nameEn: 'Danran Bar' },
    { id: 'cafe-bar', nameKo: '카페/BAR', nameEn: 'Cafe/BAR' },
    { id: 'room-salon', nameKo: '룸싸롱', nameEn: 'Room Salon' },
    { id: 'tenpro', nameKo: '텐프로/쩜오', nameEn: 'Premium Salon (Tenpro)' },
    { id: 'dabang', nameKo: '다방', nameEn: 'Dabang (Tea House)' },
    { id: 'yojung', nameKo: '요정', nameEn: 'Traditional Gisaeng House' },
    { id: 'etc', nameKo: '기타', nameEn: 'Etc' },
];

export function IndustrySelector() {
    const { language } = useLanguage();

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {industries.map((industry) => (
                <Link
                    key={industry.id}
                    href={`?industry=${industry.id}`}
                    className="flex items-center justify-center p-2 rounded-lg border border-gray-100 hover:border-primary/50 hover:bg-primary/5 transition-all group text-center"
                >
                    <span className="text-sm font-medium text-gray-700 group-hover:text-primary group-hover:font-bold">
                        {language === 'KO' ? industry.nameKo : industry.nameEn}
                    </span>
                </Link>
            ))}
        </div>
    );
}
