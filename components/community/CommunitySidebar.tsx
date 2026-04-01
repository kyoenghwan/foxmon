'use client';

import { MessageSquare, ShoppingBag, Store, Star, Lightbulb, AlertTriangle, Users } from 'lucide-react';

interface CommunityNavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface CommunitySidebarProps {
    currentTab: string;
    onTabChange: (tabId: string) => void;
}

const sections = [
    {
        title: '전체 공개',
        items: [
            { id: 'free', label: '자유게시판', icon: Users },
        ] as CommunityNavItem[],
    },
    {
        title: '여성 회원 전용',
        items: [
            { id: 'foxtalk', label: '폭스수다', icon: MessageSquare },
            { id: 'foxmarket', label: '폭스중고', icon: ShoppingBag },
            { id: 'reviews', label: '업소후기', icon: Star },
            { id: 'tips', label: '꿀팁·노하우', icon: Lightbulb },
            { id: 'report', label: '업소제보', icon: AlertTriangle },
        ] as CommunityNavItem[],
    },
    {
        title: '사업자 전용',
        items: [
            { id: 'business', label: '업소장터', icon: Store },
        ] as CommunityNavItem[],
    },
];

export function CommunitySidebar({ currentTab, onTabChange }: CommunitySidebarProps) {
    return (
        <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 text-center">
                <span className="text-xl font-black text-gray-900">커뮤니티</span>
            </div>

            {sections.map((section, idx) => (
                <div key={section.title}>
                    {/* 섹션 구분선 */}
                    {idx > 0 && <div className="border-t border-gray-100" />}
                    
                    {/* 섹션 타이틀 */}
                    <div className="px-4 pt-3 pb-1">
                        <span className="text-[11px] font-black text-gray-400 tracking-wider">
                            {section.title}
                        </span>
                    </div>

                    <div className="px-2.5 pb-2 space-y-0.5">
                        {section.items.map((item) => {
                            const isActive = currentTab === item.id;
                            const Icon = item.icon;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onTabChange(item.id)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group text-left
                                        ${isActive
                                            ? 'bg-orange-50 text-primary'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                    `}
                                >
                                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                    <span className={`text-[14px] font-bold ${isActive ? 'text-primary' : ''}`}>
                                        {item.label}
                                    </span>
                                    {isActive && (
                                        <span className="ml-auto w-1.5 h-1.5 bg-primary rounded-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </nav>
    );
}
