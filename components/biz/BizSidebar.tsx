'use client';

import { usePathname } from 'next/navigation';
import { LayoutDashboard, Megaphone, Coins, Users, Building2 } from 'lucide-react';
import { SidebarNav, SidebarSection } from '@/components/layout/SidebarNav';

const sections: SidebarSection[] = [
    {
        items: [
            { id: '/biz', label: '대시보드', icon: LayoutDashboard, href: '/biz' },
            { id: '/biz/ads', label: '구인·광고 관리', icon: Megaphone, href: '/biz/ads' },
            { id: '/biz/points', label: '포인트 관리', icon: Coins, href: '/biz/points' },
            { id: '/biz/seekers', label: '지원자 관리', icon: Users, href: '/biz/seekers' },
            { id: '/biz/profile', label: '업체 정보', icon: Building2, href: '/biz/profile' },
        ],
    },
];

export function BizSidebar() {
    const pathname = usePathname();

    const activeId = pathname === '/biz'
        ? '/biz'
        : sections[0].items.find(item => item.href && item.href !== '/biz' && pathname.startsWith(item.href))?.id || '/biz';

    return (
        <SidebarNav
            title="업체 관리"
            sections={sections}
            activeId={activeId}
            footerLink={{ href: '/', label: '메인으로' }}
        />
    );
}
