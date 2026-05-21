'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Crown, Zap, ChevronRight, ChevronLeft, Filter } from 'lucide-react';
import Link from 'next/link';
import { getRotatedAds, AdItem } from '@/lib/ad-service';
import { PremiumJobCard } from '@/components/home/premium-job-card';
import { GeneralJobListRow } from '@/components/jobs/general-job-list-row';
import { AdPriceModal } from '@/components/jobs/AdPriceModal';
import { Button } from '@/components/ui/button';
import { RegionSelector } from '@/components/home/region-selector';
import { IndustrySelector } from '@/components/home/industry-selector';
import { QA_GET_COMMON_CODES, CodeItem } from '@/src/atoms/qa/master/QA_GET_COMMON_CODES';
import { useLanguage } from '@/components/providers/language-provider';

import { GeneralSeekerListRow } from './GeneralSeekerListRow';
import { getPublicSeekerAdsAction, getSeekerAdByIdAction } from '@/lib/actions';
import { SeekerModalWrapper } from '@/components/seekers/seeker-modal-wrapper';
import { buildFlatIndustryOptions, resumeMatchesIndustryFilter } from '@/lib/resume-industry';

interface SeekersListContentProps {
    isEmployer?: boolean;
    searchQuery?: string;
}

export function SeekersListContent({ isEmployer, searchQuery }: SeekersListContentProps) {
    const { t } = useLanguage();
    const [showAllPremium, setShowAllPremium] = useState(false);
    const [showAllSpecial, setShowAllSpecial] = useState(false);
    const [showAllGeneral, setShowAllGeneral] = useState(false);

    const [premiumJobs, setPremiumJobs] = useState<AdItem[]>([]);
    const [specialJobs, setSpecialJobs] = useState<AdItem[]>([]);
    const [lineJobs, setLineJobs] = useState<AdItem[]>([]);
    const [generalJobs, setGeneralJobs] = useState<any[]>([]); // Any for now, represents SeekerAd
    const [loading, setLoading] = useState(true);

    const [selectedSeekerId, setSelectedSeekerId] = useState<string | null>(null);
    const [selectedSeekerData, setSelectedSeekerData] = useState<any | null>(null);
    const [isSeekerLoading, setIsSeekerLoading] = useState(false);

    // Master data for hierarchical regions
    const [regions, setRegions] = useState<CodeItem[]>([]);
    const [industryOptions, setIndustryOptions] = useState<CodeItem[]>([]);

    // Filter states
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedSido, setSelectedSido] = useState('all');
    const [selectedSigungu, setSelectedSigungu] = useState('all');
    const [selectedIndustry, setSelectedIndustry] = useState('all');
    const [selectedPayType, setSelectedPayType] = useState('all');
    const [selectedGender, setSelectedGender] = useState('all');
    const [selectedAge, setSelectedAge] = useState('all');

    // Pagination state for the list table
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Fetch hierarchical regions
    useEffect(() => {
        const fetchMasterData = async () => {
            const res = await QA_GET_COMMON_CODES(undefined, true);
            if (res.success && res.data) {
                setRegions(res.data.filter(c => c.list_type === 'JOB_REGION_1' || c.list_type === 'JOB_REGION_2'));
                const category1 = res.data.filter((c) => c.list_type === 'CATEGORY_1');
                const category2 = res.data.filter((c) => c.list_type === 'CATEGORY_2');
                setIndustryOptions(buildFlatIndustryOptions(category1, category2));
            }
        };
        fetchMasterData();
    }, []);

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
                    getRotatedAds('PREMIUM', 50, searchQuery),
                    getRotatedAds('SPECIAL', 50, searchQuery),
                    getRotatedAds('AD_GENERAL', 50, searchQuery),
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
    }, [searchQuery]);

    // 🎨 [IMPACT DEMO] 22종 테마 전체 적용
    const impacts: any[] = [
        'gold', 'neon', 'neon_crazy', 'fire', 'ice', 'emerald', 'glitch', 'storm', 'ghost',
        'forest', 'ocean', 'sakura', 'galaxy', 'sun', 'lava', 'matrix', 'retro',
        'diamond', 'platinum', 'aura', 'candy', 'toxic'
    ];
    const demoJobs = premiumJobs.map((job, i) => {
        const finalImpact = (job.isRealAd && job.theme && job.theme !== 'UPLOAD') 
            ? job.theme 
            : impacts[i % impacts.length];
            
        let finalEffectIntensity = 'medium';
        if (job.isRealAd) {
            if (job.action_type === 'none') {
                finalEffectIntensity = 'none';
            } else {
                finalEffectIntensity = `${job.effect_intensity || 'medium'}::${job.action_type || 'shimmer'}`;
            }
        }

        return {
            ...job,
            id: job.isRealAd ? job.id : `demo-${i}-${job.id}`,
            impactType: finalImpact,
            effectIntensity: finalEffectIntensity,
            customColor: job.color,
            bgOpacity: job.bg_opacity
        };
    });

    // Filtering logic (MUST be before any conditional returns)
    const filteredGeneralJobs = React.useMemo(() => {
        return generalJobs.filter(job => {
            const resumes = job.resumes || {};
            const users = job.users || {};
            
            // 1. Region Filter
            if (selectedSido !== 'all') {
                const sidoName = regions.find(r => r.code_value === selectedSido)?.code_name;
                if (sidoName && !resumes.desired_location?.includes(sidoName)) {
                    return false;
                }
                if (selectedSigungu !== 'all') {
                    const sigunguName = regions.find(r => r.code_value === selectedSigungu)?.code_name;
                    if (sigunguName && !resumes.desired_location?.includes(sigunguName)) {
                        return false;
                    }
                }
            }
            
            // 2. Industry Filter
            if (selectedIndustry !== 'all') {
                const opt = industryOptions.find((o) => o.code_value === selectedIndustry);
                if (
                    opt &&
                    !resumeMatchesIndustryFilter(
                        resumes.desired_industry,
                        opt.code_name,
                        opt.code_value,
                        industryOptions
                    )
                ) {
                    return false;
                }
            }

            // 3. Pay Type Filter
            if (selectedPayType !== 'all') {
                if (resumes.desired_pay_type !== selectedPayType) {
                    return false;
                }
            }

            // 4. Gender Filter
            if (selectedGender !== 'all') {
                if (resumes.gender !== selectedGender) {
                    return false;
                }
            }

            // 5. Age Filter
            if (selectedAge !== 'all') {
                const currentYear = new Date().getFullYear();
                const birthYearStr = users.birth_date ? users.birth_date.split('-')[0] : resumes.birth_year;
                const birthYear = parseInt(birthYearStr || '0', 10);
                
                if (birthYear > 0) {
                    const age = currentYear - birthYear;
                    if (selectedAge === '20s' && (age < 20 || age >= 30)) return false;
                    if (selectedAge === '30s' && (age < 30 || age >= 40)) return false;
                    if (selectedAge === '40s_plus' && age < 40) return false;
                } else {
                    return false; // Cannot determine age
                }
            }
            
            return true;
        });
    }, [generalJobs, selectedSido, selectedSigungu, selectedIndustry, selectedPayType, selectedGender, selectedAge, regions, industryOptions]);

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="font-bold text-gray-400">인재 정보를 불러오고 있습니다...</p>
            </div>
        );
    }

    // Pagination logic
    const totalPages = Math.ceil(filteredGeneralJobs.length / ITEMS_PER_PAGE);
    const paginatedTableJobs = filteredGeneralJobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="space-y-12">
            {/* Top 20 Premium Banners */}
            <section>
                <div className="flex items-center justify-between mb-4 sm:mb-6 border-b pb-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                        <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-primary fill-primary animate-bounce" />
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 italic uppercase whitespace-nowrap">
                            {t.sections.premiumJobsTitle}
                        </h2>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <AdPriceModal type="premium" title="Premium" />
                        {!isEmployer && (
                            <Link href="/seeker/resume">
                                <Button size="sm" className="hidden md:flex font-black h-9 px-4 rounded-lg shadow-sm active:scale-95 transition-transform text-white">
                                    <Plus className="w-4 h-4 mr-1" /> 프리미엄 등록
                                </Button>
                            </Link>
                        )}
                        <button 
                            onClick={() => setShowAllPremium(!showAllPremium)}
                            className="text-xs sm:text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap"
                        >
                            {showAllPremium ? '접기' : '전체보기'} {showAllPremium ? <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </button>
                    </div>
                </div>
                {demoJobs.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-4 w-full">
                        {demoJobs.map((job, idx) => (
                            <div 
                                key={job.id} 
                                className={`w-[calc(50%-4px)] min-[425px]:w-[180px] lg:w-[195px] shrink-0 ${
                                    !showAllPremium && idx >= 10 ? 'hidden min-[425px]:block' : ''
                                } ${
                                    !showAllPremium && idx >= 15 ? 'min-[425px]:hidden md:block' : ''
                                } ${
                                    !showAllPremium && idx >= 20 ? 'md:hidden lg:block' : ''
                                } ${
                                    !showAllPremium && idx >= 25 ? 'lg:hidden xl:block' : ''
                                } ${
                                    !showAllPremium && idx >= 30 ? 'xl:hidden' : ''
                                }`}
                            >
                                <PremiumJobCard 
                                    {...(job as any)} 
                                    impactType={(job as any).impactType}
                                    effectIntensity={(job as any).effectIntensity}
                                    customColor={(job as any).customColor}
                                    bgOpacity={(job as any).bgOpacity}
                                    tier="PREMIUM"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center">
                        <p className="text-gray-400 font-bold">등록된 프리미엄 광고가 없습니다.</p>
                    </div>
                )}
            </section>

            {/* Special 20 Banners */}
            <section>
                <div className="flex items-center justify-between mb-4 sm:mb-6 border-b pb-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                        <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 animate-pulse" />
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 flex items-center gap-1 sm:gap-2 italic uppercase whitespace-nowrap">
                            {t.sections.specialJobsTitle}
                        </h2>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <AdPriceModal type="special" title="Special" />
                        {!isEmployer && (
                            <Link href="/seeker/resume">
                                <Button size="sm" className="hidden md:flex font-black h-9 px-4 rounded-lg shadow-sm active:scale-95 transition-transform text-black bg-yellow-400 hover:bg-yellow-500">
                                    <Plus className="w-4 h-4 mr-1" /> 스페셜 등록
                                </Button>
                            </Link>
                        )}
                        <button 
                            onClick={() => setShowAllSpecial(!showAllSpecial)}
                            className="text-xs sm:text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap"
                        >
                            {showAllSpecial ? '접기' : '전체보기'} {showAllSpecial ? <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </button>
                    </div>
                </div>
                {specialJobs.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-4 w-full">
                        {specialJobs.map((job, idx) => (
                            <div 
                                key={job.id} 
                                className={`w-[calc(50%-4px)] min-[425px]:w-[180px] lg:w-[195px] shrink-0 ${
                                    !showAllSpecial && idx >= 10 ? 'hidden min-[425px]:block' : ''
                                } ${
                                    !showAllSpecial && idx >= 15 ? 'min-[425px]:hidden md:block' : ''
                                } ${
                                    !showAllSpecial && idx >= 20 ? 'md:hidden lg:block' : ''
                                } ${
                                    !showAllSpecial && idx >= 25 ? 'lg:hidden xl:block' : ''
                                } ${
                                    !showAllSpecial && idx >= 30 ? 'xl:hidden' : ''
                                }`}
                            >
                                <PremiumJobCard 
                                    {...(job as any)} 
                                    impactType="none" 
                                    effectIntensity="none" 
                                    tier="SPECIAL" 
                                    customColor={(job as any).color} 
                                    bgOpacity={(job as any).bg_opacity}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center">
                        <p className="text-gray-400 font-bold">등록된 스페셜 광고가 없습니다.</p>
                    </div>
                )}
            </section>

            {/* General Job Cards */}
            <section>
                <div className="flex items-center justify-between mb-4 sm:mb-6 border-b pb-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 italic uppercase whitespace-nowrap">
                            {t.sections.generalJobsTitle}
                        </h2>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <AdPriceModal type="line" title="Line" />
                        {!isEmployer && (
                            <Link href="/seeker/resume">
                                <Button size="sm" className="hidden md:flex font-black h-9 px-4 rounded-lg shadow-sm active:scale-95 transition-transform text-gray-700 bg-white border hover:bg-gray-50">
                                    <Plus className="w-4 h-4 mr-1" /> 이력서 등록
                                </Button>
                            </Link>
                        )}
                        <button 
                            onClick={() => setShowAllGeneral(!showAllGeneral)}
                            className="text-xs sm:text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap"
                        >
                            {showAllGeneral ? '접기' : '전체보기'} {showAllGeneral ? <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </button>
                    </div>
                </div>
                {lineJobs.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-4 w-full">
                        {lineJobs.map((job, idx) => (
                            <div 
                                key={job.id} 
                                className={`w-[calc(50%-4px)] min-[425px]:w-[180px] lg:w-[195px] shrink-0 ${
                                    !showAllGeneral && idx >= 10 ? 'hidden min-[425px]:block' : ''
                                } ${
                                    !showAllGeneral && idx >= 15 ? 'min-[425px]:hidden md:block' : ''
                                } ${
                                    !showAllGeneral && idx >= 20 ? 'md:hidden lg:block' : ''
                                } ${
                                    !showAllGeneral && idx >= 25 ? 'lg:hidden xl:block' : ''
                                } ${
                                    !showAllGeneral && idx >= 30 ? 'xl:hidden' : ''
                                }`}
                            >
                                <PremiumJobCard 
                                    {...(job as any)} 
                                    impactType="none" 
                                    effectIntensity="none" 
                                    hideLogo={true} 
                                    tier="GENERAL" 
                                    customColor={(job as any).color} 
                                    bgOpacity={(job as any).bg_opacity}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center">
                        <p className="text-gray-400 font-bold">등록된 일반 광고가 없습니다.</p>
                    </div>
                )}
            </section>

            {/* Filter Toggle Button */}
            <div className="flex justify-start mt-4 mb-2">
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
                <section className="bg-white rounded-xl p-5 border shadow-sm mb-4 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Region Selection (Sido & Sigungu) */}
                        <div className="space-y-3">
                            <label className="text-[14px] font-bold flex items-center gap-2 text-gray-800">
                                <span className="w-1.5 h-3.5 bg-primary rounded-full" />
                                지역 선택
                            </label>
                            <div className="flex gap-2">
                                <select 
                                    value={selectedSido}
                                    onChange={(e) => {
                                        setSelectedSido(e.target.value);
                                        setSelectedSigungu('all');
                                    }}
                                    className="flex-1 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer bg-gray-50/50"
                                >
                                    <option value="all">시/도 전체</option>
                                    {regions.filter(r => !r.parent_code_value).map(r => (
                                        <option key={r.code_value} value={r.code_value}>{r.code_name}</option>
                                    ))}
                                </select>
                                <select 
                                    value={selectedSigungu}
                                    onChange={(e) => setSelectedSigungu(e.target.value)}
                                    disabled={selectedSido === 'all'}
                                    className="flex-1 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer bg-gray-50/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="all">시/군/구 전체</option>
                                    {regions.filter(r => r.parent_code_value === selectedSido).map(r => (
                                        <option key={r.code_value} value={r.code_value}>{r.code_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        {/* Industry Selection */}
                        <div className="space-y-3">
                            <label className="text-[14px] font-bold flex items-center gap-2 text-gray-800">
                                <span className="w-1.5 h-3.5 bg-orange-400 rounded-full" />
                                업종 선택
                            </label>
                            <select 
                                value={selectedIndustry}
                                onChange={(e) => setSelectedIndustry(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer bg-gray-50/50"
                            >
                                <option value="all">전체 업종</option>
                                {industryOptions.map((i) => (
                                    <option key={i.code_value} value={i.code_value}>{i.code_name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Pay Type Selection */}
                        <div className="space-y-3">
                            <label className="text-[14px] font-bold flex items-center gap-2 text-gray-800">
                                <span className="w-1.5 h-3.5 bg-green-500 rounded-full" />
                                급여 조건
                            </label>
                            <select 
                                value={selectedPayType}
                                onChange={(e) => setSelectedPayType(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer bg-gray-50/50"
                            >
                                <option value="all">전체</option>
                                <option value="시급">시급</option>
                                <option value="일급">일급</option>
                                <option value="주급">주급</option>
                                <option value="월급">월급</option>
                                <option value="협의">협의</option>
                            </select>
                        </div>

                        {/* Gender Selection */}
                        <div className="space-y-3">
                            <label className="text-[14px] font-bold flex items-center gap-2 text-gray-800">
                                <span className="w-1.5 h-3.5 bg-pink-400 rounded-full" />
                                성별
                            </label>
                            <select 
                                value={selectedGender}
                                onChange={(e) => setSelectedGender(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer bg-gray-50/50"
                            >
                                <option value="all">전체</option>
                                <option value="F">여성</option>
                                <option value="M">남성</option>
                            </select>
                        </div>

                        {/* Age Selection */}
                        <div className="space-y-3">
                            <label className="text-[14px] font-bold flex items-center gap-2 text-gray-800">
                                <span className="w-1.5 h-3.5 bg-purple-400 rounded-full" />
                                연령대
                            </label>
                            <select 
                                value={selectedAge}
                                onChange={(e) => setSelectedAge(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer bg-gray-50/50"
                            >
                                <option value="all">전체</option>
                                <option value="20s">20대</option>
                                <option value="30s">30대</option>
                                <option value="40s_plus">40대 이상</option>
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
