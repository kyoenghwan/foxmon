'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CommunitySidebar } from '@/components/community/CommunitySidebar';
import { Pencil } from 'lucide-react';

interface BoardTab {
    id: string;
    label: string;
    prefix: string;
}

const TABS: BoardTab[] = [
    { id: 'free', label: '자유게시판', prefix: '💬자유' },
    { id: 'foxtalk', label: '폭스수다', prefix: '🦊폭스수다' },
    { id: 'foxmarket', label: '폭스중고', prefix: '🛍️폭스중고' },
    { id: 'reviews', label: '업소후기', prefix: '⭐후기' },
    { id: 'tips', label: '꿀팁·노하우', prefix: '💡꿀팁' },
    { id: 'report', label: '업소제보', prefix: '🚨제보' },
    { id: 'business', label: '업소장터', prefix: '🏪업소장터' },
];

export function CommunityClient({ activeTab: initialTab }: { activeTab: string }) {
    const [currentTab, setCurrentTab] = useState(initialTab);

    const currentBoard = TABS.find(t => t.id === currentTab) || TABS[0];

    // Dummy data generator
    const dummyImages = [
        'https://picsum.photos/seed/fox1/80/80',
        'https://picsum.photos/seed/fox2/80/80',
        'https://picsum.photos/seed/fox3/80/80',
        'https://picsum.photos/seed/fox4/80/80',
        'https://picsum.photos/seed/fox5/80/80',
    ];

    const generateDummyPosts = (boardId: string) => {
        const board = TABS.find(t => t.id === boardId);
        const prefix = board?.prefix || '💬';
        
        return Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            title: `[${prefix}] 여우몬 커뮤니티 게시글 테스트 제목입니다 ${i + 1}`,
            author: boardId === 'report' ? '익명' : `익명의 여우${i + 1}`,
            date: '2024-03-24',
            views: 120 + i * 15,
            comments: (i * 7 + 3) % 20,
            isHot: i < 3,
            thumbnail: boardId === 'foxmarket' ? dummyImages[i % dummyImages.length] : null,
        }));
    };

    const posts = generateDummyPosts(currentTab);

    return (
        <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* [Mobile Only] 상단 가로 스크롤 탭 내비게이션 */}
            <div className="w-full md:hidden overflow-x-auto scrollbar-hide bg-white sticky top-[136px] z-20 py-2 border-b">
                <div className="flex px-1 gap-1 min-w-max">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setCurrentTab(tab.id)}
                            className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all whitespace-nowrap ${
                                currentTab === tab.id
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
                <CommunitySidebar currentTab={currentTab} onTabChange={setCurrentTab} />
            </div>

            {/* 우측 게시판 콘텐츠 */}
            <div className="flex-1 min-w-0 w-full space-y-4">
                {/* 게시판 제목 + 글쓰기 버튼 */}
                <div className="flex items-center justify-between px-1 sm:px-0">
                    <h2 className="text-lg md:text-xl font-black text-gray-900">{currentBoard.label}</h2>
                    <button className="flex items-center gap-1.5 px-4 md:px-5 py-2 md:py-2.5 bg-primary text-white font-black text-[13px] md:text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-sm active:scale-95">
                        <Pencil className="w-4 h-4" />
                        글쓰기
                    </button>
                </div>

                {/* 업소제보 안내 */}
                {currentTab === 'report' && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 mx-1 sm:mx-0">
                        <span className="text-red-500 text-xl">🚨</span>
                        <div className="text-[13px] text-red-700 leading-relaxed">
                            <p className="font-bold">익명 제보 게시판</p>
                            <p className="mt-1">작성자명이 '익명'으로 표시됩니다. 임금 체불, 부당 대우 등을 안전하게 제보해주세요.</p>
                        </div>
                    </div>
                )}

                {/* 게시판 테이블 */}
                <div className="bg-white border-y md:border rounded-none md:rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#f8f8f8] border-b border-gray-200 text-[11px] md:text-[12px] font-bold text-gray-500">
                                <th className="py-3 px-2 md:px-4 text-center w-[50px] md:w-[80px]">번호</th>
                                <th className="py-3 px-3 md:px-4 text-center">제목</th>
                                <th className="py-3 px-2 md:px-4 text-center w-[90px] md:w-[120px]">작성자</th>
                                <th className="py-3 px-4 text-center w-[100px] hidden lg:table-cell">작성일</th>
                                <th className="py-3 px-4 text-center w-[80px] hidden sm:table-cell">조회수</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map((post, i) => (
                                <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors bg-white">
                                    <td className="py-3 md:py-3.5 px-1 md:px-4 text-center text-[11px] md:text-[12px] text-gray-400 font-bold">
                                        {post.isHot ? <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm shadow-sm inline-block">HOT</span> : 100 - i}
                                    </td>
                                    <td className="py-3 md:py-3.5 px-2 md:px-4">
                                        <Link href="#" className="flex items-center gap-2 md:gap-2.5 group">
                                            {post.thumbnail && (
                                                <img src={post.thumbnail} alt="" className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover shrink-0 border border-gray-100" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[13px] md:text-[14px] font-medium text-gray-900 group-hover:text-primary transition-colors block truncate">
                                                        {post.title}
                                                    </span>
                                                    {post.comments > 0 && <span className="text-[11px] md:text-[12px] font-black text-purple-600 shrink-0">[{post.comments}]</span>}
                                                    <span className="bg-orange-100 text-orange-600 text-[8px] font-black px-1 rounded-sm shrink-0">N</span>
                                                </div>
                                                {currentTab === 'foxmarket' && (
                                                    <span className="text-[11px] text-gray-400 mt-0.5 block">중고 거래 · 가격 협의</span>
                                                )}
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="py-3 md:py-3.5 px-1 md:px-4 text-center">
                                        <div className="text-[12px] md:text-[13px] text-gray-600 font-medium truncate max-w-[80px] md:max-w-[120px] mx-auto">
                                            {post.author}
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 text-center text-[12px] text-gray-400 font-medium hidden lg:table-cell">
                                        {post.date}
                                    </td>
                                    <td className="py-3.5 px-4 text-center text-[12px] text-gray-500 font-bold hidden sm:table-cell">
                                        {post.views}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-center pt-4 pb-8">
                    <div className="flex items-center gap-1">
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors text-[12px] font-bold">&lt;</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-[12px] font-black shadow-sm">1</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-[12px] font-bold">2</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-[12px] font-bold">3</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors text-[12px] font-bold">&gt;</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
