'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Crown, Zap, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getRotatedAds, AdItem } from '@/lib/ad-service';
import { PremiumJobCard } from '@/components/home/premium-job-card';
import { SpecialJobCard } from '@/components/home/special-job-card';
import { GeneralJobItem } from '@/components/home/general-job-item';
import { GeneralJobListRow } from '@/components/jobs/general-job-list-row';
import { AdPriceModal } from '@/components/jobs/AdPriceModal';
import { Button } from '@/components/ui/button';
import { RegionSelector } from '@/components/home/region-selector';
import { IndustrySelector } from '@/components/home/industry-selector';

interface JobsListContentProps {
    isEmployer?: boolean;
}

export function JobsListContent({ isEmployer }: JobsListContentProps) {
    const [premiumJobs, setPremiumJobs] = useState<AdItem[]>([]);
    const [specialJobs, setSpecialJobs] = useState<AdItem[]>([]);
    const [generalJobs, setGeneralJobs] = useState<AdItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchJobs() {
            setLoading(true);
            try {
                const [p, s, g] = await Promise.all([
                    getRotatedAds('PREMIUM', 20),
                    getRotatedAds('SPECIAL', 20),
                    getRotatedAds('GENERAL', 50)
                ]);
                setPremiumJobs(p);
                setSpecialJobs(s);
                setGeneralJobs(g);
            } catch (error) {
                console.error("Failed to fetch jobs:", error);
            }
            setLoading(false);
        }
        fetchJobs();
    }, []);

    // 🎨 [IMPACT DEMO] 22종 테마 전체 적용
    const impacts: any[] = [
        'gold', 'neon', 'neon_crazy', 'fire', 'ice', 'emerald', 'glitch', 'storm', 'ghost',
        'forest', 'ocean', 'sakura', 'galaxy', 'sun', 'lava', 'matrix', 'retro',
        'diamond', 'platinum', 'aura', 'candy', 'toxic'
    ];
    const demoJobs = Array.from({ length: 20 }, (_, i) => {
        const baseJob = premiumJobs.length > 0 
            ? premiumJobs[i % premiumJobs.length] 
            : {
                id: `mock-${i}`,
                company: `프리미엄 업체 ${i + 1}`,
                title: `최고의 대우 보장합니다 (${i + 1})`,
                location: '서울 강남구',
                pay: '[시급] 70,000원',
                image: '',
                impactType: 'none'
            };

        return {
            ...baseJob,
            id: `demo-${i}`,
            impactType: impacts[i % impacts.length]
        };
    });

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="font-bold text-gray-400">구인 정보를 불러오고 있습니다...</p>
            </div>
        );
    }

    // 프리미엄 & 스페셜 2줄 숨김 클래스 (Home과 동일한 그리드 기준)
    const twoRowPremiumSpecialGridClasses = `grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4xl:grid-cols-8 gap-2 sm:gap-3 xl:gap-4 w-full
        [&>*:nth-child(n+5)]:hidden 
        md:[&>*:nth-child(n+5)]:block md:[&>*:nth-child(n+7)]:hidden 
        xl:[&>*:nth-child(n+7)]:block xl:[&>*:nth-child(n+9)]:hidden 
        2xl:[&>*:nth-child(n+9)]:block 2xl:[&>*:nth-child(n+11)]:hidden 
        3xl:[&>*:nth-child(n+11)]:block 3xl:[&>*:nth-child(n+13)]:hidden
        4xl:[&>*:nth-child(n+13)]:block 4xl:[&>*:nth-child(n+17)]:hidden`;

    // 일반 광고 2줄 숨김 클래스
    const twoRowGeneralGridClasses = `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-2 sm:gap-3 w-full
        [&>*:nth-child(n+5)]:hidden 
        sm:[&>*:nth-child(n+5)]:block sm:[&>*:nth-child(n+7)]:hidden 
        md:[&>*:nth-child(n+7)]:block md:[&>*:nth-child(n+9)]:hidden 
        2xl:[&>*:nth-child(n+9)]:block 2xl:[&>*:nth-child(n+11)]:hidden 
        3xl:[&>*:nth-child(n+11)]:block 3xl:[&>*:nth-child(n+13)]:hidden`;

    return (
        <div className="space-y-12">
            {/* Top 20 Premium Banners (2 Rows) */}
            <section>
                <div className="flex items-center justify-between mb-6 border-b pb-4">
                    <div className="flex items-center gap-2">
                        <Crown className="w-6 h-6 text-primary fill-primary animate-bounce" />
                        <h2 className="text-2xl font-black text-gray-900 italic uppercase">
                            프리미엄 광고 (IMPACT DEMO)
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <AdPriceModal type="premium" title="Premium" />
                        {isEmployer && (
                            <Link href="/biz/ads/new">
                                <Button size="sm" className="hidden md:flex font-black h-9 px-4 rounded-lg shadow-sm active:scale-95 transition-transform text-white">
                                    <Plus className="w-4 h-4 mr-1" /> 프리미엄 등록
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
                {demoJobs.length > 0 ? (
                    <div className={twoRowPremiumSpecialGridClasses}>
                        {demoJobs.map((job) => (
                            <PremiumJobCard 
                                key={job.id} 
                                {...(job as any)} 
                                impactType={(job as any).impactType}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center">
                        <p className="text-gray-400 font-bold">등록된 프리미엄 공고가 없습니다.</p>
                    </div>
                )}
            </section>

            {/* Special 20 Banners (2 Rows) */}
            <section>
                <div className="flex items-center justify-between mb-6 border-b pb-4">
                    <div className="flex items-center gap-2">
                        <Zap className="w-6 h-6 text-yellow-500 animate-pulse" />
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2 italic uppercase">
                            스페셜 광고
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <AdPriceModal type="special" title="Special" />
                        {isEmployer && (
                            <Link href="/biz/ads/new" className="flex items-center gap-1.5 px-4 py-1.5 bg-yellow-400 text-black text-[11px] font-black rounded-lg hover:scale-105 transition-transform shadow-sm">
                                <Plus className="w-3.5 h-3.5" /> 스페셜 등록
                            </Link>
                        )}
                    </div>
                </div>
                {specialJobs.length > 0 ? (
                    <div className={twoRowPremiumSpecialGridClasses}>
                        {specialJobs.map((job) => (
                            <SpecialJobCard key={job.id} {...(job as any)} />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center">
                        <p className="text-gray-400 font-bold">등록된 스페셜 공고가 없습니다.</p>
                    </div>
                )}
            </section>

            {/* General Job Cards (2 Rows) */}
            <section>
                <div className="flex items-center justify-between mb-6 border-b pb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black text-gray-900 italic uppercase">
                            일반 광고
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <AdPriceModal type="line" title="Line" />
                        {isEmployer && (
                            <Link href="/biz/ads/new" className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-[11px] font-bold rounded-lg hover:bg-gray-50 transition-colors">
                                <Plus className="w-3.5 h-3.5" /> 일반 등록
                            </Link>
                        )}
                    </div>
                </div>
                {generalJobs.length > 0 ? (
                    <div className={twoRowPremiumSpecialGridClasses}>
                        {generalJobs.map((job) => (
                            <GeneralJobItem key={job.id} {...(job as any)} />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center">
                        <p className="text-gray-400 font-bold">등록된 일반 광고가 없습니다.</p>
                    </div>
                )}
            </section>

            {/* Search Condition Card */}
            <section className="bg-white rounded-xl p-4 border shadow-sm space-y-4">
                {/* Region Selection */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <h2 className="text-[13px] font-extrabold flex items-center gap-2 text-gray-800 w-full sm:w-24 shrink-0 mt-1 sm:mt-2">
                        <span className="w-1.5 h-3.5 bg-primary rounded-full" />
                        지역 선택
                    </h2>
                    <div className="flex-1 overflow-x-auto pb-1">
                        <RegionSelector />
                    </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Industry Selection */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <h2 className="text-[13px] font-extrabold flex items-center gap-2 text-gray-800 w-full sm:w-24 shrink-0 mt-1 sm:mt-2">
                        <span className="w-1.5 h-3.5 bg-orange-400 rounded-full" />
                        업종 선택
                    </h2>
                    <div className="flex-1 overflow-x-auto pb-1">
                        <IndustrySelector />
                    </div>
                </div>
            </section>

            {/* General Jobs List */}
            <section>
                <div className="mb-4 flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-[15px] font-black text-gray-800 tracking-tight flex items-center gap-1.5">
                            <span className="bg-[#ff8a00] text-white w-4 h-4 flex items-center justify-center rounded-sm text-[10px] shadow-sm tracking-tighter shrink-0 pt-[1px] pl-[1px]">&gt;</span> 
                            구인정보 리스트
                        </h2>
                    </div>
                    {isEmployer && (
                        <Link href="/biz/ads/new" className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white text-[11px] font-black rounded-lg hover:bg-gray-700 transition-colors shadow-sm">
                            <Plus className="w-3.5 h-3.5" /> 구인구직 글 올리기
                        </Link>
                    )}
                </div>
                {generalJobs.length > 0 ? (
                    <div className="bg-white border-t-2 border-gray-400 overflow-x-auto overflow-y-hidden shadow-sm">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-[#f8f8f8] border-b border-gray-200 text-gray-600 text-[12px] font-bold">
                                    <th className="py-2.5 px-4 font-bold text-center w-[15%]">근무지</th>
                                    <th className="py-2.5 px-4 font-bold text-center w-[40%]">채용제목</th>
                                    <th className="py-2.5 px-4 font-bold text-center w-[15%]">닉네임</th>
                                    <th className="py-2.5 px-4 font-bold text-center w-[10%] hidden md:table-cell">성별</th>
                                    <th className="py-2.5 px-4 font-bold text-center w-[10%]">급여</th>
                                    <th className="py-2.5 px-4 font-bold text-center w-[10%] hidden sm:table-cell">마감일</th>
                                </tr>
                            </thead>
                            <tbody>
                                {generalJobs.map((job) => (
                                    <GeneralJobListRow key={job.id} {...(job as any)} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-12 bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center">
                        <p className="text-gray-400 font-bold">등록된 일반 구인 공고가 없습니다.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
