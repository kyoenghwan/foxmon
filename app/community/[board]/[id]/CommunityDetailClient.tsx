'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    getVisibleCommunityBoards,
    getCommunitySidebarSections,
    canAccessCommunityBoard,
    getBoardAccessDeniedMessage,
} from '@/lib/community-boards';

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
    const sidebarSections = useMemo(() => getCommunitySidebarSections(userRole), [userRole]);

    const handleTabChange = (tabId: string) => {
        if (!canAccessCommunityBoard(tabId, userRole)) {
            alert(getBoardAccessDeniedMessage(tabId));
            return;
        }
        router.push(`/community?tab=${tabId}`);
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* 상단 메뉴 — 목록 페이지와 동일한 가로 칩 스타일 */}
            <div className="w-full bg-white sticky top-[130px] z-20 border-b border-gray-100 shadow-sm space-y-3 px-2 sm:px-4 py-3 sm:py-4">
                {sidebarSections.map((section) => {
                    let theme = 'all';
                    if (section.title.includes('여성')) theme = 'women';
                    if (section.title.includes('업소')) theme = 'employer';

                    return (
                        <div key={section.title} className="space-y-1.5">
                            <p className="text-[10px] sm:text-[11px] font-black text-gray-400 px-0.5 sm:px-1">
                                {section.title}
                            </p>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {section.items.map((item) => {
                                    const isActive = activeTab === item.id;

                                    let btnClass = '';
                                    if (isActive) {
                                        if (theme === 'women') {
                                            btnClass = 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md shadow-pink-500/20';
                                        } else if (theme === 'employer') {
                                            btnClass = 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20';
                                        } else {
                                            btnClass = 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20';
                                        }
                                    } else {
                                        if (theme === 'women') {
                                            btnClass = 'bg-pink-50/20 text-pink-700 border border-pink-100/70 hover:bg-pink-50/80';
                                        } else if (theme === 'employer') {
                                            btnClass = 'bg-amber-50/20 text-amber-800 border border-amber-100/70 hover:bg-amber-50/80';
                                        } else {
                                            btnClass = 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100';
                                        }
                                    }

                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleTabChange(item.id)}
                                            className={`min-h-[30px] sm:min-h-[36px] px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-lg sm:rounded-full text-[10px] sm:text-[13px] font-bold transition-all whitespace-nowrap ${btnClass}`}
                                        >
                                            {item.label}
                                        </button>
                                    );
                                })}
                                {theme === 'all' && (
                                    <button
                                        type="button"
                                        onClick={() => window.dispatchEvent(new CustomEvent('open_play_modal'))}
                                        className="min-h-[30px] sm:min-h-[36px] px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-lg sm:rounded-full text-[10px] sm:text-[13px] font-bold transition-all whitespace-nowrap bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 shadow-sm"
                                    >
                                        🎮 여우들의 놀이터
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 콘텐츠 영역 */}
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );
}
