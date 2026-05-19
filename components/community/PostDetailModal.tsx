'use client';

import React, { useState, useEffect } from 'react';
import { User, Eye, MessageSquare, Clock, X, Send } from 'lucide-react';
import { format } from 'date-fns';

interface PostDetailModalProps {
    post: any;
    boardId: string;
    isLoggedIn: boolean;
    onClose: () => void;
}

export function PostDetailModal({ post, boardId, isLoggedIn, onClose }: PostDetailModalProps) {
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
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
            } catch (error) {
                console.error("Failed to load comments", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchComments();
    }, [post.id]);

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
                content: newComment,
                board_id: boardId
            });

            if (res.success && res.data) {
                setComments(prev => [...prev, res.data]);
                setNewComment('');
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
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
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
                                {post.is_anonymous ? '익명' : post.author_name}
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
                            ) : comments.length === 0 ? (
                                <div className="text-center text-gray-400 text-[13px] py-6 bg-white rounded-xl border border-gray-100">
                                    첫 번째 댓글을 남겨보세요!
                                </div>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-[13px] text-gray-800">
                                                {comment.is_anonymous ? '익명' : comment.author_name}
                                            </span>
                                            <span className="text-[11px] text-gray-400">
                                                {format(new Date(comment.created_at), 'MM-dd HH:mm')}
                                            </span>
                                        </div>
                                        <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
                                            {comment.content}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Comment Input */}
                        <div className="flex flex-col gap-2">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={isLoggedIn ? "따뜻한 댓글을 남겨주세요." : "로그인 후 댓글을 작성할 수 있습니다."}
                                disabled={!isLoggedIn || isSubmitting}
                                className="w-full h-24 p-3 rounded-xl border border-gray-200 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
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
