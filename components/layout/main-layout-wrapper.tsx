'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SideBanners } from '@/components/home/side-banners';
import { MainHeader } from '@/components/layout/main-header';
import { HeroSection } from '@/components/home/hero-section';
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
        pathname.startsWith('/job-seeker');

    if (isExcluded) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-white relative">
            <SideBanners />
            <MainHeader session={session} />

            <main className="flex-1 flex flex-col w-full">
                <HeroSection session={session} />
                {children}
            </main>

            <MainFooter />
        </div>
    );
}
