import Link from 'next/link';
import { auth } from '@/auth';
import { MainHeader } from '@/components/layout/main-header';
import { RegionSelector } from '@/components/home/region-selector';
import { IndustrySelector } from '@/components/home/industry-selector';
import { HeroSection } from '@/components/home/hero-section';
import { SideBanners } from '@/components/home/side-banners';

interface PageProps {
    title: string;
    description?: string;
    hideSearch?: boolean;
}

export default async function SubPageLayout({ title, description, hideSearch = false, children }: PageProps & { children?: React.ReactNode }) {
    const session = await auth();

    return (
        <div className="flex flex-col min-h-screen bg-white relative">
            <SideBanners />
            <MainHeader session={session} />

            {/* Hero Section: 배너 및 로그인 정보 (공통 컴포넌트 적용) */}
            <HeroSection session={session} />

            <main className="container px-4 md:px-6 py-8 space-y-6 text-black">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href="/" className="hover:text-primary transition-colors">홈</Link>
                    <span>/</span>
                    <span className="text-gray-900 font-medium">{title}</span>
                </div>

                {/* Page Title - More compact */}
                <div className="flex items-baseline gap-4">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
                    {description && <p className="text-sm text-gray-500">{description}</p>}
                </div>

                {/* Search Condition Card - Slimmed down by half */}
                {!hideSearch && (
                    <section className="bg-white rounded-xl p-4 border shadow-sm space-y-4">
                        {/* Region Selection */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                            <h2 className="text-[13px] font-extrabold flex items-center gap-2 text-gray-800 w-full sm:w-24 shrink-0 mt-1 sm:mt-2">
                                <span className="w-1.5 h-3.5 bg-primary rounded-full" />
                                지역 선택
                            </h2>
                            <div className="flex-1 overflow-x-auto pb-1">
                                <RegionSelector />
                            </div>
                        </div>

                        <div className="border-t border-gray-100" />

                        {/* Industry Selection */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                            <h2 className="text-[13px] font-extrabold flex items-center gap-2 text-gray-800 w-full sm:w-24 shrink-0 mt-1 sm:mt-2">
                                <span className="w-1.5 h-3.5 bg-orange-400 rounded-full" />
                                업종 선택
                            </h2>
                            <div className="flex-1 overflow-x-auto pb-1">
                                <IndustrySelector />
                            </div>
                        </div>
                    </section>
                )}

                {/* Content Area */}
                <div className="min-h-[300px]">
                    {children || (
                        <div className="flex items-center justify-center p-12 border-2 border-dashed rounded-xl bg-gray-50/50">
                            <p className="text-gray-400 font-medium">{title} 목록을 준비 중입니다.</p>
                        </div>
                    )}
                </div>
            </main>

            <footer className="bg-gray-50 py-10 border-t mt-12">
                <div className="container px-4 text-xs text-gray-400 text-center">
                    <p>© Foxmon Inc. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
