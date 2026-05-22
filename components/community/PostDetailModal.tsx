'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User, Eye, MessageSquare, Clock, X, Send, CornerDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { maskName } from '@/lib/utils';

interface PostDetailModalProps {
    post: any;
    boardId: string;
    isLoggedIn: boolean;
    onClose: () => void;
}

export function PostDetailModal({ post, boardId, isLoggedIn, onClose }: PostDetailModalProps) {
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<{ id: string, name: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch comments when modal opens
        const fetchComments = async () => {
            setIsLoading(true);
            try {
                const { getCommunityComments } = await import('@/lib/actions/community');
                const data = await getCommunityComments(post.id);
                setComments(data);
                // DB와 실제 댓글 수가 안 맞을 경우(수동 삭제 등) UI 강제 동기화
                if (data.length !== post.comment_count) {
                    post.comment_count = data.length;
                }
            } catch (error) {
                console.error("Failed to load comments", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchComments();
    }, [post.id, post]);

    const handleCommentSubmit = async () => {
        if (!isLoggedIn) {
            alert('로그인 후 댓글을 작성할 수 있습니다.');
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
                        {/* Post Meta */}
                        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-[12px] md:text-[13px] text-gray-500 mb-6 pb-4 border-b border-gray-100">
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

                        {/* Post Content */}
                        <div className="min-h-[150px]">
                            <div 
                                className="sun-editor-editable ProseMirror custom-prose text-gray-800 text-[14px] md:text-[15px] leading-loose whitespace-pre-wrap break-words"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />
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
                                placeholder={isLoggedIn ? (replyingTo ? "답글을 입력하세요." : "따뜻한 댓글을 남겨주세요.") : "로그인 후 작성할 수 있습니다."}
                                disabled={!isLoggedIn || isSubmitting}
                                className={`w-full h-24 p-3 rounded-xl border text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${replyingTo ? 'border-primary/50 bg-primary/5' : 'border-gray-200'}`}
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handleCommentSubmit}
                                    disabled={!isLoggedIn || isSubmitting || !newComment.trim()}
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
        </div>
    );
}
