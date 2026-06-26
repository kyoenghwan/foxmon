'use client';

import { usePathname } from 'next/navigation';
import { LayoutDashboard, Megaphone, Coins, Users, Building2, Briefcase, ImageIcon } from 'lucide-react';
import { SidebarNav, SidebarSection } from '@/components/layout/SidebarNav';
import Link from 'next/link';

const sections: SidebarSection[] = [
    {
        items: [
            { id: '/biz', label: '대시보드', icon: LayoutDashboard, href: '/biz' },
            { id: '/biz/profile', label: '업체 정보', icon: Building2, href: '/biz/profile' },
            { id: '/biz/banners', label: '배너 관리', icon: ImageIcon, href: '/biz/banners' },
            { id: '/biz/ads', label: '광고 관리', icon: Megaphone, href: '/biz/ads' },
            { id: '/biz/jobs', label: '구인 관리', icon: Briefcase, href: '/biz/jobs' },
            { id: '/biz/points', label: '포인트 관리', icon: Coins, href: '/biz/points' },
        ],
    },
];

export function BizSidebar({ isMobile = false }: { isMobile?: boolean }) {
    const pathname = usePathname();

    const activeId = pathname === '/biz'
        ? '/biz'
        : sections[0].items.find(item => item.href && item.href !== '/biz' && pathname.startsWith(item.href))?.id || '/biz';

    
    if (isMobile) {
        // 대시보드, 업체 정보, 배너 관리, 광고 관리, 구인 관리, 포인트 관리
        const mobileItems = sections[0].items;

        return (
            <div className="w-full bg-white">
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

