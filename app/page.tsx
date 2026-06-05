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
  
  console.time('  ↳ [2] Parallel fetch POPUP and Ads data');
  const [activePopups, [sideAds, premiumMainAds, premiumJobs, specialJobs, lineJobs, generalJobs]] = await Promise.all([
      QA_GET_ACTIVE_BANNERS('POPUP'),
      Promise.all([
          getRotatedAds('SIDE', 8),
          getRotatedAds('PREMIUM_MAIN', 5),
          getRotatedAds('PREMIUM', 50),
          getRotatedAds('SPECIAL', 50),
          getRotatedAds('AD_GENERAL', 50),
          getRotatedAds('GENERAL', 50)
      ])
  ]);
  console.timeEnd('  ↳ [2] Parallel fetch POPUP and Ads data');
  
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
