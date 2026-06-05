import { Suspense } from 'react';
import { HelpSidebar } from '@/components/help/HelpSidebar';

export default function HelpLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
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
            <div className="container px-4 md:px-6 py-6 flex-1 text-black">
                <div className="mb-4 sticky top-[136px] z-20 bg-white border-b pb-2">
                    <Suspense fallback={<div className="h-10" />}>
                        <HelpSidebar isMobile />
                    </Suspense>
                </div>
                <div className="min-w-0">
                    {children}
                </div>
            </div>
        </>
    );
}
