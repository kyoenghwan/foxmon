'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CommunitySidebar } from '@/components/community/CommunitySidebar';
import { PostDetailModal } from '@/components/community/PostDetailModal';
import { Pencil, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface BoardTab {
    id: string;
    label: string;
    prefix: string;
}

const TABS: BoardTab[] = [
    { id: 'notice', label: '공지사항', prefix: '📢공지' },
    { id: 'event', label: '이벤트', prefix: '🎉이벤트' },
    { id: 'free', label: '자유게시판', prefix: '💬자유' },
    { id: 'foxtalk', label: '폭스수다', prefix: '🦊폭스수다' },
    { id: 'foxmarket', label: '폭스중고', prefix: '🛍️폭스중고' },
    { id: 'reviews', label: '업소후기', prefix: '⭐후기' },
    { id: 'tips', label: '꿀팁·노하우', prefix: '💡꿀팁' },
    { id: 'report', label: '업소제보', prefix: '🚨제보' },
    { id: 'business', label: '업소장터', prefix: '🏪업소장터' },
];

export function CommunityClient({ activeTab, initialPosts = [], totalPosts = 0, isLoggedIn = false }: { activeTab: string, initialPosts?: any[], totalPosts?: number, isLoggedIn?: boolean }) {
    const router = useRouter();
    const currentBoard = TABS.find(t => t.id === activeTab) || TABS[0];

    const [showWriteModal, setShowWriteModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [writeTitle, setWriteTitle] = useState('');
    const [writeContent, setWriteContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTabChange = (tabId: string) => {
        router.push(`/community?tab=${tabId}`);
    };

    const handleWriteClick = () => {
        if (!isLoggedIn) {
            if (confirm('로그인 후 이용할 수 있습니다. 로그인 페이지로 이동하시겠습니까?')) {
                router.push('/login');
            }
            return;
        }
        setShowWriteModal(true);
    };

    const handlePostClick = async (post: any) => {
        // Increment view count via server action or just open modal
        setSelectedPost(post);
    };

    const handleWriteSubmit = async () => {
        if (!writeTitle.trim() || !writeContent.trim()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }
        setIsSubmitting(true);
        try {
            const { createCommunityPost } = await import('@/lib/actions/community');
            const res = await createCommunityPost({
                board_id: activeTab,
                title: writeTitle,
                content: writeContent
            });
            if (res.success) {
                alert('게시글이 등록되었습니다.');
                setShowWriteModal(false);
                setWriteTitle('');
                setWriteContent('');
                router.refresh(); // Refresh server component
            } else {
                alert(res.message);
            }
        } catch (error) {
            alert('게시글 등록 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* [Mobile Only] 상단 가로 스크롤 탭 내비게이션 */}
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

            {/* 우측 게시판 콘텐츠 */}
            <div className="flex-1 min-w-0 w-full space-y-4">
                {/* 게시판 제목 + 글쓰기 버튼 */}
                <div className="flex items-center justify-between px-1 sm:px-0">
                    <h2 className="text-lg md:text-xl font-black text-gray-900">{currentBoard.label}</h2>
                    <button 
                        onClick={handleWriteClick}
                        className="flex items-center gap-1.5 px-4 md:px-5 py-2 md:py-2.5 bg-primary text-white font-black text-[13px] md:text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-sm active:scale-95"
                    >
                        <Pencil className="w-4 h-4" />
                        글쓰기
                    </button>
                </div>

                {/* 업소제보 안내 */}
                {activeTab === 'report' && (
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
                            {initialPosts.map((post, i) => (
                                <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors bg-white">
                                    <td className="py-3 md:py-3.5 px-1 md:px-4 text-center text-[11px] md:text-[12px] text-gray-400 font-bold">
                                        {post.is_hot ? <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm shadow-sm inline-block">HOT</span> : (totalPosts - i)}
                                    </td>
                                    <td className="py-3 md:py-3.5 px-2 md:px-4">
                                        <button 
                                            onClick={() => handlePostClick(post)} 
                                            className="flex items-center gap-2 md:gap-2.5 group w-full text-left"
                                        >
                                            {post.thumbnail && (
                                                <img src={post.thumbnail} alt="" className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover shrink-0 border border-gray-100" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[13px] md:text-[14px] font-medium text-gray-900 group-hover:text-primary transition-colors block truncate">
                                                        {post.title}
                                                    </span>
                                                    {post.comment_count > 0 && <span className="text-[11px] md:text-[12px] font-black text-purple-600 shrink-0">[{post.comment_count}]</span>}
                                                    {Date.now() - new Date(post.created_at).getTime() < 86400000 && <span className="bg-orange-100 text-orange-600 text-[8px] font-black px-1 rounded-sm shrink-0">N</span>}
                                                </div>
                                                {activeTab === 'foxmarket' && post.price && (
                                                    <span className="text-[11px] text-gray-500 mt-0.5 block font-bold">{post.price}</span>
                                                )}
                                            </div>
                                        </button>
                                    </td>
                                    <td className="py-3 md:py-3.5 px-1 md:px-4 text-center">
                                        <div className="text-[12px] md:text-[13px] text-gray-600 font-medium truncate max-w-[80px] md:max-w-[120px] mx-auto">
                                            {post.is_anonymous ? '익명' : post.author_name}
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 text-center text-[12px] text-gray-400 font-medium hidden lg:table-cell">
                                        {format(new Date(post.created_at), 'yyyy-MM-dd')}
                                    </td>
                                    <td className="py-3.5 px-4 text-center text-[12px] text-gray-500 font-bold hidden sm:table-cell">
                                        {post.view_count || 0}
                                    </td>
                                </tr>
                            ))}
                            {initialPosts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <MessageSquare className="w-8 h-8 text-gray-300" />
                                            <p className="text-[14px] font-medium">아직 등록된 게시글이 없습니다.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
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

            {/* 글쓰기 모달 (팝업) */}
            {showWriteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        {/* 모달 헤더 */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-[16px] font-black text-gray-900 flex items-center gap-2">
                                <Pencil className="w-4 h-4 text-primary" />
                                {currentBoard.label} 글쓰기
                            </h3>
                            <button 
                                onClick={() => setShowWriteModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                ✕
                            </button>
                        </div>
                        
                        {/* 모달 바디 (입력폼) */}
                        <div className="p-6 space-y-4">
                            <div>
                                <input 
                                    type="text" 
                                    placeholder="제목을 입력하세요" 
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    value={writeTitle}
                                    onChange={(e) => setWriteTitle(e.target.value)}
                                    maxLength={100}
                                />
                            </div>
                            <div>
                                <textarea 
                                    placeholder="내용을 입력하세요. 욕설, 비방, 광고 등은 무통보 삭제될 수 있습니다." 
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] h-40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    value={writeContent}
                                    onChange={(e) => setWriteContent(e.target.value)}
                                    maxLength={2000}
                                />
                            </div>
                        </div>

                        {/* 모달 푸터 (버튼) */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                            <button 
                                onClick={() => setShowWriteModal(false)}
                                className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                                취소
                            </button>
                            <button 
                                onClick={handleWriteSubmit}
                                disabled={isSubmitting}
                                className="px-6 py-2.5 rounded-xl text-[14px] font-black bg-primary text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting ? '등록 중...' : '등록하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 게시글 상세 모달 */}
            {selectedPost && (
                <PostDetailModal 
                    post={selectedPost} 
                    boardId={activeTab} 
                    isLoggedIn={isLoggedIn} 
                    onClose={() => setSelectedPost(null)} 
                />
            )}
        </div>
    );
}
