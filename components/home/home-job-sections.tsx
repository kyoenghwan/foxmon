'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Megaphone, Plus, Zap, Crown, Loader2, ChevronLeft, Briefcase } from 'lucide-react';
import { PremiumJobCard } from '@/components/home/premium-job-card';
import { useLanguage } from '@/components/providers/language-provider';
import { getRotatedAds, AdItem } from '@/lib/ad-service';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useAdStore } from '@/hooks/use-ad-store';

interface Notice {
    id: string;
    title: string;
    date: string;
    isNew?: boolean;
    isHot?: boolean;
}

function getResponsiveHideClass(idx: number, maxRows: number): string {
  if (maxRows === 6) {
    let classes = '';
    if (idx >= 12) classes += ' max-md:hidden';
    if (idx >= 18) classes += ' min-[768px]:max-[799px]:hidden';
    if (idx >= 24) classes += ' min-[800px]:max-[1439px]:hidden';
    if (idx >= 30) classes += ' min-[1440px]:max-[1919px]:hidden';
    if (idx >= 36) classes += ' min-[1920px]:max-[2559px]:hidden';
    if (idx >= 48) classes += ' min-[2560px]:hidden';
    return classes.trim();
  }
  if (maxRows === 5) {
    let classes = '';
    if (idx >= 10) classes += ' max-md:hidden';
    if (idx >= 15) classes += ' min-[768px]:max-[799px]:hidden';
    if (idx >= 20) classes += ' min-[800px]:max-[1439px]:hidden';
    if (idx >= 25) classes += ' min-[1440px]:max-[1919px]:hidden';
    if (idx >= 25) classes += ' min-[1920px]:max-[2559px]:hidden';
    if (idx >= 25) classes += ' min-[2560px]:hidden';
    return classes.trim();
  }
  if (maxRows === 3) {
    let classes = '';
    if (idx >= 6) classes += ' max-md:hidden';
    if (idx >= 9) classes += ' min-[768px]:max-[799px]:hidden';
    if (idx >= 12) classes += ' min-[800px]:max-[1439px]:hidden';
    if (idx >= 15) classes += ' min-[1440px]:max-[1919px]:hidden';
    if (idx >= 18) classes += ' min-[1920px]:max-[2559px]:hidden';
    if (idx >= 24) classes += ' min-[2560px]:hidden';
    return classes.trim();
  }
  return '';
}


interface HomeJobSectionsProps {
    initialData?: {
        sideAds: AdItem[];
        premiumMainAds: AdItem[];
        premiumJobs: AdItem[];
        specialJobs: AdItem[];
        lineJobs: AdItem[];
        generalJobs: AdItem[];
    };
}

