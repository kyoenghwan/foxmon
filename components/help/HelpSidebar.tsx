'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Bell, HelpCircle, MessageCircle, Gift } from 'lucide-react';
import { SidebarNav, SidebarSection } from '@/components/layout/SidebarNav';
import Link from 'next/link';

const sections: SidebarSection[] = [
    {
        items: [
            { id: '/help', label: '공지사항', icon: Bell, href: '/help' },
            { id: '/help?tab=event', label: '이벤트', icon: Gift, href: '/help?tab=event' },
            { id: '/help/faq', label: '자주 묻는 질문', icon: HelpCircle, href: '/help/faq' },
            { id: '/help/inquiry', label: '1:1 문의 / 질문답변', icon: MessageCircle, href: '/help/inquiry' },
        ],
    },
];

export function HelpSidebar({ isMobile = false }: { isMobile?: boolean }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const helpTab = searchParams.get('tab');

    const activeId =
        pathname === '/help'
            ? (helpTab === 'event' ? '/help?tab=event' : '/help')
            : sections[0].items.find(
                  (item) => item.href && item.href !== '/help' && !item.href.includes('tab=event') && pathname.startsWith(item.href.split('?')[0])
              )?.id || '/help';

    
    if (isMobile) {
        return (
            <div className="w-full bg-white py-2">
                <div className="flex flex-wrap gap-1.5">
                    {sections.flatMap(s => s.items).map((item) => {
                        const isActive = activeId === item.id || activeId === item.href;
                        return (
                            <Link
                                key={item.id}
                                href={item.href || '#'}
                                className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all whitespace-nowrap ${
                                    isActive
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
            title="고객센터"
            sections={sections}
            activeId={activeId}
        />
    );
}
