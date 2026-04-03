'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { getRotatedAds, recordAdExposure, AdItem } from '@/lib/ad-service';

export function SideBanners() {
    const [leftAds, setLeftAds] = useState<AdItem[]>([]);
    const [rightAds, setRightAds] = useState<AdItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSideAds() {
            setLoading(true);
            try {
                // 사이드 배너용으로 SPECIAL 티어 광고를 활용 (좌4, 우4)
                const [left, right] = await Promise.all([
                    getRotatedAds('SPECIAL', 4),
                    getRotatedAds('SPECIAL', 4)
                ]);
                setLeftAds(left);
                setRightAds(right);
            } catch (error) {
                console.error("Failed to fetch side ads:", error);
            }
            setLoading(false);
        }
        fetchSideAds();
    }, []);

    const handleAdClick = (adId: string) => {
        recordAdExposure(adId);
    };

    if (loading) return null; // 사이드 배너 로딩 시에는 공간만 비워둠 (혹은 심플한 스켈레톤)

    const BannerCard = ({ ad }: { ad: AdItem }) => {
        // 업체명 ও 업종 파싱
        let displayName = ad.company;
        let category = '유흥';
        if (ad.company.includes('(') && ad.company.includes(')')) {
            const match = ad.company.match(/(.*)\((.*)\)/);
            if (match) {
                displayName = match[1].trim();
                category = match[2].trim();
            }
        }
        
        // 급여 파싱
        let payAmount = ad.pay;
        if (ad.pay.includes(']')) {
            const parts = ad.pay.split(']');
            payAmount = parts[1].trim();
        }

        return (
            <Link
                key={ad.id}
                href={`/jobs/${ad.id}`}
                onClick={() => handleAdClick(ad.id)}
                className="group relative block w-full aspect-[1/2] bg-white rounded-xl border border-gray-200 hover:border-purple-600 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 p-2 flex flex-col"
            >
                {/* 1. 상단: 업체 로고 */}
                <div className="w-full h-[60px] rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center mb-2 border border-gray-100 flex-shrink-0 relative">
                    {ad.image ? (
                        <div 
                            className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-110"
                            style={{ backgroundImage: `url(${ad.image})` }} 
                        />
                    ) : (
                        <span className="text-[10px] font-black text-gray-300 tracking-widest leading-none text-center">NO<br/>LOGO</span>
                    )}
                </div>

                {/* 2. 로고 아래: 업체명, 지역/업종 */}
                <div className="flex flex-col mb-1.5 px-0.5 space-y-0.5">
                    <h3 className="font-extrabold text-[12px] text-gray-900 group-hover:text-purple-600 transition-colors truncate tracking-tight">
                        {displayName}
                    </h3>
                    <div className="text-[10px] text-gray-500 font-bold truncate tracking-tighter flex items-center">
                        <span className="text-[#2b6cb0] border border-[#2b6cb0] px-0.5 bg-[#ebf8ff] mr-1 rounded-[2px] leading-tight">
                            {ad.location.split(' ')[0] || '전국'}
                        </span>
                        <span className="truncate">{category}</span>
                    </div>
                </div>

                {/* 3. 간단한 글 (멘트) */}
                <div className="mb-2 px-0.5 flex-1 min-h-[32px] flex items-start">
                    <p className="text-[11px] text-gray-800 line-clamp-2 leading-[1.4] font-bold tracking-tight bg-green-200/50 inline box-decoration-clone rounded-[2px] px-0.5 py-0.5">
                        {ad.title}
                    </p>
                </div>

                {/* 4. 급여 */}
                <div className="mt-auto pt-1.5 border-t border-gray-100 relative items-center justify-center flex">
                    <span className="text-[#e53e3e] text-[12px] font-black tracking-tighter flex items-center gap-[1px]">
                        {payAmount} <span className="text-[#e53e3e] text-[9px] mb-0.5 mt-auto">↑</span>
                    </span>
                    
                    {/* 프리미엄 뱃지 장식 (우측 상단 절대 배치) */}
                    <div className="absolute -top-[128px] -right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-purple-600 text-white text-[8px] font-black px-[4px] py-[2px] rounded-bl shadow-sm transform rotate-12 scale-90">HOT</div>
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <>
            {/* Left Wing */}
            <div className={`
                hidden xl:flex flex-col gap-3 fixed top-[220px] w-[130px] z-20 transition-all duration-300
                left-[max(10px,calc(50%-780px))] 
                2xl:left-[max(10px,calc(50%-908px))]
                3xl:left-[max(10px,calc(50%-1100px))]
                4xl:left-[max(10px,calc(50%-1340px))]
            `}>
                <div className="text-[10px] font-black text-gray-400 mb-1 ml-1 uppercase tracking-widest">Special Pick</div>
                {leftAds.map((ad) => (
                    <BannerCard key={ad.id} ad={ad} />
                ))}
                <Link
                    href="/biz/ads/new"
                    className="w-full py-2.5 bg-primary hover:bg-orange-600 text-white text-[11px] font-black rounded-xl text-center transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1"
                >
                    + 광고등록
                </Link>
            </div>

            {/* Right Wing */}
            <div className={`
                hidden xl:flex flex-col gap-3 fixed top-[220px] w-[130px] z-20 transition-all duration-300
                right-[max(10px,calc(50%-780px))] 
                2xl:right-[max(10px,calc(50%-908px))]
                3xl:right-[max(10px,calc(50%-1100px))]
                4xl:right-[max(10px,calc(50%-1340px))]
            `}>
                <div className="text-[10px] font-black text-gray-400 mb-1 ml-1 uppercase tracking-widest">Premium Ad</div>
                {rightAds.map((ad) => (
                    <BannerCard key={ad.id} ad={ad} />
                ))}
                <Link
                    href="/biz/ads/new"
                    className="w-full py-2.5 bg-primary hover:bg-orange-600 text-white text-[11px] font-black rounded-xl text-center transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1"
                >
                    + 광고등록
                </Link>
            </div>
        </>
    );
}
