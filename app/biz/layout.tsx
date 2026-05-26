import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { MainHeader } from '@/components/layout/main-header';
import { BizSidebar } from '@/components/biz/BizSidebar';
import { SideBanners } from '@/components/home/side-banners';
import Link from 'next/link';
import { MainFooter } from '@/components/layout/main-footer';
import { HeroSection } from '@/components/home/hero-section';

export default async function BizLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    // EMPLOYER, ADMIN, SUPER_ADMIN만 접근 허용
    const role = (session?.user as any)?.role;
    const allowedRoles = ['EMPLOYER', 'ADMIN', 'SUPER_ADMIN'];

    if (!session?.user || !allowedRoles.includes(role)) {
        redirect('/');
    }

    return (
        <div className="flex flex-col min-h-screen bg-white relative">
            <SideBanners />
            {/* 기존 메인 헤더 재사용 */}
            <MainHeader session={session} />

            {/* Hero Section: 배너 및 로그인 정보 (공통 컴포넌트 적용) */}
            <HeroSection session={session} />

            {/* 공지사항 스타일 서브 헤더 */}
            <div className="bg-gray-50 border-b border-gray-200">
                <div className="container px-4 md:px-6 py-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary text-white rounded-full text-[11px] font-black whitespace-nowrap">
                        🏢 업체관리
                    </span>
                    <span className="text-[11px] md:text-[13px] text-gray-500 font-medium truncate">
                        광고 · 포인트 · 지원자를 한 곳에서 관리하세요.
                    </span>
                </div>
            </div>

            {/* 메인 콘텐츠 영역 (사이드바 + 페이지) */}
            <div className="container px-4 md:px-6 py-6 flex-1">
                <div className="mb-3 sticky top-[136px] z-20 bg-white border-b pb-1">
                    <BizSidebar isMobile />
                </div>
                <div className="min-w-0">
                    {children}
                </div>
            </div>

            {/* 푸터 */}
            <MainFooter />
        </div>
    );
}
