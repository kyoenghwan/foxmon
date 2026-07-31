'use client';

import React, { useEffect, useState } from 'react';
import { Crown, ArrowUp, ArrowDown, ArrowUpDown, Minus, RefreshCw, Timer, Pencil, Trash2, Edit3, Search, Sparkles, Filter, RotateCcw, AlertTriangle, Trash, Settings, X, Save, Clock, Zap, LayersIcon, Bold } from 'lucide-react';
import { getAdRankingSimulation, RankingSimResult, getAdHistoryLogs, AdHistoryLog } from '@/lib/ad-ranking-service';
import { AdminAdEditModal } from '@/components/admin/AdminAdEditModal';
import { AdminFullAdEditorModal } from '@/components/admin/AdminFullAdEditorModal';
import { 
    adminSoftDeleteAdAction, 
    adminHardDeleteAdAction, 
    adminRestoreAdAction, 
    adminPurgeOldDeletedAdsAction,
    adminChangeAdRankAction,
    adminUpdateAdOptionsAction
} from '@/lib/actions/admin-ad-actions';
import { QA_GET_ALL_BIZ_ADS } from '@/src/atoms/qa/admin/QA_GET_ALL_BIZ_ADS';

const TIER_LABELS: Record<string, string> = {
    ALL: '전체',
    PREMIUM_MAIN: '메인',
    SIDE: '사이드',
    PREMIUM: '프리미엄',
    SPECIAL: '스페셜',
    AD_GENERAL: '일반 배너',
    GENERAL: '구인글'
};

