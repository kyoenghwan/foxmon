'use client';

import { MessageSquare, ShoppingBag, Store, Star, Lightbulb, AlertTriangle, Users } from 'lucide-react';
import { SidebarNav, SidebarSection } from '@/components/layout/SidebarNav';

interface CommunitySidebarProps {
    currentTab: string;
    onTabChange: (tabId: string) => void;
}

const sections: SidebarSection[] = [
    {
        title: '전체 공개',
        items: [
            { id: 'free', label: '자유게시판', icon: Users },
        ],
    },
    {
        title: '여성 회원 전용',
        items: [
            { id: 'foxtalk', label: '폭스수다', icon: MessageSquare },
            { id: 'foxmarket', label: '폭스중고', icon: ShoppingBag },
            { id: 'reviews', label: '업소후기', icon: Star },
            { id: 'tips', label: '꿀팁·노하우', icon: Lightbulb },
            { id: 'report', label: '업소제보', icon: AlertTriangle },
        ],
    },
    {
        title: '사업자 전용',
        items: [
            { id: 'business', label: '업소장터', icon: Store },
        ],
    },
];

export function CommunitySidebar({ currentTab, onTabChange }: CommunitySidebarProps) {
    return (
        <SidebarNav
            title="커뮤니티"
            sections={sections}
            activeId={currentTab}
            onItemClick={onTabChange}
        />
    );
}
