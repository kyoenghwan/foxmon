'use client';

import { usePathname } from 'next/navigation';
import { LayoutDashboard, Megaphone, Coins, Users, Building2, Briefcase } from 'lucide-react';
import { SidebarNav, SidebarSection } from '@/components/layout/SidebarNav';
import Link from 'next/link';

const sections: SidebarSection[] = [
    {
        items: [
            { id: '/biz', label: '대시보드', icon: LayoutDashboard, href: '/biz' },
            { id: '/biz/ads', label: '광고 관리', icon: Megaphone, href: '/biz/ads' },
            { id: '/biz/jobs', label: '구인 관리', icon: Briefcase, href: '/biz/jobs' },
            { id: '/biz/points', label: '포인트 관리', icon: Coins, href: '/biz/points' },
            { id: '/biz/seekers', label: '지원자 관리', icon: Users, href: '/biz/seekers' },
            { id: '/biz/profile', label: '업체 정보', icon: Building2, href: '/biz/profile' },
        ],
    },
];

export function BizSidebar({ isMobile = false }: { isMobile?: boolean }) {
    const pathname = usePathname();

    const activeId = pathname === '/biz'
        ? '/biz'
        : sections[0].items.find(item => item.href && item.href !== '/biz' && pathname.startsWith(item.href))?.id || '/biz';

    
    if (isMobile) {
        // 사용자가 요청한 3줄 순서로 재배열
        // 1줄: 대시보드(0), 업체 정보(5)
        // 2줄: 광고 관리(1), 구인 관리(2)
        // 3줄: 포인트 관리(3), 지원자 관리(4)
        const mobileItems = [
            sections[0].items[0],
            sections[0].items[5],
            sections[0].items[1],
            sections[0].items[2],
            sections[0].items[3],
            sections[0].items[4],
        ];

        return (
            <div className="w-full bg-white py-1">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                    {mobileItems.map((item) => {
                        const isActive = activeId === item.id || activeId === item.href;
                        return (
                            <Link
                                key={item.id}
                                href={item.href || '#'}
                                className={`px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all text-center ${
                                    isActive
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <SidebarNav
            title="업체 관리"
            sections={sections}
            activeId={activeId}
            footerLink={{ href: '/', label: '메인으로' }}
        />
    );
}
