import React from 'react';
import { MyPageSidebar } from '@/components/mypage/MyPageSidebar';

export default function MyPageLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-10">
            {/* 모바일 가로 스크롤 메뉴 */}
            <div className="block md:hidden mb-4">
                <MyPageSidebar isMobile={true} />
            </div>

            <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
                {/* 데스크톱 세로 사이드바 */}
                <div className="hidden md:block">
                    <MyPageSidebar isMobile={false} />
                </div>

                {/* 콘텐츠 영역 */}
                <div className="flex-1 w-full min-w-0 bg-white md:bg-transparent rounded-2xl md:rounded-none">
                    {children}
                </div>
            </div>
        </div>
    );
}
