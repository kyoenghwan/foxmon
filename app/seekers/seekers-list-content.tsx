'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Crown, Zap, ChevronRight, Filter } from 'lucide-react';
import Link from 'next/link';
import { getRotatedAds, AdItem } from '@/lib/ad-service';
import { PremiumJobCard } from '@/components/home/premium-job-card';
import { GeneralJobListRow } from '@/components/jobs/general-job-list-row';
import { AdPriceModal } from '@/components/jobs/AdPriceModal';
import { Button } from '@/components/ui/button';
import { RegionSelector } from '@/components/home/region-selector';
import { IndustrySelector } from '@/components/home/industry-selector';

import { GeneralSeekerListRow } from './GeneralSeekerListRow';
import { getPublicSeekerAdsAction, getSeekerAdByIdAction } from '@/lib/actions';
import { SeekerModalWrapper } from '@/components/seekers/seeker-modal-wrapper';

interface SeekersListContentProps {
    isEmployer?: boolean;
}

const REGIONS = [
    { id: 'all', nameKo: '전체 지역' },
    { id: 'seoul', nameKo: '서울' },
    { id: 'gyeonggi', nameKo: '경기' },
    { id: 'incheon', nameKo: '인천' },
    { id: 'busan', nameKo: '부산' },
    { id: 'daegu', nameKo: '대구' },
    { id: 'daejeon', nameKo: '대전' },
    { id: 'gwangju', nameKo: '광주' },
    { id: 'ulsan', nameKo: '울산' },
    { id: 'sejong', nameKo: '세종' },
    { id: 'gangwon', nameKo: '강원' },
    { id: 'chungbuk', nameKo: '충북' },
    { id: 'chungnam', nameKo: '충남' },
    { id: 'jeonbuk', nameKo: '전북' },
    { id: 'jeonnam', nameKo: '전남' },
    { id: 'gyeongbuk', nameKo: '경북' },
    { id: 'gyeongnam', nameKo: '경남' },
    { id: 'jeju', nameKo: '제주' },
];

const INDUSTRIES = [
    { id: 'all', nameKo: '전체 업종' },
    { id: 'karaoke', nameKo: '노래주점' },
    { id: 'danran', nameKo: '단란주점' },
    { id: 'cafe-bar', nameKo: '카페/BAR' },
    { id: 'room-salon', nameKo: '룸싸롱' },
    { id: 'tenpro', nameKo: '텐프로/쩜오' },
    { id: 'dabang', nameKo: '다방' },
    { id: 'yojung', nameKo: '요정' },
    { id: 'etc', nameKo: '기타' },
];

