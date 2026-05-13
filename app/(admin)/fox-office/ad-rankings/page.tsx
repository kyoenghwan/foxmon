'use client';

import React, { useEffect, useState } from 'react';
import { Crown, ArrowUp, ArrowDown, Minus, RefreshCw } from 'lucide-react';
import { getAdRankingSimulation, RankingSimResult } from '@/lib/ad-ranking-service';

export default function AdRankingsPage() {
    const [tier, setTier] = useState<any>('PREMIUM_MAIN');
    const [rankings, setRankings] = useState<RankingSimResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    const loadRankings = async () => {
        setLoading(true);
        try {
            const data = await getAdRankingSimulation(tier);
            setRankings(data);
            setLastUpdate(new Date());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRankings();
        const interval = setInterval(loadRankings, 60000); // 1분마다 자동 갱신
        return () => clearInterval(interval);
    }, [tier]);

    const getRankChange = (current: number, prev: number | null) => {
        if (prev === null) return <span className="text-[11px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mx-auto">NEW 진입</span>;
        
        const diff = prev - current; // prev가 12고 current가 10이면 +2 (상승)
        
        if (diff > 5) return <span className="text-[11px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mx-auto"><ArrowUp className="w-3 h-3" /> {diff} JUMP!</span>;
        if (diff > 0) return <span className="text-[12px] font-bold text-red-500 flex items-center gap-0.5 justify-center"><ArrowUp className="w-3 h-3" /> {diff}</span>;
        if (diff < 0) return <span className="text-[12px] font-bold text-blue-500 flex items-center gap-0.5 justify-center"><ArrowDown className="w-3 h-3" /> {Math.abs(diff)}</span>;
        return <span className="text-[12px] font-bold text-gray-400 flex items-center gap-0.5 justify-center"><Minus className="w-3 h-3" /> 유지</span>;
    };

    return (
        <div className="w-full max-w-[1200px] mx-auto p-4 sm:p-8 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Crown className="w-7 h-7 text-yellow-500" />
                    광고/배너 랭킹 현황
                </h1>
                <p className="text-sm text-gray-500">플랫폼 내 노출 중인 프리미엄 배너들의 실시간 롤링 순위 및 변동 내역을 모니터링합니다.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        {['PREMIUM_MAIN', 'PREMIUM', 'SIDE', 'SPECIAL', 'GENERAL'].map(t => (
                            <button 
                                key={t}
                                onClick={() => setTier(t)}
                                className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-colors ${tier === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    
                    <button onClick={loadRankings} disabled={loading} className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {lastUpdate.toLocaleTimeString()} 갱신
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b-2 border-gray-100">
                                <th className="p-4 text-[13px] font-black text-gray-400 w-20 text-center">순위</th>
                                <th className="p-4 text-[13px] font-black text-gray-400">광고 정보</th>
                                <th className="p-4 text-[13px] font-black text-gray-400 w-32">옵션 현황</th>
                                <th className="p-4 text-[13px] font-black text-gray-400 w-28 text-center">1분 전 대비</th>
                                <th className="p-4 text-[13px] font-black text-gray-400 w-28 text-center">5분 전 대비</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rankings.map((item) => (
                                <tr key={item.ad.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-[14px] font-black ${item.currentRank <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {item.currentRank}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {(item.ad.logo_url || item.ad.image) ? (
                                                <img src={item.ad.logo_url || item.ad.image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-100" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0 border border-gray-100" />
                                            )}
                                            <div>
                                                <div className="font-bold text-[14px] text-gray-900 line-clamp-1">{item.ad.title}</div>
                                                <div className="text-[12px] text-gray-500 mt-0.5">{item.ad.company}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            {item.ad.option_double_slot && <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded w-fit">더블 슬롯</span>}
                                            {item.ad.option_jump && <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded w-fit">오토 점프</span>}
                                            {!item.ad.option_double_slot && !item.ad.option_jump && <span className="text-[11px] text-gray-400">-</span>}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        {getRankChange(item.currentRank, item.prevRank)}
                                    </td>
                                    <td className="p-4 text-center">
                                        {getRankChange(item.currentRank, item.prev5Rank)}
                                    </td>
                                </tr>
                            ))}
                            {rankings.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500 text-[14px]">
                                        조회된 광고가 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
