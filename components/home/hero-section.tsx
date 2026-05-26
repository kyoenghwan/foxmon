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
                <div className="relative flex flex-col min-[800px]:block min-[800px]:h-[203px]">
                    {/* 상단/좌측: 메인 공고 배너 슬라이더 (PC: 1172px 전체 채움, 우측 일부가 로그인 정보 박스 아래로 겹침) */}
                    <div className="w-full min-[800px]:w-full min-[800px]:h-[203px] overflow-hidden rounded-xl">
                        <div className="w-full h-full">
                            <MainBanner />
                        </div>
                    </div>

                    {/* 하단/우측: 유저 로그인/커뮤니티 정보 박스 (PC: 배너 우측 상단 위에 absolute overlay로 배치) */}
                    <div className="w-full min-[800px]:absolute min-[800px]:right-0 min-[800px]:top-0 min-[800px]:w-[320px] min-[800px]:h-[203px] mt-6 min-[800px]:mt-0 z-20">
                        <LoginInfoBox session={session} />
                    </div>
                </div>
            </div>
        </section>
    );
}

