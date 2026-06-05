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

  if (!session?.user) {
    console.timeEnd('⏳ [Performance] Home Server Components Load');
    return <AgeGateFacade />;
  }
  
  console.time('  ↳ [2] Fetch POPUP data');
  const activePopups = await QA_GET_ACTIVE_BANNERS('POPUP');
  console.timeEnd('  ↳ [2] Fetch POPUP data');
  
  console.timeEnd('⏳ [Performance] Home Server Components Load');

  return (
    <>
      <SiteBannerPopup banners={activePopups} />
      <HomeJobSections />
    </>
  );
}