export function SeekersListContent({ isEmployer }: SeekersListContentProps) {
    const [premiumJobs, setPremiumJobs] = useState<AdItem[]>([]);
    const [specialJobs, setSpecialJobs] = useState<AdItem[]>([]);
    const [lineJobs, setLineJobs] = useState<AdItem[]>([]);
    const [generalJobs, setGeneralJobs] = useState<any[]>([]); // Any for now, represents SeekerAd
    const [loading, setLoading] = useState(true);

    const [selectedSeekerId, setSelectedSeekerId] = useState<string | null>(null);
    const [selectedSeekerData, setSelectedSeekerData] = useState<any | null>(null);
    const [isSeekerLoading, setIsSeekerLoading] = useState(false);

    // Filter states
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedIndustry, setSelectedIndustry] = useState('all');

    // Pagination state for the list table
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const handleOpenSeeker = async (id: string) => {
        setSelectedSeekerId(id);
        setIsSeekerLoading(true);
        const res = await getSeekerAdByIdAction(id);
        if (res.success && res.data) {
            setSelectedSeekerData(res.data);
        } else {
            alert('이력서 정보를 불러오는데 실패했습니다.');
            setSelectedSeekerId(null);
        }
        setIsSeekerLoading(false);
    };

    useEffect(() => {
        async function fetchJobs() {
            setLoading(true);
            try {
                const [p, s, l, gRes] = await Promise.all([
                    getRotatedAds('PREMIUM', 50),
                    getRotatedAds('SPECIAL', 50),
                    getRotatedAds('LINE', 50),
                    getPublicSeekerAdsAction()
                ]);
                setPremiumJobs(p);
                setSpecialJobs(s);
                setLineJobs(l);
                if (gRes && gRes.success && gRes.data) {
                    setGeneralJobs(gRes.data);
                } else {
                    setGeneralJobs([]);
                }
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
                company: `프리미엄 광고 ${i + 1}`,
                title: `성실하게 일하겠습니다 (${i + 1})`,
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

    // Filtering logic (MUST be before any conditional returns)
    const filteredGeneralJobs = React.useMemo(() => {
        return generalJobs.filter(job => {
            const resumes = job.resumes || {};
            
            // Filter by region
            if (selectedRegion !== 'all') {
                const regionName = REGIONS.find(r => r.id === selectedRegion)?.nameKo;
                if (regionName && !resumes.desired_location?.includes(regionName)) {
                    return false;
                }
            }
            
            // Filter by industry
            if (selectedIndustry !== 'all') {
                const industryName = INDUSTRIES.find(i => i.id === selectedIndustry)?.nameKo;
                if (industryName && resumes.desired_industry !== industryName) {
                    return false;
                }
            }
            
            return true;
        });
    }, [generalJobs, selectedRegion, selectedIndustry]);

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="font-bold text-gray-400">인재 정보를 불러오고 있습니다...</p>
            </div>
        );
    }

    // 프리미엄, 스페셜, 일반 모두 2줄 고정 
    const twoRowPremiumSpecialGridClasses = `limit-2-rows grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 4xl:grid-cols-8 gap-2 sm:gap-3 xl:gap-4 w-full`;

    // Pagination logic
    const totalPages = Math.ceil(filteredGeneralJobs.length / ITEMS_PER_PAGE);
    const paginatedTableJobs = filteredGeneralJobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
                        {!isEmployer && (
                            <Link href="/seeker/resume">
                                <Button size="sm" className="hidden md:flex font-black h-9 px-4 rounded-lg shadow-sm active:scale-95 transition-transform text-white">
                                    <Plus className="w-4 h-4 mr-1" /> 프리미엄 등록
                                </Button>
                            </Link>
                        )}
                        <Link href="/seekers" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
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
                        {!isEmployer && (
                            <Link href="/seeker/resume" className="flex items-center gap-1.5 px-4 py-1.5 bg-yellow-400 text-black text-[11px] font-black rounded-lg hover:scale-105 transition-transform shadow-sm">
                                <Plus className="w-3.5 h-3.5" /> 스페셜 등록
                            </Link>
                        )}
                        <Link href="/seekers" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
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
                        {!isEmployer && (
                            <Link href="/seeker/resume" className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-[11px] font-bold rounded-lg hover:bg-gray-50 transition-colors">
                                <Plus className="w-3.5 h-3.5" /> 이력서 등록
                            </Link>
                        )}
                        <Link href="/seekers" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
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

            {/* Filter Toggle Button */}
            <div className="flex justify-end mt-4 mb-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 shadow-sm"
                >
                    <Filter className="w-4 h-4" />
                    상세 필터 {isFilterOpen ? '닫기' : '열기'}
                </Button>
            </div>

            {/* Collapsible Filter Content */}
            {isFilterOpen && (
                <section className="bg-white rounded-xl p-5 border shadow-sm space-y-4 mb-4 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="flex flex-col sm:flex-row gap-6">
                        {/* Region Selection */}
                        <div className="flex-1">
                            <label className="text-[14px] font-bold flex items-center gap-2 text-gray-800 mb-3">
                                <span className="w-1.5 h-3.5 bg-primary rounded-full" />
                                지역 선택
                            </label>
                            <select 
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer bg-gray-50/50"
                            >
                                {REGIONS.map(r => (
                                    <option key={r.id} value={r.id}>{r.nameKo}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Industry Selection */}
                        <div className="flex-1">
                            <label className="text-[14px] font-bold flex items-center gap-2 text-gray-800 mb-3">
                                <span className="w-1.5 h-3.5 bg-orange-400 rounded-full" />
                                업종 선택
                            </label>
                            <select 
                                value={selectedIndustry}
                                onChange={(e) => setSelectedIndustry(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer bg-gray-50/50"
                            >
                                {INDUSTRIES.map(i => (
                                    <option key={i.id} value={i.id}>{i.nameKo}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>
            )}

            {/* General Jobs List */}
            <section>
                <div className="mb-4 flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-[15px] font-black text-gray-800 tracking-tight flex items-center gap-1.5">
                            <span className="bg-[#ff8a00] text-white w-4 h-4 flex items-center justify-center rounded-sm text-[10px] shadow-sm tracking-tighter shrink-0 pt-[1px] pl-[1px]">&gt;</span> 
                            인재정보 리스트
                        </h2>
                    </div>
                    {!isEmployer && (
                        <Link href="/seeker/resume" className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white text-[11px] font-black rounded-lg hover:bg-gray-700 transition-colors shadow-sm">
                            <Plus className="w-3.5 h-3.5" /> 이력서 등록하기
                        </Link>
                    )}
                </div>
                {generalJobs.length > 0 ? (
                    <div className="bg-white border-t-2 border-gray-900 shadow-sm rounded-b-xl overflow-x-auto">
                        <table className="w-full min-w-[800px] text-center text-[13px] md:text-[14px]">
                            <thead className="border-b border-gray-200 text-gray-700 font-bold bg-white">
                                <tr>
                                    <th className="py-3 px-2 w-[10%] font-semibold">이름</th>
                                    <th className="py-3 px-2 w-[10%] font-semibold">성별/나이</th>
                                    <th className="py-3 px-4 w-[35%] text-left font-semibold">제목</th>
                                    <th className="py-3 px-2 w-[15%] font-semibold text-gray-500">희망지역</th>
                                    <th className="py-3 px-2 w-[10%] font-semibold text-gray-500">희망업종</th>
                                    <th className="py-3 px-2 w-[12%] font-semibold text-gray-500">희망급여</th>
                                    <th className="py-3 px-2 w-[8%] font-semibold text-gray-500">작성일</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedTableJobs.map((job) => (
                                    <GeneralSeekerListRow 
                                        key={job.id} 
                                        job={job} 
                                        onClick={() => handleOpenSeeker(job.id)} 
                                    />
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
                        <p className="text-gray-400 font-bold">등록된 일반 광고가 없습니다.</p>
                    </div>
                )}
            </section>

            {/* Seeker Detail Modal */}
            <SeekerModalWrapper 
                isOpen={!!selectedSeekerId} 
                onClose={() => setSelectedSeekerId(null)} 
                job={selectedSeekerData} 
            />
        </div>
    );
}
