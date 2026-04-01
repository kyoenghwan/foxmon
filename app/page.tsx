import { HeroSection } from '@/components/home/hero-section';
import { SideBanners } from '@/components/home/side-banners';
import { MainHeader } from '@/components/layout/main-header';
import { HomeJobSections } from '@/components/home/home-job-sections';
import { auth } from '@/auth';
import Link from 'next/link';

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col min-h-screen bg-white relative">
      <SideBanners />
      <MainHeader session={session} />

      {/* Hero Section: 배너 및 로그인 정보 (공통 컴포넌트) */}
      <HeroSection session={session} />

      {/* Localized Job Sections (Firestore Real-time Data) */}
      <HomeJobSections />

      <footer className="bg-gray-100 border-t py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center gap-4">
            <img src="/logo.png" alt="FOXMON" className="h-8 opacity-50 grayscale" />
            <div className="flex gap-6 text-sm text-gray-500 font-medium">
              <Link href="#" className="hover:text-primary">About Us</Link>
              <Link href="#" className="hover:text-primary">Terms of Service</Link>
              <Link href="#" className="hover:text-primary">Privacy Policy</Link>
              <Link href="#" className="hover:text-primary">Customer Support</Link>
            </div>
            <div className="text-center mt-6">
              <p className="text-gray-400 text-xs mb-2 leading-relaxed">
                CEO: Kyoen | Address: 123 Digital-ro, Guro-gu, Seoul <br />
                Registration No: 123-45-67890 | Contact: help@foxmon.com
              </p>
              <p className="text-gray-400">© Foxmon Inc. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
