'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Megaphone, Plus, Zap, Crown, Loader2, ChevronLeft } from 'lucide-react';
import { PremiumJobCard } from '@/components/home/premium-job-card';
import { useLanguage } from '@/components/providers/language-provider';
import { getRotatedAds, AdItem } from '@/lib/ad-service';
import { AdPriceModal } from '@/components/jobs/AdPriceModal';
import { Button } from '@/components/ui/button';

interface Notice {
    id: string;
    title: string;
    date: string;
    isNew?: boolean;
    isHot?: boolean;
}

export function HomeJobSections() {
    const { t } = useLanguage();
    const [noticeIndex, setNoticeIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showAllPremium, setShowAllPremium] = useState(false);

    // Firestore 데이터 상태
    const [premiumJobs, setPremiumJobs] = useState<AdItem[]>([]);
    const [specialJobs, setSpecialJobs] = useState<AdItem[]>([]);
    const [lineJobs, setLineJobs] = useState<AdItem[]>([]);
    const [generalJobs, setGeneralJobs] = useState<AdItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [notices, setNotices] = useState<Notice[]>([]);

    const fetchAllJobs = async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            const [p, s, l, g] = await Promise.all([
                getRotatedAds('PREMIUM', 50),
                getRotatedAds('SPECIAL', 50),
                getRotatedAds('AD_GENERAL', 50),
                getRotatedAds('GENERAL', 50)
            ]);
            setPremiumJobs(p);
            setSpecialJobs(s);
            setLineJobs(l);
            setGeneralJobs(g);
        } catch (error) {
            console.error("Failed to fetch jobs:", error);
        }
        if (isInitial) setLoading(false);
    };

    useEffect(() => {
        fetchAllJobs(true);
        import('@/lib/actions/help').then(({ getHomeNotices }) => {
            getHomeNotices(5).then((rows) => {
                if (rows.length) {
                    setNotices(rows);
                }
            });
        });
    }, []);

    useEffect(() => {
        if (isPaused || notices.length === 0) return;
        const interval = setInterval(() => {
            setNoticeIndex((prev) => (prev + 1) % notices.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [isPaused, notices.length]);

    // 1분(60초)마다 서버에 요청하여 모든 유저가 동일한 순위를 보도록 강제 동기화
    useEffect(() => {
        const adInterval = setInterval(() => {
            fetchAllJobs();
        }, 60000); // 60초 주기
        return () => clearInterval(adInterval);
    }, []);

    // 🎨 [IMPACT DEMO] 22종 테마 전체 적용 (50개 카드)
    const impacts: any[] = [
        'gold', 'neon', 'neon_crazy', 'fire', 'ice', 'emerald', 'glitch', 'storm', 'ghost',
        'forest', 'ocean', 'sakura', 'galaxy', 'sun', 'lava', 'matrix', 'retro',
        'diamond', 'platinum', 'aura', 'candy', 'toxic'
    ];
    
    const demoJobs = premiumJobs.map((job, i) => {
        // 실제 유저가 선택한 테마가 있다면 적용하고, 가상 광고(또는 UPLOAD)일 경우 데모 효과를 순차적으로 입힘
        const finalImpact = (job.isRealAd && job.theme && job.theme !== 'UPLOAD') 
            ? job.theme 
            : impacts[i % impacts.length];
            
        // effectIntensity 변환 로직 (BizAdPaymentModal과 동일하게 처리)
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

    if (loading) {
        return (
            <div className="container px-4 md:px-6 py-24 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="font-bold text-gray-400">최신 구인 정보를 불러오고 있습니다...</p>
            </div>
        );
    }

    return (
        <main className="container px-4 md:px-6 py-6 md:py-8 space-y-8 md:space-y-10">
            {/* 1. Scrolling Notice Ticker */}
            <section>
                <div className="flex items-center gap-2 md:gap-3 py-1">
                    <div className="flex items-center shrink-0">
                        <Megaphone className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    </div>

                        <div
                            className="relative flex-1 h-6 overflow-hidden"
                            onMouseEnter={() => setIsPaused(true)}
                            onMouseLeave={() => setIsPaused(false)}
                        >
                            <div
                                className="transition-transform duration-500 ease-in-out"
                                style={{ transform: `translateY(-${noticeIndex * 24}px)` }}
                            >
                                {notices.map((n) => (
                                    <Link key={n.id} href="/help" className="h-6 flex items-center gap-3 group">
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {n.isNew && <span className="bg-orange-500 text-white text-[8px] font-black px-1 rounded-sm leading-none py-0.5">NEW</span>}
                                            {n.isHot && <span className="bg-primary text-black text-[8px] font-black px-1 rounded-sm leading-none py-0.5">HOT</span>}
                                        </div>
                                        <span className="text-[14px] font-bold text-gray-700 group-hover:text-primary transition-colors truncate">
                                            {n.title}
                                        </span>
                                        <span className="hidden sm:inline text-[11px] text-gray-400 font-medium ml-auto">
                                            {n.date}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <Link href="/help" className="pl-2 shrink-0 text-gray-300 hover:text-primary transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                </div>
            </section>

            {/* --- Tier 1: Premium Jobs (Demo: 50 Cards) --- */}
            <section>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-1 sm:gap-2">
                        <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-primary fill-primary animate-bounce" />
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 italic uppercase whitespace-nowrap">
                            {t.sections.premiumJobsTitle}
                        </h2>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <Button size="sm" className="hidden md:flex font-black h-9 px-4 rounded-lg shadow-sm active:scale-95 transition-transform text-white">
                             <Plus className="w-4 h-4 mr-1" /> {t.sections.postPremium}
                        </Button>
                        <button 
                            onClick={() => setShowAllPremium(!showAllPremium)}
                            className="text-xs sm:text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap"
                        >
                            {showAllPremium ? '접기' : (t.common.viewAll || '전체보기')} {showAllPremium ? <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </button>
                    </div>
                </div>
                
                {demoJobs.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-4 w-full">
                        {demoJobs.map((job, idx) => (
                            <div key={job.id} className={`w-[calc(50%-4px)] min-[425px]:w-[180px] lg:w-[195px] shrink-0 ${!showAllPremium && idx >= 12 ? 'hidden sm:block' : ''} ${!showAllPremium && idx >= 15 ? 'sm:hidden lg:block' : ''} ${!showAllPremium && idx >= 20 ? 'lg:hidden xl:block' : ''} ${!showAllPremium && idx >= 24 ? 'xl:hidden' : ''}`}>
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

            {/* --- Tier 2: Special Jobs --- */}
            <section>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-2xl font-black text-gray-900 flex items-center gap-1 sm:gap-2 italic uppercase whitespace-nowrap">
                        <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 animate-pulse" /> {t.sections.specialJobsTitle}
                    </h2>
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <Link href="/jobs" className="text-xs sm:text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap">
                            {t.common.viewAll || '전체보기'} <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Link>
                    </div>
                </div>
                {specialJobs.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-4 w-full">
                        {specialJobs.map((job, idx) => (
                            <div key={job.id} className={`w-[calc(50%-4px)] min-[425px]:w-[180px] lg:w-[195px] shrink-0 ${idx >= 12 ? 'hidden sm:block' : ''} ${idx >= 15 ? 'sm:hidden lg:block' : ''} ${idx >= 20 ? 'lg:hidden xl:block' : ''} ${idx >= 24 ? 'xl:hidden' : ''}`}>
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

            {/* --- Tier 3: General Jobs --- */}
            <section>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-2xl font-black text-gray-900 italic uppercase whitespace-nowrap">
                        {t.sections.generalJobsTitle}
                    </h2>
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <Link href="/jobs" className="text-xs sm:text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap">
                            {t.common.viewAll} <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Link>
                    </div>
                </div>
                {lineJobs.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-4 w-full">
                        {lineJobs.map((job, idx) => (
                            <div key={job.id} className={`w-[calc(50%-4px)] min-[425px]:w-[180px] lg:w-[195px] shrink-0 ${idx >= 12 ? 'hidden sm:block' : ''} ${idx >= 15 ? 'sm:hidden lg:block' : ''} ${idx >= 20 ? 'lg:hidden xl:block' : ''} ${idx >= 24 ? 'xl:hidden' : ''}`}>
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

            {/* --- Bottom Board Section --- */}
            <section className="border-t pt-10">
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    {/* 1. 구인정보 리스트 */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b-2 border-gray-900">
                            <h3 className="font-black text-[16px] md:text-lg uppercase tracking-tight text-gray-900 flex items-center gap-2">
                                📣 구인정보 리스트
                            </h3>
                            <Link href="/jobs" className="text-[11px] font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-0.5">
                                더보기 <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                        <ul className="space-y-1">
                            {[
                                { title: '[강남] 텐프로 주간/야간 급구',  info: '월 500 보장' },
                                { title: '[해운대] 룸싸롱 초보 환영, 숙식 제공', info: '당일 지급' },
                                { title: '[수원] 노래주점 식구 모집합니다',  info: '시급 7만' },
                                { title: '[인천] 하이퍼 가라오케 최고 대우', info: '협의' },
                                { title: '[제주] 로드샵 1인샵 단기 알바', info: '숙소 제공' },
                                { title: '[일산] 퍼블릭 주간 매니저 급구', info: '일 30 보장' }
                            ].map((job, i) => (
                                <li key={i} className="group border-b border-gray-100 last:border-none">
                                    <Link href="/jobs" className="flex items-center justify-between py-2.5 hover:translate-x-1 transition-transform">
                                        <span className="text-[13px] text-gray-700 font-medium group-hover:text-primary truncate pr-4">{job.title}</span>
                                        <span className="text-[11px] text-[#e53e3e] font-black whitespace-nowrap shrink-0">{job.info}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 2. 인재정보 리스트 */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b-2 border-gray-900">
                            <h3 className="font-black text-[16px] md:text-lg uppercase tracking-tight text-gray-900 flex items-center gap-2">
                                🙋‍♀️ 인재정보 리스트
                            </h3>
                            <Link href="/seekers" className="text-[11px] font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-0.5">
                                더보기 <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                        <ul className="space-y-1">
                            {[
                                { title: '경기/서울 투잡 구합니다 (주말만)', age: '24세' },
                                { title: '경력 3년차 분위기 잘 맞춥니다', age: '27세' },
                                { title: '초보인데 열심히 배우겠습니다', age: '21세' },
                                { title: '출퇴근 자유로운 곳 찾아요', age: '25세' },
                                { title: '단기 알바(1개월 급전) 구합니다', age: '22세' }
                            ].map((seeker, i) => (
                                <li key={i} className="group border-b border-gray-100 last:border-none">
                                    <Link href="/seekers" className="flex items-center justify-between py-2.5 hover:translate-x-1 transition-transform">
                                        <span className="text-[13px] text-gray-700 font-medium group-hover:text-primary truncate pr-4">{seeker.title}</span>
                                        <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap shrink-0">{seeker.age}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 3. 커뮤니티 리스트 */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b-2 border-gray-900">
                            <h3 className="font-black text-[16px] md:text-lg uppercase tracking-tight text-gray-900 flex items-center gap-2">
                                💬 커뮤니티 리스트
                            </h3>
                            <Link href="/community" className="text-[11px] font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-0.5">
                                더보기 <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                        <ul className="space-y-1">
                            {[
                                { title: '오늘 강남쪽 손님 많나요?', comments: 12 },
                                { title: '첫 출근인데 팁 좀 알려주세요 ㅠㅠ', comments: 34 },
                                { title: '진상 손님 대처법 공유합니다', comments: 8 },
                                { title: '이쪽 일 하면서 느낀점 (장문주의)', comments: 55 }
                            ].map((post, i) => (
                                <li key={i} className="group border-b border-gray-100 last:border-none">
                                    <Link href="/community" className="flex items-center justify-between py-2.5 hover:translate-x-1 transition-transform">
                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                            {i === 0 && <span className="bg-primary text-black text-[8px] font-black px-1 rounded-sm leading-none py-0.5 shrink-0">HOT</span>}
                                            <span className="text-[13px] text-gray-700 font-medium group-hover:text-primary truncate">{post.title}</span>
                                        </div>
                                        <span className="text-[11px] text-purple-600 font-bold whitespace-nowrap shrink-0">[{post.comments}]</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>
        </main>
    );
}
