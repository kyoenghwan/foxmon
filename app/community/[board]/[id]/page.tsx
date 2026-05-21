import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, User, Eye, MessageSquare, Clock } from 'lucide-react';
import SubPageLayout from '@/components/layout/sub-page-layout';
import { Metadata } from 'next';
import { getCommunityPostById } from '@/lib/actions/community';
import { format } from 'date-fns';
import { CommunityDetailClient } from './CommunityDetailClient';
import { CommunityCommentsSection } from '@/components/community/CommunityCommentsSection';
import { auth } from '@/auth';
import {
    canAccessCommunityBoard,
    getDefaultCommunityTab,
} from '@/lib/community-boards';

export async function generateMetadata({ params }: { params: Promise<{ board: string; id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const post = await getCommunityPostById(id);
    
    if (!post) {
        return {
            title: '게시글을 찾을 수 없습니다 | 폭스몬 커뮤니티',
        };
    }

    // HTML 태그 제거 및 텍스트만 추출 (최대 160자)
    const plainTextDescription = post.content?.replace(/<[^>]*>?/gm, '').substring(0, 160) || '폭스몬 커뮤니티 게시글입니다.';

    return {
        title: `${post.title} | 폭스몬 커뮤니티`,
        description: plainTextDescription,
        openGraph: {
            title: `${post.title} | 폭스몬 커뮤니티`,
            description: plainTextDescription,
            type: 'article',
            publishedTime: post.created_at,
            authors: [post.is_anonymous ? '익명' : (post.author_name || '폭스몬 사용자')],
        }
    };
}

export default async function CommunityPostDetailPage({
    params,
}: {
    params: Promise<{ board: string; id: string }>;
}) {
    const { board, id } = await params;

    if (board === 'notice') {
        redirect('/help');
    }
    if (board === 'event') {
        redirect('/help?tab=이벤트');
    }
    
    // UUID 형식 검증 등 필요한 경우 추가 (현재는 간단히 ID로 조회)
    const post = await getCommunityPostById(id);
    const session = await auth();
    const userRole = (session?.user as { role?: string } | undefined)?.role ?? null;
    const isLoggedIn = !!session?.user;

    if (!post) {
        return notFound();
    }

    if (!canAccessCommunityBoard(board, userRole)) {
        redirect(`/community?tab=${getDefaultCommunityTab(userRole)}`);
    }

    return (
        <SubPageLayout
            title="커뮤니티"
            description="전체·여성·업소 회원별 게시판이 구분되어 있습니다"
            hideSearch={true}
        >
            <CommunityDetailClient activeTab={board} userRole={userRole}>
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

                    <CommunityCommentsSection
                        postId={id}
                        boardId={board}
                        isLoggedIn={isLoggedIn}
                        initialCount={post.comment_count || 0}
                    />
                </div>
            </CommunityDetailClient>
        </SubPageLayout>
    );
}
