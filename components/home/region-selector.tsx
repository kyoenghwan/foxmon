'use client';

import { useLanguage } from '@/components/providers/language-provider';
import { MapPin } from 'lucide-react';
import Link from 'next/link';

const regions = [
    { id: 'seoul', name: 'Seoul', nameKo: '서울' },
    { id: 'gyeonggi', name: 'Gyeonggi', nameKo: '경기' },
    { id: 'incheon', name: 'Incheon', nameKo: '인천' },
    { id: 'busan', name: 'Busan', nameKo: '부산' },
    { id: 'daegu', name: 'Daegu', nameKo: '대구' },
    { id: 'daejeon', name: 'Daejeon', nameKo: '대전' },
    { id: 'gwangju', name: 'Gwangju', nameKo: '광주' },
    { id: 'ulsan', name: 'Ulsan', nameKo: '울산' },
    { id: 'sejong', name: 'Sejong', nameKo: '세종' },
    { id: 'gangwon', name: 'Gangwon', nameKo: '강원' },
    { id: 'chungbuk', name: 'Chungbuk', nameKo: '충북' },
    { id: 'chungnam', name: 'Chungnam', nameKo: '충남' },
    { id: 'jeonbuk', name: 'Jeonbuk', nameKo: '전북' },
    { id: 'jeonnam', name: 'Jeonnam', nameKo: '전남' },
    { id: 'gyeongbuk', name: 'Gyeongbuk', nameKo: '경북' },
    { id: 'gyeongnam', name: 'Gyeongnam', nameKo: '경남' },
    { id: 'jeju', name: 'Jeju', nameKo: '제주' },
];

export function RegionSelector() {
    const { language } = useLanguage();

    // "전체" 항목을 포함한 지역 배열 구성
    const allRegions = [
        { id: 'all', name: 'All', nameKo: '전체' },
        ...regions
    ];

    return (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
            {allRegions.map((region) => (
                <Link
                    key={region.id}
                    href={region.id === 'all' ? '/jobs' : `/jobs?region=${region.id}`}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all group ${region.id === 'all'
                        ? 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                        : 'border-gray-100 hover:border-primary/50 hover:bg-primary/5'
                        }`}
                >
                    <span className={`text-sm font-medium group-hover:text-primary group-hover:font-bold ${region.id === 'all' ? 'text-gray-500 font-bold' : 'text-gray-700'
                        }`}>
                        {region.id === 'all' && <MapPin className="h-3 w-3 inline mr-1" />}
                        {language === 'KO' ? region.nameKo : region.name}
                    </span>
                </Link>
            ))}
        </div>
    );
}
