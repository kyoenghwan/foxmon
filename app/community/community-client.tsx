'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CommunitySidebar } from '@/components/community/CommunitySidebar';
import { PostDetailModal } from '@/components/community/PostDetailModal';
import { maskName } from '@/lib/utils';
import { Pencil, MessageSquare, Upload } from 'lucide-react';
import { format } from 'date-fns';
import {
    COMMUNITY_AUDIENCE_LABELS,
    getCommunityBoard,
    getVisibleCommunityBoards,
    getCommunitySidebarSections,
    canAccessCommunityBoard,
    getBoardAccessDeniedMessage,
} from '@/lib/community-boards';

export function CommunityClient({
    activeTab,
    initialPosts = [],
    totalPosts = 0,
    isLoggedIn = false,
    userRole = null,
}: {
    activeTab: string;
    initialPosts?: any[];
    totalPosts?: number;
    isLoggedIn?: boolean;
    userRole?: string | null;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [localRole, setLocalRole] = useState<string | null>(userRole);
    const [postCategory, setPostCategory] = useState<string>('잡담');
    const [talkFilter, setTalkFilter] = useState<'all' | 'normal' | 'tips'>('all');
    const [reviewsFilter, setReviewsFilter] = useState<'all' | 'review' | 'report'>('all');
    const [freeFilter, setFreeFilter] = useState<'all' | 'normal' | 'playground'>('all');

    useEffect(() => {
        if (activeTab === 'free') {
            setPostCategory('잡담');
        } else if (activeTab === 'foxtalk') {
            setPostCategory('수다');
        } else if (activeTab === 'reviews') {
            setPostCategory('후기');
        }
    }, [activeTab]);

    useEffect(() => {
        setTalkFilter('all');
        setReviewsFilter('all');
        setFreeFilter('all');
    }, [activeTab]);

    useEffect(() => {
        if (!userRole && typeof window !== 'undefined') {
            const verified = sessionStorage.getItem('foxmon_verified_user');
            if (verified) {
                try {
                    const data = JSON.parse(verified);
                    if (data.gender === 'FEMALE') {
                        setLocalRole('GENERAL');
                    }
                } catch (e) {
                    console.error('Failed to parse guest verification data for board permission:', e);
                }
            }
        }
    }, [userRole]);

    useEffect(() => {
        const isWrite = searchParams?.get('write') === 'true';
        if (isWrite) {
            const prefillTitle = searchParams.get('title') || '';
            const prefillContent = searchParams.get('content') || '';
            const prefillCategory = searchParams.get('category') || '잡담';
            const prefillImage = searchParams.get('prefillImage') || '';
            
            setWriteTitle(prefillTitle);
            setWriteContent(prefillContent);
            if (prefillImage) {
                setWriteImages([prefillImage]);
            }
            if (prefillCategory === '놀이터 인증') {
                setPostCategory('놀이터 인증');
            } else if (prefillCategory === '꿀팁 & 노하우' || prefillCategory === '꿀팁·노하우') {
                setPostCategory('꿀팁 & 노하우');
            } else if (prefillCategory === '수다') {
                setPostCategory('수다');
            } else if (prefillCategory === '제보') {
                setPostCategory('제보');
            } else if (prefillCategory === '후기') {
                setPostCategory('후기');
            } else {
                if (activeTab === 'foxtalk') {
                    setPostCategory('수다');
                } else if (activeTab === 'reviews') {
                    setPostCategory('후기');
                } else {
                    setPostCategory('잡담');
                }
            }
            setShowWriteModal(true);
        }
    }, [searchParams, activeTab]);

    const filteredPosts = useMemo(() => {
        if (activeTab === 'free') {
            if (freeFilter === 'all') return initialPosts;
            if (freeFilter === 'normal') {
                return initialPosts.filter(post => !post.title.startsWith('[놀이터 인증]'));
            }
            if (freeFilter === 'playground') {
                return initialPosts.filter(post => post.title.startsWith('[놀이터 인증]'));
            }
        }
        if (activeTab === 'foxtalk') {
            if (talkFilter === 'all') return initialPosts;
            if (talkFilter === 'normal') {
                return initialPosts.filter(post => post.title.startsWith('[수다]'));
            }
            if (talkFilter === 'tips') {
                return initialPosts.filter(post => 
                    post.title.startsWith('[꿀팁 & 노하우]') || post.title.startsWith('[꿀팁·노하우]')
                );
            }
        }
        if (activeTab === 'reviews') {
            if (reviewsFilter === 'all') return initialPosts;
            if (reviewsFilter === 'review') {
                return initialPosts.filter(post => post.title.startsWith('[후기]'));
            }
            if (reviewsFilter === 'report') {
                return initialPosts.filter(post => post.title.startsWith('[제보]'));
            }
        }
        return initialPosts;
    }, [activeTab, freeFilter, talkFilter, reviewsFilter, initialPosts]);

    const visibleBoards = useMemo(() => getVisibleCommunityBoards(localRole), [localRole]);
    const sidebarSections = useMemo(() => getCommunitySidebarSections(localRole), [localRole]);
    const currentBoard =
        getCommunityBoard(activeTab) || visibleBoards[0] || getCommunityBoard('free')!;
    const canWrite = canAccessCommunityBoard(activeTab, localRole);
    const isMarketBoard = activeTab === 'business' || activeTab === 'foxmarket' || activeTab === 'freemarket';

    const [showWriteModal, setShowWriteModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [writeTitle, setWriteTitle] = useState('');
    const [writeContent, setWriteContent] = useState('');
    const [writeImages, setWriteImages] = useState<string[]>([]);
    const [writePrice, setWritePrice] = useState('');
    const [isPriceNegotiable, setIsPriceNegotiable] = useState(false);
    const [isDiscountable, setIsDiscountable] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!showWriteModal) {
            setWriteTitle('');
            setWriteContent('');
            setWriteImages([]);
            setWritePrice('');
            setIsPriceNegotiable(false);
            setIsDiscountable(false);
        }
    }, [showWriteModal]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const maxLimit = (isMarketBoard || activeTab === 'free') ? 5 : 1;
        if (writeImages.length >= maxLimit) {
            alert(`이미지는 최대 ${maxLimit}장까지 첨부할 수 있습니다.`);
            return;
        }
        
        try {
            const { compressImageFile } = await import('@/lib/image-utils');
            const compressedBase64 = await compressImageFile(file, { 
                maxWidthOrHeight: 800, 
                quality: 0.85, 
                format: 'image/jpeg' 
            });
            setWriteImages(prev => [...prev, compressedBase64]);
        } catch (error) {
            console.error('이미지 처리 실패:', error);
            alert('이미지 처리 중 오류가 발생했습니다.');
        }
    };

    const handleTabChange = (tabId: string) => {
        if (!canAccessCommunityBoard(tabId, localRole)) {
            alert(getBoardAccessDeniedMessage(tabId));
            return;
        }
        router.push(`/community?tab=${tabId}`);
    };

    const handleWriteClick = () => {
        if (!isLoggedIn) {
            if (confirm('로그인 후 이용할 수 있습니다. 로그인 페이지로 이동하시겠습니까?')) {
                router.push('/login');
            }
            return;
        }
        if (!canAccessCommunityBoard(activeTab, localRole)) {
            alert('이 게시판에 글을 쓸 권한이 없습니다.');
            return;
        }
        setShowWriteModal(true);
    };

    const handlePostClick = async (post: any) => {
        setSelectedPost(post);

        // 조회수 증가 처리 (중복 카운팅 방지: 하루 1회 & 본인 글 제외)
        try {
            const viewedPostsKey = 'foxmon_viewed_posts';
            const todayStr = new Date().toISOString().slice(0, 10);
            const storageVal = localStorage.getItem(viewedPostsKey) || '{}';
            let viewedMap: Record<string, string[]> = {};
            
            try {
                viewedMap = JSON.parse(storageVal);
            } catch (e) {
                viewedMap = {};
            }

            if (!viewedMap[todayStr]) {
                viewedMap = { [todayStr]: [] };
            }

            const todayViewedList = viewedMap[todayStr];
            if (!todayViewedList.includes(post.id)) {
                const res = await fetch('/api/auth/session');
                const session = await res.json();
                
                if (session?.user?.id !== post.user_id) {
                    const { incrementCommunityPostViewCount } = await import('@/lib/actions/community');
                    const viewRes = await incrementCommunityPostViewCount(post.id);
                    if (viewRes.success && viewRes.view_count != null) {
                        post.view_count = viewRes.view_count;
                    }
                }
                
                todayViewedList.push(post.id);
                localStorage.setItem(viewedPostsKey, JSON.stringify(viewedMap));
            }
        } catch (error) {
            console.error('Failed to increment view count:', error);
        }
    };

    const handleWriteSubmit = async () => {
        if (!writeTitle.trim() || !writeContent.trim()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }
        setIsSubmitting(true);
        try {
            let finalPrice: string | null = null;
            if (isMarketBoard) {
                if (isPriceNegotiable) {
                    finalPrice = '가격 협의';
                } else {
                    const priceText = writePrice.trim();
                    if (priceText) {
                        finalPrice = isDiscountable ? `${priceText} (네고 가능)` : priceText;
                    } else {
                        finalPrice = '가격 협의';
                    }
                }
            }

            const { createCommunityPost } = await import('@/lib/actions/community');
            const finalTitle = (activeTab === 'free' || activeTab === 'foxtalk' || activeTab === 'reviews') ? `[${postCategory}] ${writeTitle}` : writeTitle;
            const res = await createCommunityPost({
                board_id: activeTab,
                title: finalTitle,
                content: writeContent,
                thumbnail: writeImages.length > 0 ? writeImages[0] : null,
                price: finalPrice,
                detail_images: writeImages.length > 0 ? writeImages : null
            });
            if (res.success) {
                alert('게시글이 등록되었습니다.');
                setShowWriteModal(false);
                setWriteTitle('');
                setWriteContent('');
                setWriteImages([]);
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
        <div className="flex flex-col gap-4 w-full">
            {/* 상단 메뉴 — 이전처럼 상 중 하 3단 레이아웃이되, 세련된 테마 칩 스타일 적용 */}
            <div className="w-full bg-white sticky top-[130px] z-20 border-b border-gray-100 shadow-sm space-y-3 px-2 sm:px-4 py-3 sm:py-4">
                {sidebarSections.map((section) => {
                    let theme = 'all';
                    if (section.title.includes('여성')) theme = 'women';
                    if (section.title.includes('업소')) theme = 'employer';

                    return (
                        <div key={section.title} className="space-y-1.5">
                            {/* 소속 그룹 타이틀 */}
                            <p className="text-[10px] sm:text-[11px] font-black text-gray-400 px-0.5 sm:px-1">
                                {section.title}
                            </p>
                            
                            {/* 가로 칩 리스트 */}
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

            {/* 우측 게시판 콘텐츠 */}
            <div className="flex-1 min-w-0 w-full space-y-4">
                {/* 게시판 제목 + 글쓰기 버튼 */}
                <div className="flex items-center justify-between px-1 sm:px-0 gap-2">
                    <div className="min-w-0">
                        <h2 className="text-lg md:text-xl font-black text-gray-900">{currentBoard.label}</h2>
                        <p className="text-[11px] text-gray-500 font-bold mt-0.5">
                            {COMMUNITY_AUDIENCE_LABELS[currentBoard.audience]}
                        </p>
                    </div>
                    {canWrite && (
                        <button
                            type="button"
                            onClick={handleWriteClick}
                            className="flex items-center gap-1.5 px-4 md:px-5 py-2 md:py-2.5 bg-primary text-white font-black text-[13px] md:text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-sm active:scale-95 shrink-0"
                        >
                            <Pencil className="w-4 h-4" />
                            글쓰기
                        </button>
                    )}
                </div>



                {/* 업소후기·제보 안내 */}
                {activeTab === 'reviews' && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 mx-1 sm:mx-0">
                        <span className="text-red-500 text-xl">🚨</span>
                        <div className="text-[13px] text-red-700 leading-relaxed">
                            <p className="font-bold">익명 후기·제보 게시판</p>
                            <p className="mt-1">작성자명이 '익명'으로 표시됩니다. 업소 방문 후기 및 부당 대우, 임금 체불 등의 제보를 안전하게 나눠주세요.</p>
                        </div>
                    </div>
                )}

                {/* 자유게시판 전용 소탭 필터 */}
                {activeTab === 'free' && (
                    <div className="flex gap-1.5 mb-3 px-1 sm:px-0">
                        <button
                            type="button"
                            onClick={() => setFreeFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                                freeFilter === 'all'
                                    ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            전체
                        </button>
                        <button
                            type="button"
                            onClick={() => setFreeFilter('normal')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                                freeFilter === 'normal'
                                    ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            💬 일반
                        </button>
                        <button
                            type="button"
                            onClick={() => setFreeFilter('playground')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                                freeFilter === 'playground'
                                    ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            🎮 놀이터 인증
                        </button>
                    </div>
                )}

                {/* 폭스수다 게시판 전용 소탭 필터 */}
                {activeTab === 'foxtalk' && (
                    <div className="flex gap-1.5 mb-3 px-1 sm:px-0">
                        <button
                            type="button"
                            onClick={() => setTalkFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                                talkFilter === 'all'
                                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            전체
                        </button>
                        <button
                            type="button"
                            onClick={() => setTalkFilter('normal')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                                talkFilter === 'normal'
                                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            💬 수다(일반)
                        </button>
                        <button
                            type="button"
                            onClick={() => setTalkFilter('tips')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                                talkFilter === 'tips'
                                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            💡 꿀팁 & 노하우
                        </button>
                    </div>
                )}
                {/* 업소후기·제보 게시판 전용 소탭 필터 */}
                {activeTab === 'reviews' && (
                    <div className="flex gap-1.5 mb-3 px-1 sm:px-0">
                        <button
                            type="button"
                            onClick={() => setReviewsFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                                reviewsFilter === 'all'
                                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            전체
                        </button>
                        <button
                            type="button"
                            onClick={() => setReviewsFilter('review')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                                reviewsFilter === 'review'
                                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            ⭐ 후기
                        </button>
                        <button
                            type="button"
                            onClick={() => setReviewsFilter('report')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                                reviewsFilter === 'report'
                                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            🚨 제보
                        </button>
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
                            {filteredPosts.map((post, i) => (
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
                                            {post.is_anonymous ? '익명' : maskName(post.author_name)}
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
                            {filteredPosts.length === 0 && (
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
                            {isMarketBoard && (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-[11px] text-red-800 leading-relaxed font-medium">
                                    🚨 <strong>장터 거래 주의:</strong> 회원 간 자율 거래 공간이오니, 대면 거래 등을 통해 안전하게 거래가 이루어지도록 유의해 주세요.
                                </div>
                            )}
                            {(activeTab === 'free' || activeTab === 'foxtalk' || activeTab === 'reviews') && (
                                <div>
                                    <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">게시글 구분</label>
                                    <select
                                        value={postCategory}
                                        onChange={(e) => setPostCategory(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-700 cursor-pointer"
                                    >
                                        {activeTab === 'free' && (
                                            <>
                                                <option value="잡담">💬 일상 잡담</option>
                                                <option value="놀이터 인증">🎮 놀이터 대박 인증</option>
                                            </>
                                        )}
                                        {activeTab === 'foxtalk' && (
                                            <>
                                                <option value="수다">💬 수다(일반)</option>
                                                <option value="꿀팁 & 노하우">💡 꿀팁 & 노하우</option>
                                            </>
                                        )}
                                        {activeTab === 'reviews' && (
                                            <>
                                                <option value="후기">⭐ 업소 후기</option>
                                                <option value="제보">🚨 부당 제보</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            )}
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
                            {isMarketBoard && (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder={isPriceNegotiable ? "가격 협의 선택됨" : "희망 거래 가격 (예: 50,000원)"} 
                                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                                            value={writePrice}
                                            onChange={(e) => setWritePrice(e.target.value)}
                                            maxLength={30}
                                            disabled={isPriceNegotiable}
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 px-1">
                                        <label className="flex items-center gap-1.5 cursor-pointer text-[12px] md:text-[13px] font-bold text-gray-600 select-none">
                                            <input 
                                                type="checkbox" 
                                                checked={isPriceNegotiable} 
                                                onChange={(e) => {
                                                    setIsPriceNegotiable(e.target.checked);
                                                    if (e.target.checked) {
                                                        setWritePrice('');
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                                            />
                                            가격 협의
                                        </label>
                                        <label className={`flex items-center gap-1.5 text-[12px] md:text-[13px] font-bold select-none ${isPriceNegotiable ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 cursor-pointer'}`}>
                                            <input 
                                                type="checkbox" 
                                                checked={isDiscountable} 
                                                onChange={(e) => setIsDiscountable(e.target.checked)}
                                                disabled={isPriceNegotiable}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer disabled:cursor-not-allowed"
                                            />
                                            네고 가능
                                        </label>
                                    </div>
                                </div>
                            )}
                            <div>
                                <textarea 
                                    placeholder="내용을 입력하세요. 욕설, 비방, 광고 등은 무통보 삭제될 수 있습니다." 
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] h-40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    value={writeContent}
                                    onChange={(e) => setWriteContent(e.target.value)}
                                    maxLength={2000}
                                />
                            </div>
                            {(isMarketBoard || activeTab === 'free') && (
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-gray-500 block">이미지 첨부 (최대 5장, 선택)</label>
                                    <div className="flex flex-wrap items-center gap-3">
                                        {writeImages.length < 5 && (
                                            <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-bold text-gray-700 hover:bg-gray-50 cursor-pointer transition-all shadow-sm">
                                                <Upload className="w-4 h-4 text-gray-500" />
                                                사진 올리기
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    className="hidden" 
                                                    onChange={handleImageUpload}
                                                />
                                            </label>
                                        )}
                                        {writeImages.map((img, index) => (
                                            <div key={index} className="relative w-12 h-12 border border-gray-200 rounded-xl overflow-hidden shadow-sm shrink-0">
                                                <img src={img} alt={`첨부 이미지 ${index + 1}`} className="w-full h-full object-cover" />
                                                {index === 0 && (
                                                    <span className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-[8px] font-black text-center py-0.5 leading-none">
                                                        대표
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setWriteImages(prev => prev.filter((_, i) => i !== index))}
                                                    className="absolute top-0.5 right-0.5 bg-black/75 hover:bg-black text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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
