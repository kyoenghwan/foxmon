'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Megaphone, Plus, Zap, Crown, Loader2, HelpCircle, ChevronLeft } from 'lucide-react';
import { PremiumJobCard } from '@/components/home/premium-job-card';
import { SpecialJobCard } from '@/components/home/special-job-card';
import { GeneralJobItem } from '@/components/home/general-job-item';
import { useLanguage } from '@/components/providers/language-provider';
import { getRotatedAds, AdItem } from '@/lib/ad-service';
import { AdPriceModal } from '@/components/jobs/AdPriceModal';
import { Button } from '@/components/ui/button';

interface Notice {
    id: number;
    title: string;
    date: string;
    isNew?: boolean;
    isHot?: boolean;
}

export function HomeJobSections() {
    const { t } = useLanguage();
    const [noticeIndex, setNoticeIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Firestore 데이터 상태
    const [premiumJobs, setPremiumJobs] = useState<AdItem[]>([]);
    const [specialJobs, setSpecialJobs] = useState<AdItem[]>([]);
    const [generalJobs, setGeneralJobs] = useState<AdItem[]>([]);
    const [loading, setLoading] = useState(true);

    // 공지사항 데이터
    const notices: Notice[] = [
        { id: 1, title: '[공지] 설 연휴 고객센터 운영 시간 안내', date: '2024-02-14', isNew: true },
        { id: 2, title: '[안내] 여우몬 웹 서비스 디자인 고도화 업데이트', date: '2024-02-13' },
        { id: 3, title: '[이벤트] 친구 초대하고 포인트 받자! (기간 연장)', date: '2024-02-12', isHot: true },
    ];

    // Firestore에서 티어별 광고 실시간 페치
    useEffect(() => {
        async function fetchAllJobs() {
            setLoading(true);
            try {
                const [p, s, g] = await Promise.all([
                    getRotatedAds('PREMIUM', 50),
                    getRotatedAds('SPECIAL', 50),
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
        fetchAllJobs();
    }, []);

    // 자동 롤링 효과 (공지사항)
    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setNoticeIndex((prev) => (prev + 1) % notices.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [isPaused, notices.length]);

    // 🎨 [IMPACT DEMO] 22종 테마 전체 적용 (50개 카드)
    const impacts: any[] = [
        'gold', 'neon', 'neon_crazy', 'fire', 'ice', 'emerald', 'glitch', 'storm', 'ghost',
        'forest', 'ocean', 'sakura', 'galaxy', 'sun', 'lava', 'matrix', 'retro',
        'diamond', 'platinum', 'aura', 'candy', 'toxic'
    ];
    const demoJobs = Array.from({ length: 50 }, (_, i) => {
        // 실제 데이터가 있으면 그것을 쓰고, 없으면 기본 목업 데이터 사용
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
            impactType: impacts[i % impacts.length] // 효과를 순차적으로 배분
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
        <main className="container px-4 md:px-6 py-12 space-y-12">
            {/* 1. Scrolling Notice Ticker */}
            <section>
                <div className="bg-white border rounded-2xl px-6 py-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 pr-6 border-r border-gray-100 shrink-0">
                            <div className="bg-primary p-1.5 rounded-lg">
                                <Megaphone className="w-4 h-4 text-black" />
                            </div>
                            <h3 className="font-black text-base tracking-tight uppercase whitespace-nowrap">{t.sections.notice}</h3>
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
                                    <Link key={n.id} href="/notice" className="h-6 flex items-center gap-3 group">
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

                        <Link href="/notice" className="pl-4 shrink-0 text-gray-300 hover:text-primary transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- Tier 1: Premium Jobs (Demo: 50 Cards) --- */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Crown className="w-6 h-6 text-primary fill-primary animate-bounce" />
                        <h2 className="text-2xl font-black text-gray-900 italic uppercase">
                            {t.sections.premiumJobsTitle} (IMPACT DEMO)
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <AdPriceModal type="premium" title="Premium" />
                        <Button size="sm" className="hidden md:flex font-black h-9 px-4 rounded-lg shadow-sm active:scale-95 transition-transform text-white">
                             <Plus className="w-4 h-4 mr-1" /> {t.sections.postPremium}
                        </Button>
                        <Link href="/jobs" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
                            {t.common.viewAll || '전체보기'} <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
                
                {demoJobs.length > 0 ? (
                    <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4xl:grid-cols-8 gap-2 sm:gap-3 xl:gap-4 w-full
                        [&>*:nth-child(n+21)]:hidden 
                        sm:[&>*:nth-child(n+21)]:block sm:[&>*:nth-child(n+31)]:hidden 
                        md:[&>*:nth-child(n+31)]:block md:[&>*:nth-child(n+41)]:hidden 
                        2xl:[&>*:nth-child(n+41)]:block 2xl:[&>*:nth-child(n+51)]:hidden 
                        3xl:[&>*:nth-child(n+51)]:block 3xl:[&>*:nth-child(n+61)]:hidden
                    `}>
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

            {/* --- Tier 2: Special Jobs --- */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2 italic uppercase">
                        <Zap className="w-6 h-6 text-yellow-500 animate-pulse" /> {t.sections.specialJobsTitle}
                    </h2>
                    <div className="flex items-center gap-3">
                        <AdPriceModal type="special" title="Special" />
                        <Link href="/jobs/post" className="flex items-center gap-1.5 px-4 py-1.5 bg-yellow-400 text-black text-[11px] font-black rounded-lg hover:scale-105 transition-transform shadow-sm">
                            <Plus className="w-3.5 h-3.5" /> {t.sections.postSpecial}
                        </Link>
                        <Link href="/jobs" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
                            {t.common.viewAll || '전체보기'} <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
                {specialJobs.length > 0 ? (
                    <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4xl:grid-cols-8 gap-2 sm:gap-3 xl:gap-4 w-full grid-flow-dense
                        [&>*:nth-child(n+21)]:hidden 
                        sm:[&>*:nth-child(n+21)]:block sm:[&>*:nth-child(n+31)]:hidden 
                        md:[&>*:nth-child(n+31)]:block md:[&>*:nth-child(n+41)]:hidden 
                        2xl:[&>*:nth-child(n+41)]:block 2xl:[&>*:nth-child(n+51)]:hidden 
                        3xl:[&>*:nth-child(n+51)]:block 3xl:[&>*:nth-child(n+61)]:hidden
                    `}>
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

            {/* --- Tier 3: General Jobs --- */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-gray-900 italic uppercase">
                        {t.sections.generalJobsTitle}
                    </h2>
                    <div className="flex items-center gap-3">
                        <Link href="/jobs/post" className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-[11px] font-bold rounded-lg hover:bg-gray-50 transition-colors">
                            <Plus className="w-3.5 h-3.5" /> {t.sections.postGeneral}
                        </Link>
                        <Link href="/jobs" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
                            {t.common.viewAll} <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
                {generalJobs.length > 0 ? (
                    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-2 sm:gap-3 w-full
                        [&>*:nth-child(n+21)]:hidden 
                        sm:[&>*:nth-child(n+21)]:block sm:[&>*:nth-child(n+31)]:hidden 
                        md:[&>*:nth-child(n+31)]:block md:[&>*:nth-child(n+41)]:hidden 
                        2xl:[&>*:nth-child(n+41)]:block 2xl:[&>*:nth-child(n+51)]:hidden 
                        3xl:[&>*:nth-child(n+51)]:block 3xl:[&>*:nth-child(n+61)]:hidden
                    `}>
                        {generalJobs.map((job) => (
                            <GeneralJobItem key={job.id} {...(job as any)} />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center">
                        <p className="text-gray-400 font-bold">등록된 일반 공고가 없습니다.</p>
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
