'use client';

import { MainBanner } from './main-banner';
import { LoginInfoBox } from './login-info-box';

interface HeroSectionProps {
    session: any;
}

/**
 * HeroSection Component
 * 메인 배너와 로그인 정보 박스를 포함하는 상단 공통 섹션입니다.
 * 모든 페이지에서 일관된 상단 레이아웃을 유지하기 위해 사용됩니다.
 */
export function HeroSection({ session }: HeroSectionProps) {
    return (
        <section className="bg-gray-50 py-6 border-b">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col lg:flex-row gap-6 lg:h-[200px]">
                    {/* 좌측: 메인 공고 배너 슬라이더 */}
                    <div className="flex-1 min-w-0 h-full">
                        <MainBanner />
                    </div>

                    {/* 우측: 유저 로그인/커뮤니티 정보 박스 */}
                    <div className="w-full lg:w-[320px] h-full flex-shrink-0">
                        <LoginInfoBox session={session} />
                    </div>
                </div>
            </div>
        </section>
    );
}
