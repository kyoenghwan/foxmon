import { HeroSection } from '@/components/home/hero-section';
import { SideBanners } from '@/components/home/side-banners';
import { MainHeader } from '@/components/layout/main-header';
import { HomeJobSections } from '@/components/home/home-job-sections';
import { auth } from '@/auth';
import Link from 'next/link';
import { QA_GET_ACTIVE_BANNERS } from '@/src/atoms/qa/public/QA_GET_ACTIVE_BANNERS';
import { SiteBannerPopup } from '@/components/common/SiteBannerPopup';
import { MainFooter } from '@/components/layout/main-footer';

export default async function Home() {
  const session = await auth();
  const activePopups = await QA_GET_ACTIVE_BANNERS('POPUP');

  return (
    <div className="flex flex-col min-h-screen bg-white relative">
      <SiteBannerPopup banners={activePopups} />
      <SideBanners />
      <MainHeader session={session} />

      {/* Hero Section: 배너 및 로그인 정보 (공통 컴포넌트) */}
      <HeroSection session={session} />

      {/* Localized Job Sections (Firestore Real-time Data) */}
      <HomeJobSections />

      <MainFooter />
    </div>
  );
}