export function HomeJobSections({ initialData }: HomeJobSectionsProps) {
    const { data: session } = useSession();

    const { t } = useLanguage();
    const [noticeIndex, setNoticeIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showAllPremium, setShowAllPremium] = useState(false);
    const [showAllSpecial, setShowAllSpecial] = useState(false);
    const [showAllGeneral, setShowAllGeneral] = useState(false);

    // Zustand 글로벌 광고 데이터 상태 연동
    const store = useAdStore();
    const initializedRef = React.useRef(false);

    // 컴포넌트 마운트 전 렌더 패스(Render Pass) 단에서 동기식 스토어 주입 (Race Condition 방지)
    if (initialData && !initializedRef.current && !store.isJobsLoaded) {
        store.setInitialData(initialData);
        initializedRef.current = true;
    }

    const { 
        premiumJobs, 
        specialJobs, 
        lineJobs, 
        generalJobs, 
        isJobsLoaded, 
        fetchJobs,
        rotateJobs
    } = store;

    const [loading, setLoading] = useState(initialData ? false : !isJobsLoaded);
    const [notices, setNotices] = useState<Notice[]>([]);

    useEffect(() => {
        if (!isJobsLoaded && !initialData) {
            setLoading(true);
            fetchJobs().then(() => setLoading(false));
        }

        import('@/lib/actions/help').then(({ getHomeNotices }) => {
            getHomeNotices(5).then((rows) => {
                if (rows.length) {
                    setNotices(rows);
                }
            });
        });
    }, [isJobsLoaded, fetchJobs, initialData]);

    useEffect(() => {
        if (isPaused || notices.length === 0) return;
        const interval = setInterval(() => {
            setNoticeIndex((prev) => (prev + 1) % notices.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [isPaused, notices.length]);

    // 1분(60초)마다 로컬 메모리 상에서 배너 순서 순환
    useEffect(() => {
        const adInterval = setInterval(() => {
            rotateJobs();
        }, 60000); // 60초 주기
        return () => clearInterval(adInterval);
    }, [rotateJobs]);

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
                finalEffectIntensity = `${job.effect_intensity || 'medium'}::${job.action_type || 'none'}`;
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
        <main className="container px-4 lg:px-6 py-6 md:py-8 space-y-8 md:space-y-10">
            {/* 1. Scrolling Notice Ticker */}
            <section className="bg-gray-50/60 border border-gray-100 rounded-2xl px-4 py-2.5 shadow-sm">
                <div className="flex items-center gap-2 md:gap-3">
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
                                    <span className="text-[13px] sm:text-[14px] font-bold text-gray-700 group-hover:text-primary transition-colors truncate">
                                        {n.title}
                                    </span>
                                    <span className="hidden sm:inline text-[11px] text-gray-400 font-medium ml-auto">
                                        {n.date}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <Link href="/help" className="pl-2 shrink-0 text-gray-400 hover:text-primary transition-colors">
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Link>
                </div>
            </section>

            {/* --- Tier 1: Premium Jobs (Demo: 50 Cards) --- */}
            <section>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2 border-b pb-4">
                    <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-2">
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-primary fill-primary animate-bounce" />
                            <h2 className="text-lg sm:text-2xl font-black text-gray-900 italic uppercase whitespace-nowrap">
                                {t.sections.premiumJobsTitle}
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-3 ml-auto">
                        {session?.user?.role !== 'VIEWER' && (
                            <Link href="/biz/ads/new">
                                <span className="text-xs sm:text-sm font-black text-white bg-primary hover:bg-orange-600 px-3 py-1.5 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1">
                                    <Plus className="w-3.5 h-3.5" /> 광고 등록
                                </span>
                            </Link>
                        )}
                        <button 
                            onClick={() => setShowAllPremium(!showAllPremium)}
                            className="text-xs sm:text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap"
                        >
                            {showAllPremium ? '접기' : (t.common.viewAll || '전체보기')} {showAllPremium ? <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </button>
                    </div>
                </div>
                
                {demoJobs.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 min-[800px]:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-5 4xl:grid-cols-5 gap-2 lg:gap-4 w-fit mx-auto">
                        {demoJobs.map((job, idx) => (
                            <div 
                                key={job.id} 
                                className={`w-full ${
                                    !showAllPremium ? getResponsiveHideClass(idx, 5) : ''
                                }`}
                            >
                                <PremiumJobCard 
                                    {...(job as any)} 
                                    impactType={(job as any).impactType}
                                    effectIntensity={(job as any).effectIntensity}
                                    customColor={(job as any).customColor}
                                    bgOpacity={(job as any).bgOpacity}
                                    tier="PREMIUM"
                                    rawAd={job}
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



            {/* --- Tier 3: General Jobs --- */}
            <section>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-2xl font-black text-gray-900 italic uppercase whitespace-nowrap flex items-center gap-1 sm:gap-2">
                        <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" /> {t.sections.generalJobsTitle}
                    </h2>
                    <div className="flex items-center gap-1.5 sm:gap-3">

                        {session?.user?.role !== 'VIEWER' && (
                            <Link href="/biz/ads/new">
                                <span className="text-xs sm:text-sm font-black text-white bg-primary hover:bg-orange-600 px-3 py-1.5 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1">
                                    <Plus className="w-3.5 h-3.5" /> 광고 등록
                                </span>
                            </Link>
                        )}
                        <button 
                            onClick={() => setShowAllGeneral(!showAllGeneral)}
                            className="text-xs sm:text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap"
                        >
                            {showAllGeneral ? '접기' : (t.common.viewAll || '전체보기')} {showAllGeneral ? <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </button>
                    </div>
                </div>
                {lineJobs.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 min-[800px]:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-5 4xl:grid-cols-5 gap-2 lg:gap-4 w-fit mx-auto">
                        {lineJobs.map((job, idx) => (
                            <div 
                                key={job.id} 
                                className={`w-full ${
                                    !showAllGeneral ? getResponsiveHideClass(idx, 5) : ''
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
                                    rawAd={job}
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
                <div className={session?.user?.role === 'VIEWER' ? "grid md:grid-cols-2 gap-6 lg:gap-8" : "grid md:grid-cols-3 gap-6 lg:gap-8"}>
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
                    {session?.user?.role !== 'VIEWER' && (
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
                    )}
                </div>
            </section>
        </main>
    );
}
