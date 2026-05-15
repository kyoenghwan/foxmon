'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Megaphone, Plus, Zap, Crown, Loader2, HelpCircle, ChevronLeft } from 'lucide-react';
import { PremiumJobCard } from '@/components/home/premium-job-card';
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

    // Firestore ?∞Ïù¥???ÅÌÉú
    const [premiumJobs, setPremiumJobs] = useState<AdItem[]>([]);
    const [specialJobs, setSpecialJobs] = useState<AdItem[]>([]);
    const [lineJobs, setLineJobs] = useState<AdItem[]>([]);
    const [generalJobs, setGeneralJobs] = useState<AdItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Í≥µÏ??¨Ìï≠ ?∞Ïù¥??
    const notices: Notice[] = [
        { id: 1, title: '[Í≥µÏ?] ???∞Ìú¥ Í≥†Í∞ù?ºÌÑ∞ ?¥ÏòÅ ?úÍ∞Ñ ?àÎÇ¥', date: '2024-02-14', isNew: true },
        { id: 2, title: '[?àÎÇ¥] ??ä§Î™????úÎπÑ???îÏûê??Í≥†ÎèÑ???ÖÎç∞?¥Ìä∏', date: '2024-02-13' },
        { id: 3, title: '[?¥Î≤§?? ÏπúÍµ¨ Ï¥àÎ??òÍ≥† ?¨Ïù∏??Î∞õÏûê! (Í∏∞Í∞Ñ ?∞Ïû•)', date: '2024-02-12', isHot: true },
    ];

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

    // Firestore?êÏÑú ?∞Ïñ¥Î≥?Í¥ëÍ≥† ?§ÏãúÍ∞??òÏπò (ÏµúÏ¥à Î°úÎìú ??
    useEffect(() => {
        fetchAllJobs(true);
    }, []);

    // ?êÎèô Î°§ÎßÅ ?®Í≥º (Í≥µÏ??¨Ìï≠)
    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setNoticeIndex((prev) => (prev + 1) % notices.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [isPaused, notices.length]);

    // 1Î∂?60Ï¥?ÎßàÎã§ ?úÎ≤Ñ???îÏ≤≠?òÏó¨ Î™®Îì† ?†Ï?Í∞Ä ?ôÏùº???úÏúÑÎ•?Î≥¥ÎèÑÎ°?Í∞ïÏ†ú ?ôÍ∏∞??
    useEffect(() => {
        const adInterval = setInterval(() => {
            fetchAllJobs();
        }, 60000); // 60Ï¥?Ï£ºÍ∏∞
        return () => clearInterval(adInterval);
    }, []);

    // ?é® [IMPACT DEMO] 22Ï¢??åÎßà ?ÑÏ≤¥ ?ÅÏö© (50Í∞?Ïπ¥Îìú)
    const impacts: any[] = [
        'gold', 'neon', 'neon_crazy', 'fire', 'ice', 'emerald', 'glitch', 'storm', 'ghost',
        'forest', 'ocean', 'sakura', 'galaxy', 'sun', 'lava', 'matrix', 'retro',
        'diamond', 'platinum', 'aura', 'candy', 'toxic'
    ];
    
    const demoJobs = premiumJobs.map((job, i) => {
        // ?§Ï†ú ?†Ï?Í∞Ä ?†ÌÉù???åÎßàÍ∞Ä ?àÎã§Î©??ÅÏö©?òÍ≥†, Í∞Ä??Í¥ëÍ≥†(?êÎäî UPLOAD)??Í≤ΩÏö∞ ?∞Î™® ?®Í≥ºÎ•??úÏ∞®?ÅÏúºÎ°??ÖÌûò
        const finalImpact = (job.isRealAd && job.theme && job.theme !== 'UPLOAD') 
            ? job.theme 
            : impacts[i % impacts.length];
            
        // effectIntensity Î≥Ä??Î°úÏßÅ (BizAdPaymentModalÍ≥??ôÏùº?òÍ≤å Ï≤òÎ¶¨)
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
                <p className="font-bold text-gray-400">ÏµúÏã† Íµ¨Ïù∏ ?ïÎ≥¥Î•?Î∂àÎü¨?§Í≥† ?àÏäµ?àÎã§...</p>
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
                            {t.common.viewAll || '?ÑÏ≤¥Î≥¥Í∏∞'} <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
                
                {demoJobs.length > 0 ? (
                    <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 w-full
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
                                effectIntensity={(job as any).effectIntensity}
                                customColor={(job as any).customColor}
                                bgOpacity={(job as any).bgOpacity}
                                tier="PREMIUM"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center">
                        <p className="text-gray-400 font-bold">?±Î°ù???ÑÎ¶¨ÎØ∏ÏóÑ Í¥ëÍ≥†Í∞Ä ?ÜÏäµ?àÎã§.</p>
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
                            {t.common.viewAll || '?ÑÏ≤¥Î≥¥Í∏∞'} <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
                {specialJobs.length > 0 ? (
                    <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 w-full grid-flow-dense
                        [&>*:nth-child(n+21)]:hidden 
                        sm:[&>*:nth-child(n+21)]:block sm:[&>*:nth-child(n+31)]:hidden 
                        md:[&>*:nth-child(n+31)]:block md:[&>*:nth-child(n+41)]:hidden 
                        2xl:[&>*:nth-child(n+41)]:block 2xl:[&>*:nth-child(n+51)]:hidden 
                        3xl:[&>*:nth-child(n+51)]:block 3xl:[&>*:nth-child(n+61)]:hidden
                    `}>
                        {specialJobs.map((job) => (
                            <PremiumJobCard 
                                key={job.id} 
                                {...(job as any)} 
                                impactType="none" 
                                effectIntensity="none" 
                                tier="SPECIAL" 
                                customColor={(job as any).color} 
                                bgOpacity={(job as any).bg_opacity}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center">
                        <p className="text-gray-400 font-bold">?±Î°ù???§Ìéò??Í¥ëÍ≥†Í∞Ä ?ÜÏäµ?àÎã§.</p>
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
                {lineJobs.length > 0 ? (
                    <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 w-full
                        [&>*:nth-child(n+21)]:hidden 
                        sm:[&>*:nth-child(n+21)]:block sm:[&>*:nth-child(n+31)]:hidden 
                        md:[&>*:nth-child(n+31)]:block md:[&>*:nth-child(n+41)]:hidden 
                        2xl:[&>*:nth-child(n+41)]:block 2xl:[&>*:nth-child(n+51)]:hidden 
                        3xl:[&>*:nth-child(n+51)]:block 3xl:[&>*:nth-child(n+61)]:hidden
                    `}>
                        {lineJobs.map((job) => (
                            <PremiumJobCard 
                                key={job.id} 
                                {...(job as any)} 
                                impactType="none" 
                                effectIntensity="none" 
                                hideLogo={true} 
                                tier="GENERAL" 
                                customColor={(job as any).color} 
                                bgOpacity={(job as any).bg_opacity}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center">
                        <p className="text-gray-400 font-bold">?±Î°ù???ºÎ∞ò Í¥ëÍ≥†Í∞Ä ?ÜÏäµ?àÎã§.</p>
                    </div>
                )}
            </section>

            {/* --- Bottom Board Section --- */}
            <section className="border-t pt-10">
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    {/* 1. Íµ¨Ïù∏?ïÎ≥¥ Î¶¨Ïä§??*/}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b-2 border-gray-900">
                            <h3 className="font-black text-[16px] md:text-lg uppercase tracking-tight text-gray-900 flex items-center gap-2">
                                ?ì£ Íµ¨Ïù∏?ïÎ≥¥ Î¶¨Ïä§??
                            </h3>
                            <Link href="/jobs" className="text-[11px] font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-0.5">
                                ?îÎ≥¥Í∏?<ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                        <ul className="space-y-1">
                            {[
                                { title: '[Í∞ïÎÇ®] ?êÌîÑÎ°?Ï£ºÍ∞Ñ/?ºÍ∞Ñ Í∏âÍµ¨',  info: '??500 Î≥¥Ïû•' },
                                { title: '[?¥Ïö¥?Ä] Î£∏Ïã∏Î°?Ï¥àÎ≥¥ ?òÏòÅ, ?ôÏãù ?úÍ≥µ', info: '?πÏùº ÏßÄÍ∏? },
                                { title: '[?òÏõê] ?∏ÎûòÏ£ºÏ†ê ?ùÍµ¨ Î™®Ïßë?©Îãà??,  info: '?úÍ∏â 7Îß? },
                                { title: '[?∏Ï≤ú] ?òÏù¥??Í∞Ä?ºÏò§ÏºÄ ÏµúÍ≥† ?Ä??, info: '?ëÏùò' },
                                { title: '[?úÏ£º] Î°úÎìú??1?∏ÏÉµ ?®Í∏∞ ?åÎ∞î', info: '?ôÏÜå ?úÍ≥µ' },
                                { title: '[?ºÏÇ∞] ?ºÎ∏îÎ¶?Ï£ºÍ∞Ñ Îß§Îãà?Ä Í∏âÍµ¨', info: '??30 Î≥¥Ïû•' }
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

                    {/* 2. ?∏Ïû¨?ïÎ≥¥ Î¶¨Ïä§??*/}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b-2 border-gray-900">
                            <h3 className="font-black text-[16px] md:text-lg uppercase tracking-tight text-gray-900 flex items-center gap-2">
                                ?ôã?ç‚?Ô∏??∏Ïû¨?ïÎ≥¥ Î¶¨Ïä§??
                            </h3>
                            <Link href="/seekers" className="text-[11px] font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-0.5">
                                ?îÎ≥¥Í∏?<ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                        <ul className="space-y-1">
                            {[
                                { title: 'Í≤ΩÍ∏∞/?úÏö∏ ?¨Ïû° Íµ¨Ìï©?àÎã§ (Ï£ºÎßêÎß?', age: '24?? },
                                { title: 'Í≤ΩÎ†• 3?ÑÏ∞® Î∂ÑÏúÑÍ∏???ÎßûÏ∂•?àÎã§', age: '27?? },
                                { title: 'Ï¥àÎ≥¥?∏Îç∞ ?¥Ïã¨??Î∞∞Ïö∞Í≤†Ïäµ?àÎã§', age: '21?? },
                                { title: 'Ï∂úÌá¥Í∑??êÏú†Î°úÏö¥ Í≥?Ï∞æÏïÑ??, age: '25?? },
                                { title: '?®Í∏∞ ?åÎ∞î(1Í∞úÏõî Í∏âÏ†Ñ) Íµ¨Ìï©?àÎã§', age: '22?? }
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

                    {/* 3. Ïª§Î??àÌã∞ Î¶¨Ïä§??*/}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b-2 border-gray-900">
                            <h3 className="font-black text-[16px] md:text-lg uppercase tracking-tight text-gray-900 flex items-center gap-2">
                                ?í¨ Ïª§Î??àÌã∞ Î¶¨Ïä§??
                            </h3>
                            <Link href="/community" className="text-[11px] font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-0.5">
                                ?îÎ≥¥Í∏?<ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                        <ul className="space-y-1">
                            {[
                                { title: '?§Îäò Í∞ïÎÇ®Ï™??êÎãò ÎßéÎÇò??', comments: 12 },
                                { title: 'Ï≤?Ï∂úÍ∑º?∏Îç∞ ??Ï¢Ä ?åÎ†§Ï£ºÏÑ∏???†„Ö†', comments: 34 },
                                { title: 'ÏßÑÏÉÅ ?êÎãò ?ÄÏ≤òÎ≤ï Í≥µÏú†?©Îãà??, comments: 8 },
                                { title: '?¥Ï™Ω ???òÎ©¥???êÎ???(?•Î¨∏Ï£ºÏùò)', comments: 55 }
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
