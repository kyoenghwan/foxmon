import SubPageLayout from '@/components/layout/sub-page-layout';
import { CommunityClient } from './community-client';

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params.tab || 'free';

  return (
    <SubPageLayout
      title="커뮤니티"
      description="여우들의 생생한 후기와 비밀 수다 공간"
      hideSearch={true}
    >
      <CommunityClient activeTab={activeTab} />
    </SubPageLayout>
  );
}
