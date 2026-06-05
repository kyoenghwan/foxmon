import { HomeJobSections } from '@/components/home/home-job-sections';
import { auth } from '@/auth';
import { QA_GET_ACTIVE_BANNERS } from '@/src/atoms/qa/public/QA_GET_ACTIVE_BANNERS';
import { SiteBannerPopup } from '@/components/common/SiteBannerPopup';
import { AgeGateFacade } from '@/components/home/age-gate-facade';

export default async function Home() {
  console.time('⏳ [Performance] Home Server Components Load');
  
  console.time('  ↳ [1] Auth Session check');
  const session = await auth();
  console.timeEnd('  ↳ [1] Auth Session check');
  
  console.time('  ↳ [2] QA_GET_ACTIVE_BANNERS (POPUP)');
  const activePopups = await QA_GET_ACTIVE_BANNERS('POPUP');
  console.timeEnd('  ↳ [2] QA_GET_ACTIVE_BANNERS (POPUP)');
  
  console.timeEnd('⏳ [Performance] Home Server Components Load');

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
