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
            <div className="container px-4">
                <div className="flex flex-col min-[980px]:flex-row lg:flex-col gap-6 items-center justify-center min-[980px]:justify-between lg:justify-center max-w-[970px] lg:max-w-full mx-auto">
                    {/* 상단: 메인 공고 배너 슬라이더 */}
                    <div className="w-full min-[980px]:w-auto flex justify-center max-[639px]:aspect-[2/1] sm:h-[138px] lg:h-[200px] flex-shrink-0">
                        <div className="w-full max-w-[568px] lg:max-w-[816px] h-full">
                            <MainBanner />
                        </div>
                    </div>

                    {/* 하단/우측: 유저 로그인/커뮤니티 정보 박스 */}
                    <div className="w-full min-[980px]:w-[320px] lg:w-full max-w-[425px] sm:max-w-[320px] flex-shrink-0 flex items-center justify-center">
                        <LoginInfoBox session={session} />
                    </div>
                </div>
            </div>
        </section>
    );
}
