'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { getRotatedAds, AdItem } from '@/lib/ad-service';
import { PremiumJobCard } from '@/components/home/premium-job-card';
import { SpecialJobCard } from '@/components/home/special-job-card';
import { GeneralJobItem } from '@/components/home/general-job-item';
import { GeneralJobListRow } from '@/components/jobs/general-job-list-row';
import { AdPriceModal } from '@/components/jobs/AdPriceModal';

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

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="font-bold text-gray-400">구인 정보를 불러오고 있습니다...</p>
            </div>
        );
    }

    // 2줄만 보여주기 위한 공통 반응형 숨김 클래스
    const twoRowGridClasses = `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 lg:gap-5 grid-flow-dense
        [&>*:nth-child(n+5)]:hidden 
        md:[&>*:nth-child(n+7)]:hidden 
        lg:[&>*:nth-child(n+9)]:hidden 
        xl:[&>*:nth-child(n+11)]:hidden 
        2xl:[&>*:nth-child(n+13)]:hidden`;

    return (
        <div className="space-y-12">
            {/* Top 20 Premium Banners (2 Rows) */}
            <section>
                <div className="mb-4 flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">프리미엄 구인정보</h2>
                        <AdPriceModal type="premium" title="Premium" />
                    </div>
                    {isEmployer ? (
                        <Link href="/biz/ads/new" className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[11px] font-black rounded-lg hover:bg-orange-600 transition-colors shadow-sm">
                            <Plus className="w-3.5 h-3.5" /> 프리미엄 등록
                        </Link>
                    ) : (
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">추천 20</span>
                    )}
                </div>
                {premiumJobs.length > 0 ? (
                    <div className={twoRowGridClasses}>
                        {premiumJobs.map((job) => (
                            <PremiumJobCard key={job.id} {...(job as any)} />
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
                <div className="mb-4 flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">스페셜 구인정보</h2>
                        <AdPriceModal type="special" title="Special" />
                    </div>
                    {isEmployer ? (
                        <Link href="/biz/ads/new" className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 text-black text-[11px] font-black rounded-lg hover:bg-yellow-500 transition-colors shadow-sm">
                            <Plus className="w-3.5 h-3.5" /> 스페셜 등록
                        </Link>
                    ) : (
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">추천 20</span>
                    )}
                </div>
                {specialJobs.length > 0 ? (
                    <div className={twoRowGridClasses}>
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
                <div className="mb-4 flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">일반 광고</h2>
                        <AdPriceModal type="line" title="Line" />
                    </div>
                    {isEmployer ? (
                        <Link href="/biz/ads/new" className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-[11px] font-bold rounded-lg hover:bg-gray-50 transition-colors">
                            <Plus className="w-3.5 h-3.5" /> 일반 등록
                        </Link>
                    ) : (
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">추천 50</span>
                    )}
                </div>
                {generalJobs.length > 0 ? (
                    <div className={twoRowGridClasses}>
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
