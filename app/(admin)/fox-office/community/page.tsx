import React from 'react';
import { MessageSquare } from 'lucide-react';
import { QA_GET_ALL_COMMUNITY_POSTS } from '@/src/atoms/qa/admin/QA_GET_ALL_COMMUNITY_POSTS';
import { CommunityClientWrapper } from '@/components/admin/community/CommunityClientWrapper';

export const dynamic = 'force-dynamic';

export default async function AdminCommunityPage() {
    const posts = await QA_GET_ALL_COMMUNITY_POSTS();

    return (
        <div className="space-y-2">
            <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-primary" />
                    커뮤니티 관리
                </h2>
                <p className="text-[13px] text-gray-500 font-medium mt-1">
                    유저들이 작성한 게시글을 모니터링하고 공지사항을 등록하거나 불건전 게시글을 제재할 수 있습니다.
                </p>
            </div>

            <CommunityClientWrapper initialPosts={posts} />
        </div>
    );
}
