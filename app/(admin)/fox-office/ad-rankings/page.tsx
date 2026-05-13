'use client';

import React, { useEffect, useState } from 'react';
import { Crown, ArrowUp, ArrowDown, Minus, RefreshCw, Timer } from 'lucide-react';
import { getAdRankingSimulation, RankingSimResult } from '@/lib/ad-ranking-service';

const TIER_LABELS: Record<string, string> = {
    PREMIUM_MAIN: '메인',
    SIDE: '사이드',
    PREMIUM: '프리미엄',
    SPECIAL: '스페셜',
    GENERAL: '일반'
};

export default function AdRankingsPage() {
    const [tier, setTier] = useState<any>('PREMIUM_MAIN');
    const [rankings, setRankings] = useState<RankingSimResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(60);

    const loadRankings = async () => {
        setLoading(true);
        try {
            const data = await getAdRankingSimulation(tier);
            setRankings(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRankings();
        setTimeLeft(60);
        
        const timerId = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    loadRankings();
                    return 60;
                }
                return prev - 1;
            });
        }, 1000); // 1초마다 카운트다운 다운
        
        return () => clearInterval(timerId);
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
                    광고/배너 관리
                </h1>
                <p className="text-sm text-gray-500">플랫폼 내 노출 중인 프리미엄 배너들의 실시간 롤링 순위 및 변동 내역을 모니터링합니다.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
                <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">랭킹 현황</h2>
                        <div className="flex gap-2">
                            {['PREMIUM_MAIN', 'SIDE', 'PREMIUM', 'SPECIAL', 'GENERAL'].map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setTier(t)}
                                    className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-colors ${tier === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {TIER_LABELS[t]}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5 text-[13px] font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                            <Timer className="w-4 h-4 text-primary" />
                            다음 랭킹 갱신까지 <span className="text-primary tabular-nums min-w-[2ch] text-right">{timeLeft}</span>초
                        </div>
                        <button onClick={() => { setTimeLeft(60); loadRankings(); }} disabled={loading} className="flex items-center gap-1.5 text-[12px] font-bold text-gray-400 hover:text-gray-900 transition-colors">
                            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                            즉시 갱신
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b-2 border-gray-100">
                                <th className="p-4 text-[13px] font-black text-gray-400 w-24 text-center">랭킹 순위</th>
                                <th className="p-4 text-[13px] font-black text-gray-400">광고 정보</th>
                                <th className="p-4 text-[13px] font-black text-gray-400 w-32">옵션 현황</th>
                                <th className="p-4 text-[13px] font-black text-gray-400 w-48 text-center" colSpan={2}>랭킹 순위 이력</th>
                            </tr>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th colSpan={3}></th>
                                <th className="p-2 text-[12px] font-bold text-gray-400 text-center border-l border-gray-100">1분 전 대비</th>
                                <th className="p-2 text-[12px] font-bold text-gray-400 text-center border-l border-gray-100">5분 전 대비</th>
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
                                    <td className="p-4 text-center border-l border-gray-100">
                                        {getRankChange(item.currentRank, item.prevRank)}
                                    </td>
                                    <td className="p-4 text-center border-l border-gray-100">
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
