import { HeroSection } from '@/components/home/hero-section';
import { SideBanners } from '@/components/home/side-banners';
import { MainHeader } from '@/components/layout/main-header';
import { HomeJobSections } from '@/components/home/home-job-sections';
import { auth } from '@/auth';
import Link from 'next/link';
import { QA_GET_ACTIVE_BANNERS } from '@/src/atoms/qa/public/QA_GET_ACTIVE_BANNERS';
import { SiteBannerPopup } from '@/components/common/SiteBannerPopup';
import { MainFooter } from '@/components/layout/main-footer';
import { AgeGateFacade } from '@/components/home/age-gate-facade';

export default async function Home() {
  const session = await auth();
  const activePopups = await QA_GET_ACTIVE_BANNERS('POPUP');

  // 세션이 없는 비로그인 유저인 경우 (포트원 사전검증 로봇 및 일반 성인인증 미검증 유입)
  if (!session?.user) {
    return <AgeGateFacade />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white relative">
      <SiteBannerPopup banners={activePopups} />
      <SideBanners />
      <MainHeader session={session} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full">
        {/* Hero Section: 배너 및 로그인 정보 (공통 컴포넌트) */}
        <HeroSection session={session} />

        {/* Localized Job Sections (Firestore Real-time Data) */}
        <HomeJobSections />
      </main>

      <MainFooter />
    </div>
  );
}
