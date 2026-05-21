'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Crown, Zap, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getRotatedAds, AdItem } from '@/lib/ad-service';
import { PremiumJobCard } from '@/components/home/premium-job-card';
import { GeneralJobListRow } from '@/components/jobs/general-job-list-row';
import { AdPriceModal } from '@/components/jobs/AdPriceModal';
import { Button } from '@/components/ui/button';
import { RegionSelector } from '@/components/home/region-selector';
import { IndustrySelector } from '@/components/home/industry-selector';

interface JobsListContentProps {
    isEmployer?: boolean;
    searchQuery?: string;
}

export function JobsListContent({ isEmployer, searchQuery }: JobsListContentProps) {
    const [premiumJobs, setPremiumJobs] = useState<AdItem[]>([]);
    const [specialJobs, setSpecialJobs] = useState<AdItem[]>([]);
    const [lineJobs, setLineJobs] = useState<AdItem[]>([]);
    const [generalJobs, setGeneralJobs] = useState<AdItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination state for the list table
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        async function fetchJobs() {
            setLoading(true);
            try {
                const [p, s, l, g] = await Promise.all([
                    getRotatedAds('PREMIUM', 50, searchQuery),
                    getRotatedAds('SPECIAL', 50, searchQuery),
                    getRotatedAds('LINE', 50, searchQuery),
                    getRotatedAds('GENERAL', 50, searchQuery)
                ]);
                setPremiumJobs(p);
                setSpecialJobs(s);
                setLineJobs(l);
                setGeneralJobs(g);
            } catch (error) {
                console.error("Failed to fetch jobs:", error);
            }
            setLoading(false);
        }
        fetchJobs();
    }, [searchQuery]);

    // 🎨 [IMPACT DEMO] 22종 테마 전체 적용
    const impacts: any[] = [
        'gold', 'neon', 'neon_crazy', 'fire', 'ice', 'emerald', 'glitch', 'storm', 'ghost',
        'forest', 'ocean', 'sakura', 'galaxy', 'sun', 'lava', 'matrix', 'retro',
        'diamond', 'platinum', 'aura', 'candy', 'toxic'
    ];
    
    const demoJobs = premiumJobs.length > 0 
        ? premiumJobs.map((job, i) => ({
            ...job,
            impactType: impacts[i % impacts.length]
          }))
        : searchQuery 
            ? [] 
            : Array.from({ length: 20 }, (_, i) => ({
                id: `mock-${i}`,
                company: `프리미엄 광고 ${i + 1}`,
                title: `최고의 대우 보장합니다 (${i + 1})`,
                location: '서울 강남구',
                pay: '[시급] 70,000원',
                image: '',
                impactType: impacts[i % impacts.length],
                is_big: false,
                tier: 'PREMIUM' as const,
                weight: 1,
                exposure_count: 0,
                last_exposed_at: ''
              }));

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="font-bold text-gray-400">구인 정보를 불러오고 있습니다...</p>
            </div>
        );
    }

    // 프리미엄, 스페셜, 일반 모두 2줄 고정 
    const twoRowPremiumSpecialGridClasses = `limit-2-rows grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 4xl:grid-cols-8 gap-2 sm:gap-3 xl:gap-4 w-full`;

    // Pagination logic
    const totalPages = Math.ceil(generalJobs.length / ITEMS_PER_PAGE);
    const paginatedTableJobs = generalJobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
                        <Link href="/jobs" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
                            전체보기 <ChevronRight className="w-4 h-4" />
                        </Link>
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
                        <p className="text-gray-400 font-bold">등록된 프리미엄 광고가 없습니다.</p>
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
                        <Link href="/jobs" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
                            전체보기 <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
                {specialJobs.length > 0 ? (
                    <div className={twoRowPremiumSpecialGridClasses}>
                        {specialJobs.map((job) => (
                            <PremiumJobCard key={job.id} {...(job as any)} impactType="none" effectIntensity="none" tier="SPECIAL" customColor={(job as any).color} />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center">
                        <p className="text-gray-400 font-bold">등록된 스페셜 광고가 없습니다.</p>
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
                        <Link href="/jobs" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
                            전체보기 <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
                {lineJobs.length > 0 ? (
                    <div className={twoRowPremiumSpecialGridClasses}>
                        {lineJobs.map((job) => (
                            <PremiumJobCard key={job.id} {...(job as any)} impactType="none" effectIntensity="none" hideLogo={true} tier="GENERAL" customColor={(job as any).color} />
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
                    <div className="bg-white border-t-2 border-gray-900 shadow-sm rounded-b-xl overflow-x-auto">
                        <table className="w-full min-w-[800px] text-center text-[13px] md:text-[14px]">
                            <thead className="border-b border-gray-200 text-gray-700 font-bold bg-white">
                                <tr>
                                    <th className="py-3 px-2 w-[15%] font-semibold">업체명</th>
                                    <th className="py-3 px-4 w-[45%] text-left font-semibold">제목</th>
                                    <th className="py-3 px-2 w-[15%] font-semibold text-gray-500">근무지역</th>
                                    <th className="py-3 px-2 w-[15%] font-semibold text-gray-500">급여</th>
                                    <th className="py-3 px-2 w-[10%] font-semibold text-gray-500">등록일</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedTableJobs.map((job) => (
                                    <GeneralJobListRow key={job.id} {...(job as any)} />
                                ))}
                            </tbody>
                        </table>
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-1.5 py-6">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 border border-gray-200 rounded-md text-[13px] font-bold text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                                >
                                    이전
                                </button>
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-md text-[13px] font-bold transition-colors ${
                                            currentPage === i + 1 
                                                ? 'bg-gray-800 text-white border-transparent' 
                                                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 border border-gray-200 rounded-md text-[13px] font-bold text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                                >
                                    다음
                                </button>
                            </div>
                        )}
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
