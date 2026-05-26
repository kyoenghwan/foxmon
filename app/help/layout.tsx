import { Suspense } from 'react';
import { MainHeader } from '@/components/layout/main-header';
import { HelpSidebar } from '@/components/help/HelpSidebar';
import { SideBanners } from '@/components/home/side-banners';
import { auth } from '@/auth';
import { MainFooter } from '@/components/layout/main-footer';

export default async function HelpLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    return (
        <div className="flex flex-col min-h-screen bg-white relative">
            <MainHeader session={session} />
            <SideBanners />

            {/* 서브 헤더 */}
            <div className="bg-gray-50 border-b border-gray-200">
                <div className="container px-4 md:px-6 py-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500 text-white rounded-full text-[11px] font-black">
                        💬 고객센터
                    </span>
                    <span className="text-[13px] text-gray-500 font-medium">
                        궁금하신 사항은 언제든 문의해 주세요.
                    </span>
                </div>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="container px-4 md:px-6 py-6 flex-1">
                <div className="lg:hidden mb-4 sticky top-[136px] z-20 bg-white border-b pb-2">
                    <Suspense fallback={<div className="h-10" />}>
                        <HelpSidebar isMobile />
                    </Suspense>
                </div>
                <div className="flex gap-6 items-start">
                    <div className="w-52 shrink-0 sticky top-[130px] hidden lg:block">
                        <Suspense fallback={<div className="w-52" />}>
                            <HelpSidebar />
                        </Suspense>
                    </div>
                    <div className="flex-1 min-w-0">
                        {children}
                    </div>
                </div>
            </div>
            <MainFooter />
        </div>
    );
}
