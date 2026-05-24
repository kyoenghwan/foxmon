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
            <div className="w-full max-w-[1172px] mx-auto px-4">
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-stretch justify-center md:justify-between">
                    {/* 상단/좌측: 메인 공고 배너 슬라이더 (PC: 828px * 203px 고정) */}
                    <div className="w-full md:w-[828px] h-auto md:h-[203px] flex justify-center max-[639px]:aspect-[2/1] flex-shrink-0">
                        <div className="w-full h-full">
                            <MainBanner />
                        </div>
                    </div>

                    {/* 하단/우측: 유저 로그인/커뮤니티 정보 박스 (PC: 320px * 203px 고정) */}
                    <div className="w-full md:w-[320px] md:h-[203px] max-w-[425px] sm:max-w-[320px] md:max-w-none flex-shrink-0 flex items-center justify-center md:items-stretch md:self-stretch">
                        <LoginInfoBox session={session} />
                    </div>
                </div>
            </div>
        </section>
    );
}
