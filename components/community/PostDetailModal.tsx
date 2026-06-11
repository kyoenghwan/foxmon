'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User, Eye, MessageSquare, Clock, X, Send, CornerDownRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { maskName } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface PostDetailModalProps {
    post: any;
    boardId: string;
    isLoggedIn: boolean;
    onClose: () => void;
}

export function PostDetailModal({ post, boardId, isLoggedIn, onClose }: PostDetailModalProps) {
    const router = useRouter();
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<{ id: string, name: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const isMarketBoard = boardId === 'business' || boardId === 'foxmarket' || boardId === 'freemarket';

    const imagesList = useMemo(() => {
        if (post.detail_images && Array.isArray(post.detail_images) && post.detail_images.length > 0) {
            return post.detail_images;
        }
        return post.thumbnail ? [post.thumbnail] : [];
    }, [post.detail_images, post.thumbnail]);

    const handleStartChat = async () => {
        try {
            const res = await fetch('/api/auth/session');
            const session = await res.json();
            if (!session?.user?.id) {
                if (confirm('로그인 후 폭스토크 연락이 가능합니다. 로그인 페이지로 이동하시겠습니까?')) {
                    onClose();
                    router.push('/login');
                }
                return;
            }
            if (session.user.id === post.user_id) {
                alert('본인이 작성한 글에는 대화를 신청할 수 없습니다.');
                return;
            }

            const { OA_INSERT_CHAT_ROOM } = await import('@/src/atoms/oa/foxtalk/OA_INSERT_CHAT_ROOM');
            const createRes = await OA_INSERT_CHAT_ROOM({
                title: `장터 대화 - ${post.title}`,
                type: '1ON1',
                max_participants: 2,
                created_by: session.user.id,
                employer_id: post.user_id,
                seeker_id: session.user.id
            });

            if (createRes.success) {
                onClose();
                window.dispatchEvent(new CustomEvent('open_foxtalk', { detail: { roomId: createRes.data.id } }));
            } else {
                alert(createRes.message || '채팅방을 생성하지 못했습니다.');
            }
        } catch (err) {
            alert('채팅방 생성 중 오류가 발생했습니다.');
        }
    };

    useEffect(() => {
        // Fetch comments when modal opens
        const fetchComments = async () => {
            setIsLoading(true);
            try {
                const { getCommunityComments, syncPostCommentCount } = await import('@/lib/actions/community');
                const data = await getCommunityComments(post.id);
                setComments(data);
                // DB와 실제 댓글 수가 안 맞을 경우(수동 삭제 등) UI 및 DB 강제 동기화 (자가 치유)
                if (data.length !== post.comment_count) {
                    post.comment_count = data.length;
                    await syncPostCommentCount(post.id, data.length);
                }
            } catch (error) {
                console.error("Failed to load comments", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchComments();
    }, [post.id, post]);

    useEffect(() => {
        // 모달 활성화 시 뒷배경(body/html) 스크롤 차단
        const originalHtmlOverflow = document.documentElement.style.overflow;
        const originalBodyOverflow = document.body.style.overflow;

        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        return () => {
            // 모달 닫힐 시 원복
            document.documentElement.style.overflow = originalHtmlOverflow;
            document.body.style.overflow = originalBodyOverflow;
        };
    }, []);

    useEffect(() => {
        if (lightboxIndex === null) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setLightboxIndex(prev => (prev !== null) ? (prev === 0 ? imagesList.length - 1 : prev - 1) : null);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                setLightboxIndex(prev => (prev !== null) ? (prev === imagesList.length - 1 ? 0 : prev + 1) : null);
            } else if (e.key === 'Escape') {
                setLightboxIndex(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, imagesList.length]);

    const handleCommentSubmit = async () => {
        if (!isLoggedIn) {
            if (confirm('로그인 후 댓글을 작성할 수 있습니다. 로그인 페이지로 이동하시겠습니까?')) {
                onClose();
                router.push('/login');
            }
            return;
        }
        if (!newComment.trim()) {
            alert('댓글 내용을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { createCommunityComment } = await import('@/lib/actions/community');
            const res = await createCommunityComment({
                post_id: post.id,
                parent_id: replyingTo?.id,
                content: newComment,
                board_id: boardId
            });

            if (res.success && res.data) {
                setComments(prev => [...prev, res.data]);
                setNewComment('');
                setReplyingTo(null);
                post.comment_count = (post.comment_count || 0) + 1; // 로컬 카운트 증가
            } else {
                alert(res.message || '댓글 등록에 실패했습니다.');
            }
        } catch (error) {
            alert('오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 2-Depth 구조로 댓글 정리 (부모 -> 자식)
    const groupedComments = useMemo(() => {
        const parentComments = comments.filter(c => !c.parent_id);
        const childComments = comments.filter(c => c.parent_id);
        
        return parentComments.map(parent => ({
            ...parent,
            replies: childComments.filter(child => child.parent_id === parent.id)
        }));
    }, [comments]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                    <h3 className="text-[15px] font-black text-gray-900 truncate pr-4">
                        {post.title}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="focus:outline-none focus-visible:outline-none focus:ring-0 shrink-0"
                    >
                        <span className="hidden md:flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
                            <X className="w-5 h-5" />
                        </span>
                        <span className="md:hidden inline-block px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 hover:text-gray-900 rounded-full text-[12px] font-black transition-all">
                            닫기
                        </span>
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-5 md:p-6">
                        {/* 🚨 장터 자율거래 면책 안내 배너 (장터 전용) */}
                        {isMarketBoard && (
                            <div className="bg-red-50/70 border border-red-100 rounded-xl p-3 mb-4 text-[12px] md:text-[13px] text-red-800 leading-relaxed font-medium">
                                🚨 <strong>거래 안내:</strong> 회원 간 자율 직거래 공간이오니, 사기 피해 예방을 위해 직접 만나 물건을 확인하시는 등 안전에 유의해 주세요.
                            </div>
                        )}

                        {/* Post Meta */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
                            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-[12px] md:text-[13px] text-gray-500">
                                <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                    </div>
                                    {post.is_anonymous ? '익명' : maskName(post.author_name)}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {format(new Date(post.created_at), 'yyyy-MM-dd HH:mm')}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5" />
                                    {post.view_count || 0}
                                </div>
                                <div className="flex items-center gap-1">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    {post.comment_count || 0}
                                </div>
                            </div>
                            {isMarketBoard && (
                                <button
                                    onClick={handleStartChat}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white font-black text-[12px] rounded-xl shadow-md transition-all active:scale-[0.98] shrink-0"
                                >
                                    <span className="text-primary text-[14px]">⚡</span>
                                    폭스토크 연락하기
                                </button>
                            )}
                        </div>
                        
                        {/* 가격 표시 (장터 전용, 라벨 옆에 값 오도록) */}
                        {isMarketBoard && (
                            <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-6 flex items-center gap-2 border border-gray-100/70 shadow-sm">
                                <span className="text-[12px] text-gray-500 font-bold shrink-0">희망 거래 가격:</span>
                                <span className="text-[15px] font-black text-pink-600">
                                    {post.price ? post.price : '가격 협의'}
                                </span>
                            </div>
                        )}

                        {/* Post Content */}
                        <div className="min-h-[150px] space-y-6">
                            {/* 본문 내용이 이미지보다 위로 이동 */}
                            <div 
                                className="sun-editor-editable ProseMirror custom-prose text-gray-800 text-[14px] md:text-[15px] leading-loose whitespace-pre-wrap break-words"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />

                            {/* 이미지는 본문 아래에 작게 썸네일로 나열되며, 누르면 커집니다 */}
                            {imagesList.length > 0 && (
                                <div className="space-y-2 pt-4 border-t border-gray-100">
                                    <span className="text-[12px] font-bold text-gray-400 block">첨부 사진 ({imagesList.length}장 - 클릭 시 크게 보기)</span>
                                    <div className="flex flex-wrap gap-2.5">
                                        {imagesList.map((img: string, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => setLightboxIndex(idx)}
                                                className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 hover:border-primary/50 shadow-sm transition-all hover:scale-105 active:scale-95 shrink-0"
                                            >
                                                <img src={img} alt={`첨부 이미지 ${idx + 1}`} className="w-full h-full object-cover" />
                                                {idx === 0 && (
                                                    <span className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-[9px] font-black text-center py-0.5 leading-none">
                                                        대표
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="bg-gray-50 p-5 md:p-6 border-t border-gray-100 min-h-[200px]">
                        <h4 className="font-bold text-[14px] text-gray-900 mb-4 flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            댓글 {comments.length > 0 ? <span className="text-primary">{comments.length}</span> : ''}
                        </h4>

                        {/* Comment List */}
                        <div className="space-y-4 mb-6">
                            {isLoading ? (
                                <div className="text-center text-gray-400 text-[13px] py-4">댓글을 불러오는 중...</div>
                            ) : groupedComments.length === 0 ? (
                                <div className="text-center text-gray-400 text-[13px] py-6 bg-white rounded-xl border border-gray-100">
                                    첫 번째 댓글을 남겨보세요!
                                </div>
                            ) : (
                                groupedComments.map((parent) => (
                                    <div key={parent.id} className="space-y-3">
                                        {/* 부모 댓글 */}
                                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-[13px] text-gray-800">
                                                    {parent.is_anonymous ? '익명' : maskName(parent.author_name)}
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[11px] text-gray-400">
                                                        {format(new Date(parent.created_at), 'MM-dd HH:mm')}
                                                    </span>
                                                    {isLoggedIn && (
                                                        <button 
                                                            onClick={() => setReplyingTo({ id: parent.id, name: parent.is_anonymous ? '익명' : maskName(parent.author_name) })}
                                                            className="text-[11px] font-bold text-gray-500 hover:text-primary transition-colors"
                                                        >
                                                            답글 달기
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
                                                {parent.content}
                                            </p>
                                        </div>

                                        {/* 대댓글 목록 (2-Depth) */}
                                        {parent.replies.length > 0 && (
                                            <div className="pl-6 md:pl-8 space-y-3">
                                                {parent.replies.map((reply: any) => (
                                                    <div key={reply.id} className="relative bg-gray-50/80 p-3.5 rounded-xl border border-gray-100 flex flex-col gap-1.5">
                                                        <div className="absolute -left-4 md:-left-6 top-3 text-gray-300">
                                                            <CornerDownRight className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-[12px] text-gray-800">
                                                                {reply.is_anonymous ? '익명' : maskName(reply.author_name)}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400">
                                                                {format(new Date(reply.created_at), 'MM-dd HH:mm')}
                                                            </span>
                                                        </div>
                                                        <p className="text-[12px] md:text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
                                                            {reply.content}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Comment Input */}
                        <div className="flex flex-col gap-2 relative">
                            {replyingTo && (
                                <div className="absolute -top-8 left-0 flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[12px] font-bold">
                                    <CornerDownRight className="w-3.5 h-3.5" />
                                    <span>{replyingTo.name} 님에게 답글 작성 중...</span>
                                    <button 
                                        onClick={() => setReplyingTo(null)}
                                        className="ml-1 text-primary/70 hover:text-primary transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onFocus={() => {
                                    if (!isLoggedIn) {
                                        if (confirm('로그인 후 댓글을 작성할 수 있습니다. 로그인 페이지로 이동하시겠습니까?')) {
                                            onClose();
                                            router.push('/login');
                                        }
                                    }
                                }}
                                placeholder={isLoggedIn ? (replyingTo ? "답글을 입력하세요." : "따뜻한 댓글을 남겨주세요.") : "로그인 후 댓글 작성이 가능합니다. (클릭 시 이동)"}
                                disabled={isSubmitting}
                                className={`w-full h-24 p-3 rounded-xl border text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${replyingTo ? 'border-primary/50 bg-primary/5' : 'border-gray-200'}`}
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handleCommentSubmit}
                                    disabled={isSubmitting || (isLoggedIn && !newComment.trim())}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-[13px] font-bold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    {isSubmitting ? '등록 중...' : '등록'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🔍 이미지 라이트박스 확대 모달 */}
            {lightboxIndex !== null && (
                <div 
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-pointer animate-in fade-in duration-200"
                    onClick={() => setLightboxIndex(null)}
                >
                    <div 
                        className="relative max-w-[90vw] md:max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-black flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img 
                            src={imagesList[lightboxIndex]} 
                            alt="확대 이미지" 
                            className="max-w-full max-h-[85vh] object-contain select-none" 
                        />

                        {/* 좌측 화살표 (이전 이미지) */}
                        {imagesList.length > 1 && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxIndex(prev => (prev !== null) ? (prev === 0 ? imagesList.length - 1 : prev - 1) : null);
                                }}
                                className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/85 text-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border border-white/10 hover:border-white/20 shadow-md transition-all active:scale-95 focus:outline-none"
                            >
                                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        )}

                        {/* 우측 화살표 (다음 이미지) */}
                        {imagesList.length > 1 && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxIndex(prev => (prev !== null) ? (prev === imagesList.length - 1 ? 0 : prev + 1) : null);
                                }}
                                className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/85 text-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border border-white/10 hover:border-white/20 shadow-md transition-all active:scale-95 focus:outline-none"
                            >
                                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        )}

                        {/* 상단 닫기 버튼 */}
                        <button 
                            onClick={() => setLightboxIndex(null)}
                            className="absolute top-3 right-3 md:top-4 md:right-4 bg-black/50 hover:bg-black/85 text-white w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[16px] md:text-[18px] font-black shadow-md border border-white/10 hover:border-white/20 transition-all active:scale-95 focus:outline-none"
                        >
                            ✕
                        </button>

                        {/* 하단 인덱스 표시 뱃지 */}
                        {imagesList.length > 1 && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[11px] md:text-[12px] font-bold px-3 py-1 rounded-full border border-white/5 tracking-wider select-none">
                                {lightboxIndex + 1} / {imagesList.length}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
