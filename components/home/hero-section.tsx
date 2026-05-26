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
            <div className="w-full container mx-auto px-4">
                <div className="relative flex flex-col tablet:flex-row gap-3 tablet:gap-6 items-stretch tablet:h-[203px]">
                    {/* 상단/좌측: 메인 공고 배너 슬라이더 (PC: 로그인 정보 박스를 제외한 나머지 영역 flex-1로 렌더링) */}
                    <div className="w-full tablet:flex-1 tablet:h-[203px] overflow-hidden rounded-xl">
                        <div className="w-full h-full">
                            <MainBanner />
                        </div>
                    </div>

                    {/* 하단/우측: 유저 로그인/커뮤니티 정보 박스 (PC: 우측에 수평 정렬로 배치, absolute 해제) */}
                    <div className="w-full tablet:w-[320px] tablet:h-[203px] mt-0 tablet:mt-0 z-20 shrink-0">
                        <LoginInfoBox session={session} />
                    </div>
                </div>
            </div>
        </section>
    );
}

