import SubPageLayout from '@/components/layout/sub-page-layout';
import { CommunityClient } from './community-client';
import { getCommunityPosts } from '@/lib/actions/community';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  if (params.tab === 'notice') {
    redirect('/help');
  }
  const activeTab = params.tab || 'free';
  const { posts, total } = await getCommunityPosts(activeTab, 1, 20);
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <SubPageLayout
      title="커뮤니티"
      description="여우들의 생생한 후기와 비밀 수다 공간"
      hideSearch={true}
    >
      <CommunityClient activeTab={activeTab} initialPosts={posts} totalPosts={total} isLoggedIn={isLoggedIn} />
    </SubPageLayout>
  );
}
