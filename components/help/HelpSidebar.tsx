'use client';

import { usePathname } from 'next/navigation';
import { Bell, HelpCircle, MessageCircle } from 'lucide-react';
import { SidebarNav, SidebarSection } from '@/components/layout/SidebarNav';

const sections: SidebarSection[] = [
    {
        items: [
            { id: '/help', label: '공지사항', icon: Bell, href: '/help' },
            { id: '/help/faq', label: '자주 묻는 질문', icon: HelpCircle, href: '/help/faq' },
            { id: '/help/inquiry', label: '1:1 문의', icon: MessageCircle, href: '/help/inquiry' },
        ],
    },
];

export function HelpSidebar() {
    const pathname = usePathname();

    // 정확한 경로 매칭: /help는 exact, 나머지는 startsWith
    const activeId = pathname === '/help' 
        ? '/help' 
        : sections[0].items.find(item => item.href && item.href !== '/help' && pathname.startsWith(item.href))?.id || '/help';

    return (
        <SidebarNav
            title="고객센터"
            sections={sections}
            activeId={activeId}
        />
    );
}
