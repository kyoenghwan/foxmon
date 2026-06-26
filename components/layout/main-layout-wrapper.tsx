'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SideBanners } from '@/components/home/side-banners';
import { MainHeader } from '@/components/layout/main-header';
import { MainBanner } from '@/components/home/main-banner';
import { LoginInfoBox } from '@/components/home/login-info-box';
import { MainFooter } from '@/components/layout/main-footer';

interface MainLayoutWrapperProps {
    children: React.ReactNode;
}

export function MainLayoutWrapper({ children }: MainLayoutWrapperProps) {
    const pathname = usePathname() || '';
    const { data: session } = useSession();

    // 헤더/배너 레이아웃 제외 경로 판단
    const isExcluded = 
        pathname.startsWith('/fox-office') ||
        pathname.startsWith('/biz') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/age-gate') ||
        pathname.startsWith('/find-account') ||
        pathname.startsWith('/employer') ||
        pathname.startsWith('/job-seeker') ||
        pathname.startsWith('/render-banners');

    if (isExcluded) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-white relative">
            <SideBanners />
            <MainHeader session={session} />

            <main className="flex-1 flex flex-col w-full relative">
                {/* 상단 고정 영역 (메인 배너 & 데스크톱 로그인 정보) */}
                <div className="sticky top-[96px] tablet:top-[144px] z-30 bg-gray-50 border-b w-full shrink-0">
                    <div className="container mx-auto px-4 py-4 md:py-6">
                        <div className="relative flex flex-col tablet:flex-row gap-3 tablet:gap-6 items-stretch tablet:h-[203px]">
                            {/* 메인 배너: 모바일/데스크톱 항시 노출 및 상단 고정 */}
                            <div className="w-full tablet:flex-1 tablet:h-[203px] overflow-hidden rounded-xl bg-white shadow-sm">
                                <div className="w-full h-full">
                                    <MainBanner />
                                </div>
                            </div>

                            {/* 유저 로그인 정보 박스 (데스크톱 전용: 배너 우측에 함께 고정) */}
                            <div className="hidden tablet:block w-full tablet:w-[320px] tablet:h-[203px] z-20 shrink-0">
                                <LoginInfoBox session={session} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 하단 스크롤 영역 */}
                <div className="flex-1 flex flex-col w-full">
                    {/* 유저 로그인 정보 박스 (모바일 전용: 스크롤 영역 상단 배치로 스크롤 시 위로 이동) */}
                    <div className="block tablet:hidden w-full container mx-auto px-4 pt-4 z-20">
                        <LoginInfoBox session={session} />
                    </div>
                    {children}
                </div>
            </main>

            <MainFooter />
        </div>
    );
}
