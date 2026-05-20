'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Send, CornerDownRight, X } from 'lucide-react';
import { format } from 'date-fns';
import { maskName } from '@/lib/utils';

export function CommunityCommentsSection({
    postId,
    boardId,
    isLoggedIn,
    initialCount = 0,
}: {
    postId: string;
    boardId: string;
    isLoggedIn: boolean;
    initialCount?: number;
}) {
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [commentCount, setCommentCount] = useState(initialCount);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const { getCommunityComments } = await import('@/lib/actions/community');
                const data = await getCommunityComments(postId);
                setComments(data);
                setCommentCount(data.length);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [postId]);

    const groupedComments = useMemo(() => {
        const parents = comments.filter((c) => !c.parent_id);
        const children = comments.filter((c) => c.parent_id);
        return parents.map((parent) => ({
            ...parent,
            replies: children.filter((child) => child.parent_id === parent.id),
        }));
    }, [comments]);

    const handleSubmit = async () => {
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
                post_id: postId,
                parent_id: replyingTo?.id,
                content: newComment,
                board_id: boardId,
            });
            if (res.success && res.data) {
                setComments((prev) => [...prev, res.data]);
                setCommentCount((c) => c + 1);
                setNewComment('');
                setReplyingTo(null);
            } else {
                alert(res.message || '댓글 등록에 실패했습니다.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-50 p-4 md:p-6 border-t border-gray-100">
            <h4 className="font-bold text-[14px] text-gray-900 mb-4 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-primary" />
                댓글 {commentCount > 0 ? <span className="text-primary">{commentCount}</span> : null}
            </h4>

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
                                                type="button"
                                                onClick={() =>
                                                    setReplyingTo({
                                                        id: parent.id,
                                                        name: parent.is_anonymous ? '익명' : maskName(parent.author_name),
                                                    })
                                                }
                                                className="text-[11px] font-bold text-gray-500 hover:text-primary"
                                            >
                                                답글
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">{parent.content}</p>
                            </div>
                            {parent.replies?.map((reply: any) => (
                                <div key={reply.id} className="pl-6 md:pl-8 relative">
                                    <CornerDownRight className="w-4 h-4 text-gray-300 absolute left-0 top-3" />
                                    <div className="bg-white/80 p-3.5 rounded-xl border border-gray-100">
                                        <div className="flex justify-between text-[12px] font-bold text-gray-800 mb-1">
                                            <span>{reply.is_anonymous ? '익명' : maskName(reply.author_name)}</span>
                                            <span className="text-gray-400 font-normal">
                                                {format(new Date(reply.created_at), 'MM-dd HH:mm')}
                                            </span>
                                        </div>
                                        <p className="text-[13px] text-gray-600 whitespace-pre-wrap">{reply.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>

            <div className="flex flex-col gap-2 relative">
                {replyingTo && (
                    <div className="flex items-center gap-2 text-[12px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full w-fit">
                        <CornerDownRight className="w-3.5 h-3.5" />
                        {replyingTo.name} 님에게 답글
                        <button type="button" onClick={() => setReplyingTo(null)}>
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={!isLoggedIn || isSubmitting}
                    placeholder={isLoggedIn ? '댓글을 입력하세요.' : '로그인 후 작성할 수 있습니다.'}
                    className="w-full h-24 p-3 rounded-xl border border-gray-200 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100"
                />
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!isLoggedIn || isSubmitting || !newComment.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-[13px] font-bold rounded-lg disabled:opacity-50"
                    >
                        <Send className="w-3.5 h-3.5" />
                        {isSubmitting ? '등록 중...' : '등록'}
                    </button>
                </div>
            </div>
        </div>
    );
}
