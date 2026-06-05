import { HomeJobSections } from '@/components/home/home-job-sections';
import { auth } from '@/auth';
import { QA_GET_ACTIVE_BANNERS } from '@/src/atoms/qa/public/QA_GET_ACTIVE_BANNERS';
import { SiteBannerPopup } from '@/components/common/SiteBannerPopup';
import { AgeGateFacade } from '@/components/home/age-gate-facade';
import { getRotatedAds } from '@/lib/ad-service';

export default async function Home() {
  console.time('⏳ [Performance] Home Server Components Load');
  
  console.time('  ↳ [1] Auth Session check');
  const session = await auth();
  console.timeEnd('  ↳ [1] Auth Session check');

  if (!session?.user) {
    console.timeEnd('⏳ [Performance] Home Server Components Load');
    return <AgeGateFacade />;
  }
  
  console.time('  ↳ [2] QA_GET_ACTIVE_BANNERS (POPUP)');
  const activePopups = await QA_GET_ACTIVE_BANNERS('POPUP');
  console.timeEnd('  ↳ [2] QA_GET_ACTIVE_BANNERS (POPUP)');

  console.time('  ↳ [3] Prefetch ads data (Promise.all)');
  const [sideAds, premiumMainAds, premiumJobs, specialJobs, lineJobs, generalJobs] = await Promise.all([
      getRotatedAds('SIDE', 8),
      getRotatedAds('PREMIUM_MAIN', 5),
      getRotatedAds('PREMIUM', 50),
      getRotatedAds('SPECIAL', 50),
      getRotatedAds('AD_GENERAL', 50),
      getRotatedAds('GENERAL', 50)
  ]);
  console.timeEnd('  ↳ [3] Prefetch ads data (Promise.all)');
  
  console.timeEnd('⏳ [Performance] Home Server Components Load');

  return (
    <>
      <SiteBannerPopup banners={activePopups} />
      <HomeJobSections 
          initialData={{
              sideAds,
              premiumMainAds,
              premiumJobs,
              specialJobs,
              lineJobs,
              generalJobs
          }}
      />
    </>
  );
}
