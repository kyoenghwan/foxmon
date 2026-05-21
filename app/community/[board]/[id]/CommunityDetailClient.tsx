'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CommunitySidebar } from '@/components/community/CommunitySidebar';
import { getVisibleCommunityBoards } from '@/lib/community-boards';

export function CommunityDetailClient({
    activeTab,
    userRole,
    children,
}: {
    activeTab: string;
    userRole?: string | null;
    children: React.ReactNode;
}) {
    const router = useRouter();
    const tabs = getVisibleCommunityBoards(userRole).map((b) => ({
        id: b.id,
        label: b.label,
    }));

    const handleTabChange = (tabId: string) => {
        router.push(`/community?tab=${tabId}`);
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full lg:hidden bg-white sticky top-[130px] z-20 border-b border-gray-100 shadow-sm px-2 py-2">
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleTabChange(tab.id)}
                            className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold ${
                                activeTab === tab.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="w-52 shrink-0 sticky top-[130px] hidden lg:block">
                <CommunitySidebar currentTab={activeTab} onTabChange={handleTabChange} userRole={userRole} />
            </div>
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );
}
