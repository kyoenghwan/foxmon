import SubPageLayout from '@/components/layout/sub-page-layout';
import { CommunityClient } from './community-client';
import { getCommunityPosts } from '@/lib/actions/community';

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params.tab || 'free';
  const { posts, total } = await getCommunityPosts(activeTab, 1, 20);

  return (
    <SubPageLayout
      title="커뮤니티"
      description="여우들의 생생한 후기와 비밀 수다 공간"
      hideSearch={true}
    >
      <CommunityClient activeTab={activeTab} initialPosts={posts} totalPosts={total} />
    </SubPageLayout>
  );
}