export default function AdRankingsPage() {
    const [activeTab, setActiveTab] = useState<'monitoring' | 'history' | 'manage' | 'trash'>('monitoring');
    const [tier, setTier] = useState<any>('PREMIUM_MAIN');
    const [rankings, setRankings] = useState<RankingSimResult[]>([]);
    const [allAds, setAllAds] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(60);

    const [historyLogs, setHistoryLogs] = useState<AdHistoryLog[]>([]);
    const [editingAd, setEditingAd] = useState<any | null>(null);
    const [fullEditingAd, setFullEditingAd] = useState<any | null>(null);
    const [optionEditingAd, setOptionEditingAd] = useState<any | null>(null);
    const [optionForm, setOptionForm] = useState<any>({});
    const [savingOptions, setSavingOptions] = useState(false);

    // 1차 소프트 삭제 (휴지통 이동)
    const handleSoftDelete = async (ad: any) => {
        if (!confirm(`'${ad.title}' 광고를 휴지통으로 이동하시겠습니까?`)) return;
        const isJob = ad.is_job || ad.tier === 'GENERAL';
        const cleanId = ad.id.replace('_dup', '');
        const res = await adminSoftDeleteAdAction(cleanId, isJob);
        if (res.success) {
            // 즉시 UI 반영: 해당 항목 status를 DELETED로 변경
            setAllAds(prev => prev.map(a => a.id === cleanId ? { ...a, status: 'DELETED' } : a));
        } else {
            alert(res.message || '1차 삭제 실패');
        }
    };

    // 2차 영구 완전 삭제
    const handleHardDelete = async (ad: any) => {
        if (!confirm(`'${ad.title}' 광고를 DB에서 영구히 완전 삭제하시겠습니까? (삭제 후 절대 복구 불가)`)) return;
        const isJob = ad.is_job || ad.tier === 'GENERAL';
        const cleanId = ad.id.replace('_dup', '');
        const res = await adminHardDeleteAdAction(cleanId, isJob);
        if (res.success) {
            // 즉시 UI 반영: 해당 항목을 목록에서 완전 제거
            setAllAds(prev => prev.filter(a => a.id !== cleanId));
        } else {
            alert(res.message || '영구 삭제 실패');
        }
    };

    // 복구
    const handleRestore = async (ad: any) => {
        if (!confirm(`'${ad.title}' 광고를 다시 정상 노출(ACTIVE) 상태로 복구하시겠습니까?`)) return;
        const isJob = ad.is_job || ad.tier === 'GENERAL';
        const cleanId = ad.id.replace('_dup', '');
        const res = await adminRestoreAdAction(cleanId, isJob);
        if (res.success) {
            // 즉시 UI 반영: 해당 항목 status를 ACTIVE로 변경
            setAllAds(prev => prev.map(a => a.id === cleanId ? { ...a, status: 'ACTIVE' } : a));
        } else {
            alert(res.message || '복구 실패');
        }
    };

    // 순위 변경 핸들러
    const handleChangeRank = async (ad: any, currentRank: number) => {
        const input = prompt(`'${ad.title}' 광고의 이동할 목표 순위를 입력하세요 (현재 ${currentRank}위):`, String(currentRank));
        if (!input) return;
        const targetRank = parseInt(input.trim(), 10);
        if (isNaN(targetRank) || targetRank <= 0) {
            alert('올바른 순위 숫자(1 이상)를 입력해 주세요.');
            return;
        }

        const isJob = ad.is_job || ad.tier === 'GENERAL';
        const res = await adminChangeAdRankAction(ad.id.replace('_dup', ''), targetRank, isJob);
        if (res.success) {
            alert(res.message);
            loadRankings();
        } else {
            alert(res.message || '순위 변경 실패');
        }
    };

    // 30일 경과 항목 일괄 영구 삭제
    const handlePurgeOld = async () => {
        if (!confirm('1차 삭제 후 30일이 넘게 경과된 항목을 일괄 영구 완전 삭제하시겠습니까?')) return;
        const res = await adminPurgeOldDeletedAdsAction();
        alert(res.message);
        loadRankings();
    };

    const loadRankings = async (currentTab = activeTab, currentTier = tier) => {
        setLoading(true);
        try {
            const queryTier = currentTier === 'ALL' ? 'PREMIUM_MAIN' : currentTier;
            if (currentTab === 'monitoring') {
                const data = await getAdRankingSimulation(queryTier);
                setRankings(data);
            } else if (currentTab === 'history') {
                // 광고 목록 + 변경 이력 동시 로드
                const [res, logs] = await Promise.all([
                    QA_GET_ALL_BIZ_ADS(),
                    getAdHistoryLogs(queryTier)
                ]);
                if (res.success && res.data) setAllAds(res.data);
                else setAllAds([]);
                setHistoryLogs(logs);
            } else if (currentTab === 'manage' || currentTab === 'trash') {
                const res = await QA_GET_ALL_BIZ_ADS();
                if (res.success && res.data) {
                    setAllAds(res.data);
                } else {
                    console.error('QA_GET_ALL_BIZ_ADS 실패:', res.error);
                    setAllAds([]);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRankings(activeTab, tier);
        if (activeTab === 'history') return;

        setTimeLeft(60);
        const timerId = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    loadRankings(activeTab, tier);
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);
        
        return () => clearInterval(timerId);
    }, [tier, activeTab]);

    const getRankChange = (current: number, prev: number | null) => {
        if (prev === null) return <span className="text-[11px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mx-auto">NEW 진입</span>;
        
        const diff = prev - current; // prev가 12고 current가 10이면 +2 (상승)
        
        if (diff > 5) return <span className="text-[11px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mx-auto"><ArrowUp className="w-3 h-3" /> {diff} JUMP!</span>;
        if (diff > 0) return <span className="text-[12px] font-bold text-red-500 flex items-center gap-0.5 justify-center"><ArrowUp className="w-3 h-3" /> {diff}</span>;
        if (diff < 0) return <span className="text-[12px] font-bold text-blue-500 flex items-center gap-0.5 justify-center"><ArrowDown className="w-3 h-3" /> {Math.abs(diff)}</span>;
        return <span className="text-[12px] font-bold text-gray-400 flex items-center gap-0.5 justify-center"><Minus className="w-3 h-3" /> 유지</span>;
    };

    return (
        <div className="w-full max-w-[1200px] mx-auto p-4 sm:p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Crown className="w-7 h-7 text-yellow-500" />
                    광고/배너 관리
                </h1>
                <p className="text-sm text-gray-500">플랫폼 내 노출 중인 배너들의 순위와 변경 내역을 통합 관리합니다.</p>
            </div>

            {/* Sub Navigation Tabs */}
            <div className="flex gap-1 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('monitoring')}
                    className={`px-6 py-3 text-[14px] font-bold border-b-2 transition-colors ${
                        activeTab === 'monitoring' 
                            ? 'border-gray-900 text-gray-900' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    노출 순위 모니터링
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 text-[14px] font-bold border-b-2 transition-colors ${
                        activeTab === 'history' 
                            ? 'border-gray-900 text-gray-900' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    옵션/변경 내역
                </button>
                <button
                    onClick={() => setActiveTab('manage')}
                    className={`px-6 py-3 text-[14px] font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                        activeTab === 'manage' 
                            ? 'border-primary text-primary bg-orange-50/40' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    <Edit3 className="w-4 h-4 text-primary" />
                    광고/공고 관리
                </button>
                <button
                    onClick={() => setActiveTab('trash')}
                    className={`px-6 py-3 text-[14px] font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                        activeTab === 'trash' 
                            ? 'border-red-600 text-red-600 bg-red-50/40' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    <Trash className="w-4 h-4 text-red-600" />
                    휴지통 (1차 삭제 목록)
                </button>
            </div>

            {/* Common Header / Tier Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
                <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            {activeTab === 'monitoring' ? '노출 순위 현황' : activeTab === 'history' ? '옵션/변경 내역' : '광고/공고 관리'}
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {['PREMIUM_MAIN', 'SIDE', 'PREMIUM', 'SPECIAL', 'AD_GENERAL', 'GENERAL'].map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setTier(t)}
                                    className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-colors ${tier === t ? 'bg-gray-900 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {TIER_LABELS[t]}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                        {activeTab === 'monitoring' && (
                        <div className="flex items-center gap-1.5 text-[13px] font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                            <Timer className="w-4 h-4 text-primary" />
                            다음 순위 갱신까지 <span className="text-primary tabular-nums min-w-[2ch] text-right">{timeLeft}</span>초
                        </div>
                        )}
                        <button onClick={() => { setTimeLeft(60); loadRankings(); }} disabled={loading} className="flex items-center gap-1.5 text-[12px] font-bold text-gray-400 hover:text-gray-900 transition-colors">
                            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                            즉시 갱신
                        </button>
                    </div>
                </div>

            {activeTab === 'monitoring' ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b-2 border-gray-100">
                                <th className="p-4 text-[13px] font-black text-gray-400 w-24 text-center">노출 순위</th>
                                <th className="p-4 text-[13px] font-black text-gray-400">광고 정보</th>
                                <th className="p-4 text-[13px] font-black text-gray-400 w-32">옵션 현황</th>
                                <th className="p-4 text-[13px] font-black text-gray-400 w-48 text-center" colSpan={2}>노출 순위 이력</th>
                                <th className="p-4 text-[13px] font-black text-gray-400 w-28 text-center">관리 조작</th>
                            </tr>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th colSpan={3}></th>
                                <th className="p-2 text-[12px] font-bold text-gray-400 text-center border-l border-gray-100">1분 전 대비</th>
                                <th className="p-2 text-[12px] font-bold text-gray-400 text-center border-l border-gray-100">5분 전 대비</th>
                                <th className="border-l border-gray-100"></th>
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
                                                <div className="font-bold text-[14px] text-gray-900 line-clamp-1 flex items-center gap-1.5">
                                                    {!item.ad.isRealAd && <span className="text-[10px] font-black bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-sm whitespace-nowrap">가상 배너</span>}
                                                    {item.ad.title}
                                                </div>
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
                                    <td className="p-4 text-center border-l border-gray-100">
                                        <div className="flex items-center justify-center">
                                            <button
                                                onClick={() => handleChangeRank(item.ad, item.currentRank)}
                                                className="px-2.5 py-1.5 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 text-[11px] font-bold flex items-center gap-1"
                                                title="노출 순위 변경"
                                            >
                                                <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" />
                                                순위 변경
                                            </button>
                                        </div>
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
            ) : activeTab === 'history' ? (() => {
                // ad_id → 최근 변경 이력 맵
                const logMap = new Map<string, AdHistoryLog[]>();
                historyLogs.forEach(log => {
                    if (!logMap.has(log.ad_id)) logMap.set(log.ad_id, []);
                    logMap.get(log.ad_id)!.push(log);
                });

                const filteredAds = allAds.filter(ad => {
                    if (ad.status === 'DELETED') return false;
                    if (tier !== 'ALL') {
                        const itemTier = (ad.tier || '').toUpperCase();
                        const targetTier = tier.toUpperCase();
                        if (targetTier === 'AD_GENERAL') {
                            if (itemTier !== 'AD_GENERAL' && (ad.is_job || itemTier !== 'GENERAL')) return false;
                        } else if (targetTier === 'GENERAL') {
                            if (!ad.is_job && itemTier !== 'GENERAL') return false;
                        } else {
                            if (itemTier !== targetTier) return false;
                        }
                    }
                    return true;
                });

                return (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b-2 border-gray-100 bg-gray-50/50">
                                    <th className="p-4 text-[12px] font-black text-gray-400">광고/공고 제목</th>
                                    <th className="p-4 text-[12px] font-black text-gray-400 w-28 text-center">티어</th>
                                    <th className="p-4 text-[12px] font-black text-gray-400 w-28 text-center">만료일</th>
                                    <th className="p-4 text-[12px] font-black text-gray-400 w-48 text-center">현재 옵션</th>
                                    <th className="p-4 text-[12px] font-black text-gray-400 w-36 text-center">변경 이력</th>
                                    <th className="p-4 text-[12px] font-black text-gray-400 w-24 text-center">옵션 수정</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAds.map(ad => {
                                    const logs = logMap.get(ad.id) || [];
                                    const hasLogs = logs.length > 0;
                                    const latestLog = logs[0];
                                    return (
                                        <tr key={ad.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-[13px] text-gray-900 line-clamp-1">{ad.title || '제목 없음'}</div>
                                                <div className="text-[11px] text-gray-400 mt-0.5">{ad.company_name || ad.company}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="text-[11px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                                    {ad.tier || 'GENERAL'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-[12px] text-gray-500 font-mono">
                                                {ad.expires_at ? new Date(ad.expires_at).toLocaleDateString('ko-KR') : '-'}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {ad.option_double_slot && <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">더블슬롯</span>}
                                                    {ad.option_jump && <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">오토점프</span>}
                                                    {ad.option_bold && <span className="text-[10px] font-bold bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded">볼드</span>}
                                                    {ad.option_highlight && <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">하이라이트</span>}
                                                    {!ad.option_double_slot && !ad.option_jump && !ad.option_bold && !ad.option_highlight && <span className="text-[11px] text-gray-400">-</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                {hasLogs ? (
                                                    <div>
                                                        <span className="text-[10px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                                                            최근 {logs.length}건
                                                        </span>
                                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                                            {new Date(latestLog.created_at).toLocaleDateString('ko-KR')}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-gray-300">없음</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setOptionEditingAd(ad);
                                                        setOptionForm({
                                                            status: ad.status || 'ACTIVE',
                                                            expires_at: ad.expires_at ? ad.expires_at.slice(0, 10) : '',
                                                            option_jump: !!ad.option_jump,
                                                            option_jump_expires_at: ad.option_jump_expires_at ? ad.option_jump_expires_at.slice(0, 10) : '',
                                                            jump_interval: ad.jump_interval || 30,
                                                            option_double_slot: !!ad.option_double_slot,
                                                            option_double_slot_expires_at: ad.option_double_slot_expires_at ? ad.option_double_slot_expires_at.slice(0, 10) : '',
                                                            option_bold: !!ad.option_bold,
                                                            option_bold_expires_at: ad.option_bold_expires_at ? ad.option_bold_expires_at.slice(0, 10) : '',
                                                            option_highlight: !!ad.option_highlight,
                                                            option_highlight_value: ad.option_highlight_value || '',
                                                            option_highlight_expires_at: ad.option_highlight_expires_at ? ad.option_highlight_expires_at.slice(0, 10) : '',
                                                        });
                                                    }}
                                                    className="p-2 bg-violet-50 text-violet-600 hover:bg-violet-100 rounded-lg transition-colors"
                                                    title="옵션 수정"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredAds.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500 text-[14px]">
                                            해당 조건의 광고/공고가 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                );
            })() : (

                <div className="space-y-4">
                    {/* 검색 및 상태 필터 바 */}
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="공고 제목, 업체명, 주소 검색..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg outline-hidden"
                            >
                                <option value="ALL">전체 상태</option>
                                <option value="ACTIVE">ACTIVE (노출중)</option>
                                <option value="PAUSED">PAUSED (중지)</option>
                                <option value="EXPIRED">EXPIRED (만료)</option>
                            </select>
                            <button
                                onClick={loadRankings}
                                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> 새로고침
                            </button>
                        </div>
                    </div>

                    {/* 전체 공고 목록 테이블 */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b-2 border-gray-100 bg-gray-50/50">
                                    <th className="p-4 text-[12px] font-black text-gray-400">광고/공고 제목</th>
                                    <th className="p-4 text-[12px] font-black text-gray-400 w-36">업체 정보</th>
                                    <th className="p-4 text-[12px] font-black text-gray-400 w-28 text-center">광고 티어</th>
                                    <th className="p-4 text-[12px] font-black text-gray-400 w-28 text-center">노출 상태</th>
                                    <th className="p-4 text-[12px] font-black text-gray-400 w-36 text-center">만료 일시</th>
                                    <th className="p-4 text-[12px] font-black text-gray-400 w-52 text-center">원클릭 직접 관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allAds
                                    .filter((ad) => {
                                        if (ad.status === 'DELETED') return false; // manage 탭에서는 1차 삭제된 항목 제외
                                        if (tier !== 'ALL') {
                                            if (tier === 'AD_GENERAL') {
                                                if (ad.tier !== 'AD_GENERAL' && (ad.is_job || ad.tier !== 'GENERAL')) return false;
                                            } else if (tier === 'GENERAL') {
                                                if (!ad.is_job && ad.tier !== 'GENERAL') return false;
                                            } else {
                                                if ((ad.tier || '').toUpperCase() !== tier.toUpperCase()) return false;
                                            }
                                        }
                                        if (statusFilter !== 'ALL' && ad.status !== statusFilter) return false;
                                        if (searchQuery) {
                                            const q = searchQuery.toLowerCase();
                                            const t = (ad.title || '').toLowerCase();
                                            const c = (ad.company_name || ad.company || '').toLowerCase();
                                            return t.includes(q) || c.includes(q);
                                        }
                                        return true;
                                    })
                                    .map((ad) => (
                                        <tr key={ad.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-[14px] text-gray-900 line-clamp-1">{ad.title}</div>
                                                <div className="text-[12px] text-gray-500 mt-0.5">{ad.pay || (ad.salary_type ? `[${ad.salary_type}] ${ad.salary_amount}` : '')}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-[13px] text-gray-900">{ad.company_name || ad.company}</div>
                                                <div className="text-[11px] text-gray-400">{ad.location}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="text-[11px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                                    {ad.tier || 'GENERAL'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`text-[11px] font-black px-2 py-0.5 rounded ${
                                                    ad.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                    ad.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {ad.status || 'ACTIVE'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-[12px] text-gray-500 font-mono">
                                                {ad.expires_at ? new Date(ad.expires_at).toLocaleDateString('ko-KR') : '-'}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => setFullEditingAd(ad)}
                                                        className="p-2 bg-gradient-to-r from-primary to-orange-600 text-white hover:opacity-90 rounded-lg transition-all shadow-xs flex items-center justify-center"
                                                        title="사용자가 입력한 전체 폼(본문/디자인/옵션) 그대로 수정"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />

                                                    </button>
                                                    <button
                                                        onClick={() => setEditingAd(ad)}
                                                        className="p-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-[11px] font-bold transition-colors"
                                                        title="빠른 정보 수정"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleSoftDelete(ad)}
                                                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center"
                                                        title="1차 삭제 (휴지통으로 이동)"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />

                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                {allAds.filter((ad) => {
                                    if (ad.status === 'DELETED') return false;
                                    if (tier !== 'ALL') {
                                        if (tier === 'AD_GENERAL') {
                                            if (ad.tier !== 'AD_GENERAL' && (ad.is_job || ad.tier !== 'GENERAL')) return false;
                                        } else if (tier === 'GENERAL') {
                                            if (!ad.is_job && ad.tier !== 'GENERAL') return false;
                                        } else {
                                            if ((ad.tier || '').toUpperCase() !== tier.toUpperCase()) return false;
                                        }
                                    }
                                    if (statusFilter !== 'ALL' && ad.status !== statusFilter) return false;
                                    if (searchQuery) {
                                        const q = searchQuery.toLowerCase();
                                        const t = (ad.title || '').toLowerCase();
                                        const c = (ad.company_name || ad.company || '').toLowerCase();
                                        return t.includes(q) || c.includes(q);
                                    }
                                    return true;
                                }).length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-400 font-bold text-xs">
                                            해당 티어 및 조건에 해당하는 광고/공고가 존재하지 않습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 4th Tab: Trash (1차 삭제 목록 및 2차 영구 삭제 관리) */}
            {activeTab === 'trash' && (
                <div className="space-y-4">
                    <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-red-900">1차 삭제 (휴지통) 보관소</h4>
                                <p className="text-xs text-red-700 mt-0.5">
                                    여기 있는 항목은 1차 삭제되어 일반 사용자 화면에 노출되지 않으며, <strong>삭제 후 30일이 지나면 자동 영구 삭제</strong> 처리됩니다.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handlePurgeOld}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                        >
                            <Trash2 className="w-4 h-4" />
                            30일 지난 항목 일괄 영구 삭제
                        </button>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-gray-100 bg-gray-50/50">
                                    <th className="p-4 text-[12px] font-black text-gray-400">삭제된 광고/공고 제목</th>
                                    <th className="p-4 text-[12px] font-black text-gray-400 w-36">업체 정보</th>
                                    <th className="p-4 text-[12px] font-black text-gray-400 w-28 text-center">티어</th>
                                    <th className="p-4 text-[12px] font-black text-gray-400 w-36 text-center">1차 삭제 일시</th>
                                    <th className="p-4 text-[12px] font-black text-gray-400 w-36 text-center">영구 삭제 예정일</th>
                                    <th className="p-4 text-[12px] font-black text-gray-400 w-44 text-center">수동 영구/복구 관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allAds
                                    .filter((ad) => {
                                        if (ad.status !== 'DELETED') return false;
                                        if (tier !== 'ALL') {
                                            if (tier === 'GENERAL') {
                                                if (!ad.is_job && ad.tier !== 'GENERAL') return false;
                                            } else {
                                                if (ad.tier !== tier) return false;
                                            }
                                        }
                                        if (searchQuery) {
                                            const q = searchQuery.toLowerCase();
                                            const t = (ad.title || '').toLowerCase();
                                            const c = (ad.company_name || ad.company || '').toLowerCase();
                                            return t.includes(q) || c.includes(q);
                                        }
                                        return true;
                                    })
                                    .map((ad) => {
                                        const deletedDate = ad.updated_at ? new Date(ad.updated_at) : new Date();
                                        const autoPurgeDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                                        return (
                                            <tr key={ad.id} className="border-b border-gray-50 hover:bg-red-50/30 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-[14px] text-gray-800 line-through line-clamp-1">{ad.title}</div>
                                                    <div className="text-[11px] text-red-500 font-bold mt-0.5">[1차 삭제됨 (휴지통)]</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-[13px] text-gray-900">{ad.company_name || ad.company}</div>
                                                    <div className="text-[11px] text-gray-400">{ad.location}</div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="text-[11px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                                        {ad.tier || 'GENERAL'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center text-[12px] text-gray-500 font-mono">
                                                    {deletedDate.toLocaleDateString('ko-KR')}
                                                </td>
                                                <td className="p-4 text-center text-[12px] text-red-600 font-mono font-bold">
                                                    {autoPurgeDate.toLocaleDateString('ko-KR')}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => handleRestore(ad)}
                                                            className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                                                            title="정상 노출(ACTIVE) 상태로 복구"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                            복구
                                                        </button>
                                                        <button
                                                            onClick={() => handleHardDelete(ad)}
                                                            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                                                            title="2차 영구 완전 삭제 (DB 삭제)"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            영구 삭제
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                {allAds.filter((ad) => {
                                    if (ad.status !== 'DELETED') return false;
                                    if (tier !== 'ALL') {
                                        if (tier === 'GENERAL') {
                                            if (!ad.is_job && ad.tier !== 'GENERAL') return false;
                                        } else {
                                            if (ad.tier !== tier) return false;
                                        }
                                    }
                                    if (searchQuery) {
                                        const q = searchQuery.toLowerCase();
                                        const t = (ad.title || '').toLowerCase();
                                        const c = (ad.company_name || ad.company || '').toLowerCase();
                                        return t.includes(q) || c.includes(q);
                                    }
                                    return true;
                                }).length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-400 font-bold text-xs">
                                            휴지통에 보관된 1차 삭제 항목이 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            </div>

            {editingAd && (
                <AdminAdEditModal
                    ad={editingAd}
                    onClose={() => setEditingAd(null)}
                    onSuccess={() => loadRankings()}
                />
            )}

            {fullEditingAd && (
                <AdminFullAdEditorModal
                    ad={fullEditingAd}
                    onClose={() => setFullEditingAd(null)}
                    onSuccess={() => loadRankings()}
                />
            )}

            {/* 옵션 직접 수정 모달 */}
            {optionEditingAd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <div>
                                <h3 className="text-[16px] font-black text-gray-900">옵션 직접 수정</h3>
                                <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-1">{optionEditingAd.title}</p>
                            </div>
                            <button onClick={() => setOptionEditingAd(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* 기본 정보 */}
                            <div className="space-y-3">
                                <h4 className="text-[13px] font-black text-gray-700 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-500" /> 기본 설정
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold text-gray-500 block mb-1">상태</label>
                                        <select
                                            value={optionForm.status}
                                            onChange={e => setOptionForm((f: any) => ({ ...f, status: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
                                        >
                                            <option value="ACTIVE">ACTIVE (노출)</option>
                                            <option value="PAUSED">PAUSED (일시정지)</option>
                                            <option value="EXPIRED">EXPIRED (만료)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-gray-500 block mb-1">광고 만료일</label>
                                        <input
                                            type="date"
                                            value={optionForm.expires_at}
                                            onChange={e => setOptionForm((f: any) => ({ ...f, expires_at: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 오토 점프 */}
                            <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[13px] font-black text-blue-700 flex items-center gap-2">
                                        <Zap className="w-4 h-4" /> 오토 점프
                                    </h4>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={optionForm.option_jump}
                                            onChange={e => setOptionForm((f: any) => ({ ...f, option_jump: e.target.checked }))}
                                            className="w-4 h-4 accent-blue-500"
                                        />
                                        <span className="text-[12px] font-bold text-blue-600">{optionForm.option_jump ? 'ON' : 'OFF'}</span>
                                    </label>
                                </div>
                                {optionForm.option_jump && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-500 block mb-1">점프 만료일</label>
                                            <input
                                                type="date"
                                                value={optionForm.option_jump_expires_at}
                                                onChange={e => setOptionForm((f: any) => ({ ...f, option_jump_expires_at: e.target.value }))}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-500 block mb-1">점프 간격 (분)</label>
                                            <input
                                                type="number"
                                                min="5"
                                                max="1440"
                                                value={optionForm.jump_interval}
                                                onChange={e => setOptionForm((f: any) => ({ ...f, jump_interval: parseInt(e.target.value) || 30 }))}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 더블 슬롯 */}
                            <div className="space-y-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[13px] font-black text-indigo-700 flex items-center gap-2">
                                        <LayersIcon className="w-4 h-4" /> 더블 슬롯
                                    </h4>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={optionForm.option_double_slot}
                                            onChange={e => setOptionForm((f: any) => ({ ...f, option_double_slot: e.target.checked }))}
                                            className="w-4 h-4 accent-indigo-500"
                                        />
                                        <span className="text-[12px] font-bold text-indigo-600">{optionForm.option_double_slot ? 'ON' : 'OFF'}</span>
                                    </label>
                                </div>
                                {optionForm.option_double_slot && (
                                    <div>
                                        <label className="text-[11px] font-bold text-gray-500 block mb-1">더블 슬롯 만료일</label>
                                        <input
                                            type="date"
                                            value={optionForm.option_double_slot_expires_at}
                                            onChange={e => setOptionForm((f: any) => ({ ...f, option_double_slot_expires_at: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* 볼드 */}
                            <div className="space-y-3 bg-yellow-50/50 p-4 rounded-xl border border-yellow-100">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[13px] font-black text-yellow-700 flex items-center gap-2">
                                        <Bold className="w-4 h-4" /> 볼드 강조
                                    </h4>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={optionForm.option_bold}
                                            onChange={e => setOptionForm((f: any) => ({ ...f, option_bold: e.target.checked }))}
                                            className="w-4 h-4 accent-yellow-500"
                                        />
                                        <span className="text-[12px] font-bold text-yellow-700">{optionForm.option_bold ? 'ON' : 'OFF'}</span>
                                    </label>
                                </div>
                                {optionForm.option_bold && (
                                    <div>
                                        <label className="text-[11px] font-bold text-gray-500 block mb-1">볼드 만료일</label>
                                        <input
                                            type="date"
                                            value={optionForm.option_bold_expires_at}
                                            onChange={e => setOptionForm((f: any) => ({ ...f, option_bold_expires_at: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* 하이라이트 */}
                            <div className="space-y-3 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[13px] font-black text-orange-700 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" /> 하이라이트
                                    </h4>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={optionForm.option_highlight}
                                            onChange={e => setOptionForm((f: any) => ({ ...f, option_highlight: e.target.checked }))}
                                            className="w-4 h-4 accent-orange-500"
                                        />
                                        <span className="text-[12px] font-bold text-orange-600">{optionForm.option_highlight ? 'ON' : 'OFF'}</span>
                                    </label>
                                </div>
                                {optionForm.option_highlight && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-500 block mb-1">하이라이트 색상</label>
                                            <input
                                                type="text"
                                                placeholder="#FF6B00"
                                                value={optionForm.option_highlight_value}
                                                onChange={e => setOptionForm((f: any) => ({ ...f, option_highlight_value: e.target.value }))}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-500 block mb-1">하이라이트 만료일</label>
                                            <input
                                                type="date"
                                                value={optionForm.option_highlight_expires_at}
                                                onChange={e => setOptionForm((f: any) => ({ ...f, option_highlight_expires_at: e.target.value }))}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setOptionEditingAd(null)}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-[13px] font-bold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                disabled={savingOptions}
                                onClick={async () => {
                                    setSavingOptions(true);
                                    try {
                                        const isJob = optionEditingAd.is_job || optionEditingAd.tier === 'GENERAL';
                                        const payload: any = {
                                            status: optionForm.status,
                                            expires_at: optionForm.expires_at || null,
                                            option_jump: optionForm.option_jump,
                                            option_jump_expires_at: optionForm.option_jump ? (optionForm.option_jump_expires_at || null) : null,
                                            jump_interval: optionForm.jump_interval,
                                            option_double_slot: optionForm.option_double_slot,
                                            option_double_slot_expires_at: optionForm.option_double_slot ? (optionForm.option_double_slot_expires_at || null) : null,
                                            option_bold: optionForm.option_bold,
                                            option_bold_expires_at: optionForm.option_bold ? (optionForm.option_bold_expires_at || null) : null,
                                            option_highlight: optionForm.option_highlight,
                                            option_highlight_value: optionForm.option_highlight_value || null,
                                            option_highlight_expires_at: optionForm.option_highlight ? (optionForm.option_highlight_expires_at || null) : null,
                                        };
                                        const res = await adminUpdateAdOptionsAction(optionEditingAd.id, isJob, payload);
                                        if (res.success) {
                                            setOptionEditingAd(null);
                                            loadRankings(activeTab, tier);
                                        } else {
                                            alert(res.message);
                                        }
                                    } finally {
                                        setSavingOptions(false);
                                    }
                                }}
                                className="flex-1 py-2.5 bg-violet-600 text-white text-[13px] font-bold rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {savingOptions ? '저장 중...' : '저장'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
