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
            <div className="w-full container lg:max-w-[1172px] lg:!max-w-[1172px] mx-auto px-4">
                <div className="flex flex-col min-[800px]:flex-row gap-6 items-center min-[800px]:items-stretch justify-center min-[800px]:justify-between">
                    {/* 상단/좌측: 메인 공고 배너 슬라이더 (PC: 828px * 203px 고정) */}
                    <div className="w-full min-[800px]:max-w-[406px] lg:max-w-[828px] max-[799px]:aspect-[3/1] min-[800px]:h-[203px] flex justify-center flex-shrink-0">
                        <div className="w-full h-full">
                            <MainBanner />
                        </div>
                    </div>

                    {/* 하단/우측: 유저 로그인/커뮤니티 정보 박스 (PC: 320px * 203px 고정) */}
                    <div className="w-full min-[800px]:max-w-[320px] h-auto min-[800px]:h-[203px] flex-shrink-0 flex items-center justify-center min-[800px]:items-stretch min-[800px]:self-stretch">
                        <LoginInfoBox session={session} />
                    </div>
                </div>
            </div>
        </section>
    );
}

