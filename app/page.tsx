import { HomeJobSections } from '@/components/home/home-job-sections';
import { QA_GET_ACTIVE_BANNERS } from '@/src/atoms/qa/public/QA_GET_ACTIVE_BANNERS';
import { QA_GET_PUBLIC_SEEKER_ADS } from '@/src/atoms/qa/resume/QA_GET_PUBLIC_SEEKER_ADS';
import { SiteBannerPopup } from '@/components/common/SiteBannerPopup';
import { getRotatedAds } from '@/lib/ad-service';

export default async function Home() {
  console.time('⏳ [Performance] Home Server Components Load');
  
  const [activePopups, [sideAds, premiumMainAds, premiumJobs, specialJobs, lineJobs, generalJobs], seekerRes] = await Promise.all([
      QA_GET_ACTIVE_BANNERS('POPUP'),
      Promise.all([
          getRotatedAds('SIDE', 8),
          getRotatedAds('PREMIUM_MAIN', 5),
          getRotatedAds('PREMIUM', 50),
          getRotatedAds('SPECIAL', 50),
          getRotatedAds('AD_GENERAL', 50),
          getRotatedAds('GENERAL', 50)
      ]),
      QA_GET_PUBLIC_SEEKER_ADS()
  ]);

  console.timeEnd('⏳ [Performance] Home Server Components Load');

  const seekerAds = (seekerRes.success && seekerRes.data) ? seekerRes.data : [];

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
              generalJobs,
              seekerAds
          }}
      />
    </>
  );
}
