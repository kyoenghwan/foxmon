'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import type { PublicNotice } from '@/lib/actions/help';
import { incrementNoticeViewCount } from '@/lib/actions/help';
import { MarkdownContent } from '@/components/help/MarkdownContent';

const tabs = ['전체', '공지', '이벤트', '기타'] as const;
export type NoticeTab = (typeof tabs)[number];

export function NoticePageClient({
    initialNotices,
    initialTab = '전체',
}: {
    initialNotices: PublicNotice[];
    initialTab?: string;
}) {
    const resolvedTab = tabs.includes(initialTab as NoticeTab) ? initialTab : '전체';
    const [activeTab, setActiveTab] = useState(resolvedTab);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [viewCounts, setViewCounts] = useState<Record<string, number>>(() =>
        Object.fromEntries(initialNotices.map((n) => [n.id, n.view_count]))
    );

    const filtered = initialNotices.filter(
        (n) => activeTab === '전체' || n.category === activeTab
    );
    const pinned = filtered.filter((n) => n.is_pinned);
    const normal = filtered.filter((n) => !n.is_pinned);

    const toggleExpand = async (notice: PublicNotice) => {
        const next = expandedId === notice.id ? null : notice.id;
        setExpandedId(next);
        if (next === notice.id) {
            const res = await incrementNoticeViewCount(notice.id);
            if (res.success && res.view_count != null) {
                setViewCounts((prev) => ({ ...prev, [notice.id]: res.view_count! }));
            }
        }
    };

    const vc = (id: string, fallback: number) => viewCounts[id] ?? fallback;

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    {activeTab === '이벤트' ? '이벤트' : '공지사항'}
                </h2>
                {activeTab === '이벤트' && (
                    <p className="text-[12px] text-gray-500 font-medium mt-1">
                        프로모션·참여 이벤트 안내는 고객센터에서 확인합니다.
                    </p>
                )}
            </div>

            <div className="flex items-center gap-0 border-b border-gray-200 w-full">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 sm:flex-none px-5 sm:px-6 py-2.5 text-[13px] sm:text-[14px] font-bold border-b-2 transition-all -mb-px whitespace-nowrap text-center ${
                            activeTab === tab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <p className="text-[13px] text-gray-500 font-medium">
                Total <strong className="text-gray-900">{filtered.length}</strong>건
            </p>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-[50px_1fr_80px] md:grid-cols-[60px_1fr_80px_100px_80px] bg-gray-50 border-b border-gray-200 text-[12px] font-black text-gray-500">
                    <div className="px-2 md:px-3 py-3 text-center">번호</div>
                    <div className="px-3 py-3">제목</div>
                    <div className="px-3 py-3 text-center hidden md:block">이름</div>
                    <div className="px-2 md:px-3 py-3 text-center">날짜</div>
                    <div className="px-3 py-3 text-center hidden md:block">조회</div>
                </div>

                {pinned.map((notice) => (
                    <React.Fragment key={notice.id}>
                        <div
                            onClick={() => toggleExpand(notice)}
                            className="grid grid-cols-[50px_1fr_80px] md:grid-cols-[60px_1fr_80px_100px_80px] border-b border-gray-100 bg-orange-50/30 hover:bg-orange-50 transition-colors cursor-pointer"
                        >
                            <div className="px-2 md:px-3 py-3 text-center flex items-center justify-center">
                                <span className="inline-block px-1.5 md:px-2 py-0.5 bg-red-500 text-white text-[9px] md:text-[10px] font-black rounded">알림</span>
                            </div>
                            <div className="px-3 py-3 text-[13px] md:text-[14px] font-bold text-gray-900 flex items-center gap-2">
                                <span className="text-primary font-black text-[11px] md:text-[12px] shrink-0">{notice.category}</span>
                                <span className="truncate">{notice.title}</span>
                            </div>
                            <div className="px-3 py-3 text-center text-[13px] text-gray-500 hidden md:flex items-center justify-center">{notice.author_name}</div>
                            <div className="px-2 md:px-3 py-3 text-center text-[11px] md:text-[13px] text-gray-500 flex items-center justify-center whitespace-nowrap">{notice.created_at}</div>
                            <div className="px-3 py-3 text-center text-[13px] text-gray-700 font-bold hidden md:flex items-center justify-center">{vc(notice.id, notice.view_count).toLocaleString()}</div>
                        </div>
                        {expandedId === notice.id && (
                            <div className="bg-orange-50/10 p-6 border-b border-gray-200 animate-in fade-in slide-in-from-top-2">
                                {notice.content_format !== 'html' ? (
                                    <MarkdownContent content={notice.content} />
                                ) : (
                                    <div
                                        className="text-[14px] text-gray-800 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: notice.content }}
                                    />
                                )}
                            </div>
                        )}
                    </React.Fragment>
                ))}

                {normal.map((notice, idx) => (
                    <React.Fragment key={notice.id}>
                        <div
                            onClick={() => toggleExpand(notice)}
                            className="grid grid-cols-[50px_1fr_80px] md:grid-cols-[60px_1fr_80px_100px_80px] border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <div className="px-2 md:px-3 py-3 text-center text-[12px] md:text-[13px] text-gray-500 font-medium flex items-center justify-center">{normal.length - idx}</div>
                            <div className="px-3 py-3 text-[13px] md:text-[14px] text-gray-800 flex items-center gap-2">
                                <span className="text-gray-400 text-[11px] md:text-[12px] font-bold shrink-0">{notice.category}</span>
                                <span className={`truncate ${expandedId === notice.id ? 'font-bold text-primary' : ''}`}>{notice.title}</span>
                            </div>
                            <div className="px-3 py-3 text-center text-[13px] text-gray-500 hidden md:flex items-center justify-center">{notice.author_name}</div>
                            <div className="px-2 md:px-3 py-3 text-center text-[11px] md:text-[13px] text-gray-500 flex items-center justify-center whitespace-nowrap">{notice.created_at}</div>
                            <div className="px-3 py-3 text-center text-[13px] text-gray-700 font-bold hidden md:flex items-center justify-center">{vc(notice.id, notice.view_count).toLocaleString()}</div>
                        </div>
                        {expandedId === notice.id && (
                            <div className="bg-gray-50/50 p-6 border-b border-gray-200 animate-in fade-in slide-in-from-top-2">
                                {notice.content_format !== 'html' ? (
                                    <MarkdownContent content={notice.content} />
                                ) : (
                                    <div
                                        className="text-[14px] text-gray-800 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: notice.content }}
                                    />
                                )}
                            </div>
                        )}
                    </React.Fragment>
                ))}

                {filtered.length === 0 && (
                    <div className="py-16 text-center text-gray-400 text-[14px] font-medium">
                        등록된 공지가 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
}
