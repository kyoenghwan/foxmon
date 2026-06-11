import SubPageLayout from '@/components/layout/sub-page-layout';
import { CommunityClient } from './community-client';
import { getCommunityPosts } from '@/lib/actions/community';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import {
  canAccessCommunityBoard,
  getDefaultCommunityTab,
} from '@/lib/community-boards';

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  if (params.tab === 'notice') {
    redirect('/help');
  }
  if (params.tab === 'event') {
    redirect('/help?tab=이벤트');
  }
  const session = await auth();
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const guestGender = cookieStore.get('guest_gender')?.value;

  let userRole = (session?.user as { role?: string } | undefined)?.role ?? null;
  if (!userRole && guestGender === 'FEMALE') {
    userRole = 'GENERAL';
  }

  let activeTab = params.tab || getDefaultCommunityTab(userRole);

  if (!canAccessCommunityBoard(activeTab, userRole)) {
    activeTab = getDefaultCommunityTab(userRole);
    redirect(`/community?tab=${activeTab}`);
  }

  const { posts, total } = await getCommunityPosts(activeTab, 1, 20);
  const isLoggedIn = !!session?.user;

  return (
    <SubPageLayout
      title="커뮤니티"
      description="전체·여성·업소 회원별 게시판이 구분되어 있습니다"
      hideSearch={true}
    >
      <CommunityClient
        activeTab={activeTab}
        initialPosts={posts}
        totalPosts={total}
        isLoggedIn={isLoggedIn}
        userRole={userRole}
      />
    </SubPageLayout>
  );
}
