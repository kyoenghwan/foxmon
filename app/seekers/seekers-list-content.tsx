'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Crown, Zap, ChevronRight, ChevronLeft, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { getRotatedAds, AdItem } from '@/lib/ad-service';
import { PremiumJobCard } from '@/components/home/premium-job-card';
import { GeneralJobListRow } from '@/components/jobs/general-job-list-row';
import { AdPriceModal } from '@/components/jobs/AdPriceModal';
import { Button } from '@/components/ui/button';
import { QA_GET_COMMON_CODES, CodeItem } from '@/src/atoms/qa/master/QA_GET_COMMON_CODES';
import { useLanguage } from '@/components/providers/language-provider';
import { useSearchParams, useRouter } from 'next/navigation';

import { GeneralSeekerListRow } from './GeneralSeekerListRow';
import { getPublicSeekerAdsAction, getSeekerAdByIdAction } from '@/lib/actions';
import { SeekerModalWrapper } from '@/components/seekers/seeker-modal-wrapper';
import { buildFlatIndustryOptions, resumeMatchesIndustryFilter } from '@/lib/resume-industry';

function resolveRegion(param: string, list: CodeItem[]): string {
    if (!param || param === 'all') return 'all';
    const found = list.find(r => 
        r.code_value.toLowerCase() === param.toLowerCase() ||
        r.code_name === param
    );
    return found ? found.code_value : 'all';
}

function resolveIndustry(param: string, list: CodeItem[]): string {
    if (!param || param === 'all') return 'all';
    const found = list.find(i => 
        i.code_value.toLowerCase() === param.toLowerCase() ||
        i.code_value.toLowerCase().includes(param.toLowerCase()) ||
        i.code_name === param ||
        (param === 'cafe-bar' && i.code_value === 'CAT1_BAR') ||
        (param === 'room-salon' && i.code_value === 'CAT1_ROOM')
    );
    return found ? found.code_value : 'all';
}

interface SeekersListContentProps {
    isEmployer?: boolean;
    searchQuery?: string;
}

