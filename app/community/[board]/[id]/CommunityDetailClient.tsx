'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CommunitySidebar } from '@/components/community/CommunitySidebar';

const TABS = [
    { id: 'free', label: '자유게시판' },
    { id: 'foxtalk', label: '폭스수다' },
    { id: 'foxmarket', label: '폭스중고' },
    { id: 'reviews', label: '업소후기' },
    { id: 'tips', label: '꿀팁·노하우' },
    { id: 'report', label: '업소제보' },
    { id: 'business', label: '업소장터' },
    { id: 'notice', label: '공지사항' },
    { id: 'event', label: '이벤트' }
];

export function CommunityDetailClient({ 
    activeTab, 
    children 
}: { 
    activeTab: string;
    children: React.ReactNode;
}) {
    const router = useRouter();

    const handleTabChange = (tabId: string) => {
        router.push(`/community?tab=${tabId}`);
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* [Mobile Only] 상단 가로 스크롤 탭 내비게이션 (모바일에서는 상세 페이지에서도 탭을 통해 다른 게시판으로 이동 가능하도록) */}
            <div className="w-full md:hidden bg-white sticky top-[130px] z-20 border-b border-gray-100 overflow-x-auto scrollbar-hide shadow-sm">
                <div className="flex px-4 py-2.5 gap-2 w-max">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* [Desktop Only] 좌측 사이드바 */}
            <div className="w-52 shrink-0 sticky top-[130px] hidden md:block">
                <CommunitySidebar currentTab={activeTab} onTabChange={handleTabChange} />
            </div>

            {/* 우측 게시판 콘텐츠 (상세 페이지 등) */}
            <div className="flex-1 min-w-0 w-full space-y-4">
                {children}
            </div>
        </div>
    );
}
