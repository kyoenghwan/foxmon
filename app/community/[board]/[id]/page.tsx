import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, User, Eye, MessageSquare, Clock } from 'lucide-react';
import SubPageLayout from '@/components/layout/sub-page-layout';
import { getCommunityPostById } from '@/lib/actions/community';
import { format } from 'date-fns';
import { CommunityDetailClient } from './CommunityDetailClient';

export default async function CommunityPostDetailPage({
    params,
}: {
    params: Promise<{ board: string; id: string }>;
}) {
    const { board, id } = await params;

    if (board === 'notice') {
        redirect('/help');
    }
    
    // UUID 형식 검증 등 필요한 경우 추가 (현재는 간단히 ID로 조회)
    const post = await getCommunityPostById(id);

    if (!post) {
        return notFound();
    }

    return (
        <SubPageLayout
            title="커뮤니티"
            description="여우들의 생생한 후기와 비밀 수다 공간"
            hideSearch={true}
        >
            <CommunityDetailClient activeTab={board}>
                <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {/* 상단 헤더 영역 */}
                    <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <Link href={`/community?tab=${board}`} className="inline-flex items-center text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                목록으로 돌아가기
                            </Link>
                            {post.is_hot && (
                                <span className="bg-red-50 text-red-600 text-[11px] font-black px-2 py-1 rounded-md">HOT 게시글</span>
                            )}
                        </div>

                        <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-snug">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 text-[13px] text-gray-500">
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
                    </div>

                    {/* 본문 영역 */}
                    <div className="p-4 md:p-8 min-h-[300px]">
                        <div 
                            className="sun-editor-editable ProseMirror custom-prose text-gray-800 text-[15px] leading-loose whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    </div>

                    {/* 하단 영역 (댓글 등 확장 가능) */}
                    <div className="bg-gray-50 p-4 md:p-6 border-t border-gray-100">
                        <div className="flex items-center justify-center text-gray-400 text-[13px]">
                            댓글 기능은 준비 중입니다.
                        </div>
                    </div>
                </div>
            </CommunityDetailClient>
        </SubPageLayout>
    );
}