export function SeekersListContent({ isEmployer, searchQuery }: SeekersListContentProps) {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const router = useRouter();

    const qParam = searchParams.get('q') || '';
    const regionParam = searchParams.get('region') || 'all';
    const industryParam = searchParams.get('industry') || 'all';
    const keywordParam = searchParams.get('keyword') || 'all';

    const [dbRegions1, setDbRegions1] = useState<CodeItem[]>([]);
    const [dbRegions2, setDbRegions2] = useState<CodeItem[]>([]);
    const [dbIndustries, setDbIndustries] = useState<CodeItem[]>([]);
    const [dbKeywords, setDbKeywords] = useState<CodeItem[]>([]);

    const [selectedSido, setSelectedSido] = useState<string>('all');
    const [selectedSigungu, setSelectedSigungu] = useState<string>('all');
    const [selectedIndustry, setSelectedIndustry] = useState(industryParam);
    const [selectedKeyword, setSelectedKeyword] = useState(keywordParam);
    const [searchKeyword, setSearchKeyword] = useState(qParam);

    const [isRegionOpen, setIsRegionOpen] = useState(false);
    const [isIndustryOpen, setIsIndustryOpen] = useState(false);
    const [isKeywordOpen, setIsKeywordOpen] = useState(false);
    const [isSearchTermOpen, setIsSearchTermOpen] = useState(false);

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

    // Filter states
    const [selectedPayType, setSelectedPayType] = useState('all');
    const [selectedGender, setSelectedGender] = useState('all');
    const [selectedAge, setSelectedAge] = useState('all');

    // Pagination state for the list table
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Load master data on mount
    useEffect(() => {
        const fetchMasterData = async () => {
            const res = await QA_GET_COMMON_CODES(undefined, true);
            if (res.success && res.data) {
                setDbRegions1(res.data.filter(c => c.list_type === 'JOB_REGION_1'));
                setDbRegions2(res.data.filter(c => c.list_type === 'JOB_REGION_2'));
                const category1 = res.data.filter((c) => c.list_type === 'CATEGORY_1');
                const category2 = res.data.filter((c) => c.list_type === 'CATEGORY_2');
                setDbIndustries(buildFlatIndustryOptions(category1, category2));
                setDbKeywords(res.data.filter(c => c.list_type === 'KEYWORD'));
            }
        };
        fetchMasterData();
    }, []);

    // URL 파라미터가 변경되면 로컬 상태 동기화 및 자동 확장 처리
    useEffect(() => {
        if (dbRegions2.length > 0) {
            const matchedSigungu = dbRegions2.find(
                r => r.code_value.toLowerCase() === regionParam.toLowerCase()
            );
            if (matchedSigungu) {
                setSelectedSido(matchedSigungu.parent_code_value || 'all');
                setSelectedSigungu(matchedSigungu.code_value);
            } else {
                const matchedSido = dbRegions1.find(
                    r => r.code_value.toLowerCase() === regionParam.toLowerCase()
                );
                if (matchedSido) {
                    setSelectedSido(matchedSido.code_value);
                    setSelectedSigungu('all');
                } else {
                    setSelectedSido('all');
                    setSelectedSigungu('all');
                }
            }
        } else {
            setSelectedSido('all');
            setSelectedSigungu('all');
        }

        if (dbIndustries.length > 0) {
            setSelectedIndustry(resolveIndustry(industryParam, dbIndustries));
        } else {
            setSelectedIndustry(industryParam);
        }

        setSelectedKeyword(keywordParam);
        setSearchKeyword(qParam);

        // 파라미터가 비어있지 않으면 해당 패널 자동 열기
        if (regionParam && regionParam !== 'all') {
            setIsRegionOpen(true);
        }
        if (industryParam && industryParam !== 'all') {
            setIsIndustryOpen(true);
        }
        if (keywordParam && keywordParam !== 'all') {
            setIsKeywordOpen(true);
        }
        if (qParam && qParam.trim() !== '') {
            setIsSearchTermOpen(true);
        }
    }, [qParam, regionParam, industryParam, keywordParam, dbRegions1, dbRegions2, dbIndustries]);

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
                // 시/도 및 시/군/구 코드를 한글 텍스트 검색어로 변환
                let regionText = '';
                if (dbRegions2.length > 0) {
                    const sigungu = dbRegions2.find(r => r.code_value.toLowerCase() === regionParam.toLowerCase());
                    if (sigungu) {
                        const sido = dbRegions1.find(r => r.code_value === sigungu.parent_code_value);
                        const sidoName = sido ? sido.code_name : '';
                        const sigunguName = sigungu.code_name !== '전체' ? sigungu.code_name : '';
                        regionText = [sidoName, sigunguName].filter(Boolean).join(' ');
                    } else {
                        const sido = dbRegions1.find(r => r.code_value.toLowerCase() === regionParam.toLowerCase());
                        if (sido) {
                            regionText = sido.code_name;
                        }
                    }
                }

                const resolvedInd = resolveIndustry(industryParam, dbIndustries);
                const industryTerm = dbIndustries.find(i => i.code_value === resolvedInd)?.code_name || '';

                const keywordItem = dbKeywords.find(k => k.code_value.toLowerCase() === keywordParam.toLowerCase());
                const keywordTerm = keywordItem ? keywordItem.code_name : '';
                
                // 공백으로 연결하여 다중 검색어가 되도록 빌드
                const combinedTerms = [
                    regionText && regionText !== '전체' ? regionText : '', 
                    industryTerm && industryTerm !== '전체' ? industryTerm : '', 
                    keywordTerm,
                    qParam
                ]
                    .filter(Boolean)
                    .join(' ');

                const [p, s, l, gRes] = await Promise.all([
                    getRotatedAds('PREMIUM', 50, combinedTerms),
                    getRotatedAds('SPECIAL', 50, combinedTerms),
                    getRotatedAds('AD_GENERAL', 50, combinedTerms),
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
    }, [qParam, regionParam, industryParam, keywordParam, dbRegions1, dbRegions2, dbIndustries, dbKeywords]);

    const handleSearchClick = () => {
        const params = new URLSearchParams();
        if (searchKeyword.trim()) {
            params.set('q', searchKeyword.trim());
        }
        
        let regionVal = 'all';
        if (selectedSigungu !== 'all' && !selectedSigungu.endsWith('_ALL')) {
            regionVal = selectedSigungu;
        } else if (selectedSido !== 'all') {
            regionVal = selectedSido;
        }
        
        if (regionVal !== 'all') {
            params.set('region', regionVal.toLowerCase());
        }
        if (selectedIndustry !== 'all') {
            params.set('industry', selectedIndustry.toLowerCase());
        }
        if (selectedKeyword !== 'all') {
            params.set('keyword', selectedKeyword.toLowerCase());
        }
        router.push(`/seekers?${params.toString()}`);
    };

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
            if (regionParam !== 'all') {
                let targetRegionName = '';
                const matchedSigungu = dbRegions2.find(
                    r => r.code_value.toLowerCase() === regionParam.toLowerCase()
                );
                if (matchedSigungu && matchedSigungu.code_name !== '전체') {
                    targetRegionName = matchedSigungu.code_name;
                } else {
                    const matchedSido = dbRegions1.find(
                        r => r.code_value.toLowerCase() === regionParam.toLowerCase()
                    );
                    if (matchedSido) {
                        targetRegionName = matchedSido.code_name;
                    }
                }
                if (targetRegionName && !resumes.desired_location?.includes(targetRegionName)) {
                    return false;
                }
            }
            
            // 2. Industry Filter
            if (industryParam !== 'all') {
                const resolvedInd = resolveIndustry(industryParam, dbIndustries);
                const industryName = dbIndustries.find(i => i.code_value === resolvedInd)?.code_name;
                if (industryName && !resumes.desired_industry?.includes(industryName)) {
                    return false;
                }
            }

            // 3. Keyword Filter
            if (keywordParam !== 'all') {
                const keywordName = dbKeywords.find(k => k.code_value.toLowerCase() === keywordParam.toLowerCase())?.code_name;
                if (keywordName) {
                    const inTitle = resumes.title?.toLowerCase().includes(keywordName.toLowerCase());
                    const inDesiredJob = resumes.desired_job?.toLowerCase().includes(keywordName.toLowerCase());
                    const inSkills = resumes.skills?.toLowerCase().includes(keywordName.toLowerCase());
                    if (!inTitle && !inDesiredJob && !inSkills) {
                        return false;
                    }
                }
            }

            // 4. Custom query text filter
            if (qParam.trim()) {
                const kw = qParam.trim().toLowerCase();
                const inTitle = resumes.title?.toLowerCase().includes(kw);
                const inDesiredJob = resumes.desired_job?.toLowerCase().includes(kw);
                const inSkills = resumes.skills?.toLowerCase().includes(kw);
                if (!inTitle && !inDesiredJob && !inSkills) {
                    return false;
                }
            }
            
            // 5. Pay Type Filter
            if (selectedPayType !== 'all') {
                if (resumes.desired_pay_type !== selectedPayType) {
                    return false;
                }
            }

            // 6. Gender Filter
            if (selectedGender !== 'all') {
                if (resumes.gender !== selectedGender) {
                    return false;
                }
            }

            // 7. Age Filter
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
    }, [generalJobs, qParam, regionParam, industryParam, keywordParam, dbRegions1, dbRegions2, dbIndustries, dbKeywords, selectedPayType, selectedGender, selectedAge]);

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

            {/* Search Condition Card */}
            <section className="bg-white rounded-xl p-6 border shadow-sm space-y-6">
                {/* Region Selection */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-[14px] font-extrabold flex items-center gap-2 text-gray-800">
                            <span className="w-1.5 h-3.5 bg-primary rounded-full" />
                            지역 선택
                        </h3>
                        <button 
                            onClick={() => setIsRegionOpen(!isRegionOpen)}
                            className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1 transition-colors"
                        >
                            {isRegionOpen ? '접기' : '보기'} {isRegionOpen ? <ChevronLeft className="w-3 h-3 rotate-90" /> : <ChevronRight className="w-3 h-3 rotate-90" />}
                        </button>
                    </div>
                    {isRegionOpen && (
                        <div className="flex flex-col sm:flex-row gap-4 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            {/* 1차 지역 (시/도) */}
                            <div className="flex-1 space-y-1.5">
                                <label className="text-xs font-bold text-gray-500">시/도 선택</label>
                                <select
                                    value={selectedSido}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedSido(val);
                                        setSelectedSigungu('all');
                                    }}
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-gray-50/50 cursor-pointer"
                                >
                                    <option value="all">전국 (전체)</option>
                                    {dbRegions1.map((r) => (
                                        <option key={r.code_value} value={r.code_value}>
                                            {r.code_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 2차 지역 (시/군/구) */}
                            <div className="flex-1 space-y-1.5">
                                <label className="text-xs font-bold text-gray-500">구/군/시 선택</label>
                                <select
                                    value={selectedSigungu}
                                    onChange={(e) => setSelectedSigungu(e.target.value)}
                                    disabled={selectedSido === 'all'}
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-gray-50/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <option value="all">전체</option>
                                    {dbRegions2
                                        .filter((r) => r.parent_code_value === selectedSido)
                                        .map((r) => (
                                            <option key={r.code_value} value={r.code_value}>
                                                {r.code_name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Industry Selection */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-[14px] font-extrabold flex items-center gap-2 text-gray-800">
                            <span className="w-1.5 h-3.5 bg-orange-400 rounded-full" />
                            업종 선택
                        </h3>
                        <button 
                            onClick={() => setIsIndustryOpen(!isIndustryOpen)}
                            className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1 transition-colors"
                        >
                            {isIndustryOpen ? '접기' : '보기'} {isIndustryOpen ? <ChevronLeft className="w-3 h-3 rotate-90" /> : <ChevronRight className="w-3 h-3 rotate-90" />}
                        </button>
                    </div>
                    {isIndustryOpen && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            <button
                                onClick={() => setSelectedIndustry('all')}
                                className={`flex items-center justify-center p-2 rounded-lg border text-xs sm:text-sm font-bold transition-all ${
                                    selectedIndustry === 'all'
                                        ? 'border-orange-400 bg-orange-400 text-white shadow-sm'
                                        : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 text-gray-700'
                                }`}
                            >
                                전체
                            </button>
                            {dbIndustries.map((ind) => (
                                <button
                                    key={ind.code_value}
                                    onClick={() => setSelectedIndustry(ind.code_value)}
                                    className={`flex items-center justify-center p-2 rounded-lg border text-xs sm:text-sm font-bold transition-all ${
                                        selectedIndustry === ind.code_value
                                            ? 'border-orange-400 bg-orange-400 text-white shadow-sm'
                                            : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 text-gray-700'
                                    }`}
                                >
                                    {ind.code_name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Keyword Selection */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-[14px] font-extrabold flex items-center gap-2 text-gray-800">
                            <span className="w-1.5 h-3.5 bg-purple-400 rounded-full" />
                            키워드 선택
                        </h3>
                        <button 
                            onClick={() => setIsKeywordOpen(!isKeywordOpen)}
                            className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1 transition-colors"
                        >
                            {isKeywordOpen ? '접기' : '보기'} {isKeywordOpen ? <ChevronLeft className="w-3 h-3 rotate-90" /> : <ChevronRight className="w-3 h-3 rotate-90" />}
                        </button>
                    </div>
                    {isKeywordOpen && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            <button
                                onClick={() => setSelectedKeyword('all')}
                                className={`flex items-center justify-center p-2 rounded-lg border text-xs sm:text-sm font-bold transition-all ${
                                    selectedKeyword === 'all'
                                        ? 'border-purple-500 bg-purple-500 text-white shadow-sm'
                                        : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 text-gray-700'
                                }`}
                            >
                                전체
                            </button>
                            {dbKeywords.map((k) => (
                                <button
                                    key={k.code_value}
                                    onClick={() => setSelectedKeyword(k.code_value)}
                                    className={`flex items-center justify-center p-2 rounded-lg border text-xs sm:text-sm font-bold transition-all ${
                                        selectedKeyword === k.code_value
                                            ? 'border-purple-500 bg-purple-500 text-white shadow-sm'
                                            : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 text-gray-700'
                                    }`}
                                >
                                    {k.code_name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Search Term Input */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-[14px] font-extrabold flex items-center gap-2 text-gray-800">
                            <span className="w-1.5 h-3.5 bg-teal-500 rounded-full" />
                            검색어 입력
                        </h3>
                        <button 
                            onClick={() => setIsSearchTermOpen(!isSearchTermOpen)}
                            className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1 transition-colors"
                        >
                            {isSearchTermOpen ? '접기' : '보기'} {isSearchTermOpen ? <ChevronLeft className="w-3 h-3 rotate-90" /> : <ChevronRight className="w-3 h-3 rotate-90" />}
                        </button>
                    </div>
                    {isSearchTermOpen && (
                        <div className="pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="relative max-w-md">
                                <input
                                    type="text"
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearchClick();
                                        }
                                    }}
                                    placeholder="검색할 상세 키워드를 입력해 주세요."
                                    className="w-full border border-gray-200 rounded-lg py-2.5 pl-4 pr-10 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                                {searchKeyword && (
                                    <button 
                                        onClick={() => setSearchKeyword('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-lg"
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Additional Filters: Pay, Gender, Age */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500">급여 조건</label>
                        <select 
                            value={selectedPayType}
                            onChange={(e) => setSelectedPayType(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg p-2.5 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-gray-50/50 cursor-pointer"
                        >
                            <option value="all">전체 급여</option>
                            <option value="시급">시급</option>
                            <option value="일급">일급</option>
                            <option value="주급">주급</option>
                            <option value="월급">월급</option>
                            <option value="협의">협의</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500">성별</label>
                        <select 
                            value={selectedGender}
                            onChange={(e) => setSelectedGender(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg p-2.5 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-gray-50/50 cursor-pointer"
                        >
                            <option value="all">전체 성별</option>
                            <option value="F">여성</option>
                            <option value="M">남성</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500">연령대</label>
                        <select 
                            value={selectedAge}
                            onChange={(e) => setSelectedAge(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg p-2.5 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-gray-50/50 cursor-pointer"
                        >
                            <option value="all">전체 연령대</option>
                            <option value="20s">20대</option>
                            <option value="30s">30대</option>
                            <option value="40s_plus">40대 이상</option>
                        </select>
                    </div>
                </div>

                {/* Bottom Search Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                    <div className="text-[11px] sm:text-xs font-bold text-gray-400">
                        현재 검색 조건:{" "}
                        <span className="text-primary font-black">
                            {[
                                dbRegions1.find((r) => r.code_value === selectedSido)?.code_name,
                                dbRegions2.find((r) => r.code_value === selectedSigungu)?.code_name !== '전체' 
                                    ? dbRegions2.find((r) => r.code_value === selectedSigungu)?.code_name 
                                    : null,
                                dbIndustries.find((i) => i.code_value === selectedIndustry)?.code_name,
                                dbKeywords.find((k) => k.code_value === selectedKeyword)?.code_name,
                                searchKeyword ? `"${searchKeyword}"` : "",
                            ]
                                .filter(Boolean)
                                .join(" > ") || "전체"}
                        </span>
                    </div>
                    <Button 
                        onClick={handleSearchClick}
                        className="w-full sm:w-auto font-black px-8 py-5 rounded-lg text-white bg-primary hover:bg-orange-600 hover:scale-[1.02] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                        <Search className="w-4 h-4" /> 검색하기
                    </Button>
                </div>
            </section>

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
