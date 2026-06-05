import { HomeJobSections } from '@/components/home/home-job-sections';
import { auth } from '@/auth';
import { QA_GET_ACTIVE_BANNERS } from '@/src/atoms/qa/public/QA_GET_ACTIVE_BANNERS';
import { SiteBannerPopup } from '@/components/common/SiteBannerPopup';
import { AgeGateFacade } from '@/components/home/age-gate-facade';

export default async function Home() {
  const session = await auth();
  const activePopups = await QA_GET_ACTIVE_BANNERS('POPUP');

  // 세션이 없는 비로그인 유저인 경우 (포트원 사전검증 로봇 및 일반 성인인증 미검증 유입)
  if (!session?.user) {
    return <AgeGateFacade />;
  }

  return (
    <>
      <SiteBannerPopup banners={activePopups} />
      <HomeJobSections />
    </>
  );
}
