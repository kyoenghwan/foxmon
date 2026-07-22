'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Clock, ExternalLink, CreditCard, RotateCcw, X, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { QA_GET_ALL_BIZ_ADS } from '@/src/atoms/qa/admin/QA_GET_ALL_BIZ_ADS';
import { adminCancelAdAction, estimateAdRefund, AdRefundEstimation } from '@/lib/actions/admin-cancel-ad';

type TabType = 'ALL' | 'PREMIUM_MAIN' | 'SIDE' | 'PREMIUM' | 'SPECIAL' | 'AD_GENERAL' | 'GENERAL';

export default function AdminJobsPage() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('ALL');
    
    // 모달 제어 상태
    const [selectedAd, setSelectedAd] = useState<any | null>(null);
    const [refundEst, setRefundEst] = useState<AdRefundEstimation | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);

    const loadJobs = async () => {
        setLoading(true);
        const res = await QA_GET_ALL_BIZ_ADS();
        if (res.success && res.data) {
            setJobs(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadJobs();
    }, []);

    // 탭별 필터링 데이터
    const filteredJobs = jobs.filter((job) => {
        if (activeTab === 'ALL') return true;
        return job.tier === activeTab;
    });

    const handleOpenCancelModal = async (job: any) => {
        setSelectedAd(job);
        const isPending = new Date(job.expires_at).getFullYear() === 2000;
        
        if (isPending) {
            setRefundEst({
                adId: job.id,
                title: job.title,
                company: job.company || job.company_name || '폭스몬',
                totalPoints: 0,
                totalDays: 0,
                usedDays: 0,
                remainingDays: 0,
                proratedAmount: 0,
                feeAmount: 0,
                refundPoints: 0
            });
        } else {
            const est = await estimateAdRefund(job);
            setRefundEst(est);
        }
    };

    const handleConfirmCancel = async () => {
        if (!selectedAd) return;
        setIsCancelling(true);
        try {
            const res = await adminCancelAdAction(selectedAd.id);
            if (res.success) {
                alert(res.message);
                setSelectedAd(null);
                setRefundEst(null);
                loadJobs(); // 목록 새로고침
            } else {
                alert(res.message || '오류가 발생했습니다.');
            }
        } catch (e: any) {
            alert('에러 발생: ' + e.message);
        } finally {
            setIsCancelling(false);
        }
    };

    // 탭 헤더 정의
    const tabs: { type: TabType; label: string }[] = [
        { type: 'ALL', label: '전체' },
        { type: 'PREMIUM_MAIN', label: '메인 배너' },
        { type: 'SIDE', label: '사이드 배너' },
        { type: 'PREMIUM', label: '프리미엄' },
        { type: 'AD_GENERAL', label: '일반 배너' },
        { type: 'GENERAL', label: '구인글' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" />
                        공고 승인/관리
                    </h2>
                    <p className="text-[13px] text-gray-500 font-medium mt-1">
                        업체가 등록한 모든 구인 광고 및 배너 리스트를 통합 관리하고, 취소 및 포인트 환불을 즉시 승인합니다.
                    </p>
                </div>
            </div>

            {/* 필터 탭 UI */}
            <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide whitespace-nowrap bg-white rounded-t-xl px-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.type}
                        onClick={() => setActiveTab(tab.type)}
                        className={`px-5 py-3.5 text-xs sm:text-sm font-black border-b-2 transition-all ${
                            activeTab === tab.type
                                ? 'text-primary border-primary bg-orange-50/20'
                                : 'text-gray-500 border-transparent hover:text-gray-950 hover:border-gray-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 메인 리스트 표 */}
            <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#f8f9fa] border-b border-gray-100 text-[12px] font-bold text-gray-600">
                            <tr>
                                <th className="p-4 w-12 text-center">No</th>
                                <th className="p-4">광고(공고) 정보</th>
                                <th className="p-4">작성 업체 (ID)</th>
                                <th className="p-4 text-center">광고 등급</th>
                                <th className="p-4 text-center">노출 만료일</th>
                                <th className="p-4 text-center">관리 액션</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-400 font-bold">
                                        공고 목록을 불러오는 중...
                                    </td>
                                </tr>
                            ) : filteredJobs.map((job: any, idx: number) => {
                                const isPending = new Date(job.expires_at).getFullYear() === 2000;
                                const isExpired = new Date(job.expires_at) < new Date() && !isPending;
                                const statusLabel = isPending ? '결제 대기' : isExpired ? '만료됨' : '진행 중';
                                const statusColor = isPending ? 'text-yellow-600 bg-yellow-50 border border-yellow-200' : isExpired ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50 border border-green-200';

                                return (
                                    <tr key={job.id} className="hover:bg-orange-50/30 transition-colors">
                                        <td className="p-4 text-center font-medium text-gray-500 text-[13px]">{idx + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {(job.logo_url || job.image) && (
                                                    <img src={job.logo_url || job.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                                                )}
                                                <div>
                                                    <Link href={`/jobs/${job.id}`} target="_blank" className="font-black text-gray-900 text-[14px] hover:text-primary flex items-center gap-1">
                                                        {job.title} <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                                                    </Link>
                                                    <div className="text-[12px] text-gray-500 font-medium">{job.company || job.company_name} · {job.location}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900 text-[13px]">{job.user?.verified_business_name || '미기재'}</div>
                                            <div className="text-[11px] text-gray-500 font-medium">ID: {job.user?.login_id || '알 수 없음'}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <Badge variant="outline" className="text-[11px] px-2.5 py-0.5 font-bold">{job.tier || '일반'}</Badge>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold ${statusColor}`}>
                                                {statusLabel}
                                            </div>
                                            {!isPending && (
                                                <div className="text-[11px] text-gray-400 mt-1">
                                                    {format(new Date(job.expires_at), 'yyyy-MM-dd')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* 결제 대기중이거나 노출 진행 중인 경우 취소 및 철회 가능 */}
                                                {!isExpired && (
                                                    <button 
                                                        onClick={() => handleOpenCancelModal(job)}
                                                        className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-[11px] font-black transition-colors flex items-center gap-1 border border-red-200"
                                                    >
                                                        <RotateCcw className="w-3 h-3" /> 광고 취소/철회
                                                    </button>
                                                )}
                                                {isExpired && (
                                                    <span className="text-[11px] text-gray-400 font-bold">액션 없음</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!loading && filteredJobs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-400 font-bold">
                                        선택한 카테고리에 등록된 광고(공고)가 존재하지 않습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 광고 취소/철회 확인 및 환불 계산서 모달 */}
            {selectedAd && refundEst && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
                        {/* 헤더 */}
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-red-50/50">
                            <div className="flex items-center gap-2">
                                <RotateCcw className="w-5 h-5 text-red-600" />
                                <h3 className="text-[16px] font-black text-gray-900">광고 철회 및 포인트 환불 심사</h3>
                            </div>
                            <button 
                                onClick={() => { setSelectedAd(null); setRefundEst(null); }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 본문 콘텐츠 */}
                        <div className="p-6 space-y-5 overflow-y-auto">
                            {/* 대상 광고 정보 */}
                            <div className="bg-gray-50 border border-gray-200/60 rounded-xl p-4 space-y-2">
                                <div className="text-[11px] text-gray-400 font-bold">대상 광고</div>
                                <div className="font-black text-gray-900 text-[15px]">{selectedAd.title}</div>
                                <div className="flex justify-between items-center text-xs text-gray-500 font-bold">
                                    <span>업체: {selectedAd.company || selectedAd.company_name}</span>
                                    <span>등급: {selectedAd.tier}</span>
                                </div>
                            </div>

                            {/* 환불 요약 및 계산식 */}
                            <div className="space-y-4">
                                <div className="text-xs font-black text-gray-800 flex items-center gap-1">
                                    <HelpCircle className="w-3.5 h-3.5 text-primary" /> 포인트 반환(환불) 명세서
                                </div>

                                {new Date(selectedAd.expires_at).getFullYear() === 2000 ? (
                                    /* 결제 대기 중인 경우 */
                                    <div className="p-4 bg-yellow-50 text-yellow-800 text-[13px] font-bold rounded-xl border border-yellow-200">
                                        이 광고는 현재 <strong>결제 대기</strong> 상태이므로, 취소 시 노출 중단 처리만 적용되며 반환(환불)될 포인트가 존재하지 않습니다.
                                    </div>
                                ) : (
                                    /* 결제 진행 중이었던 경우 */
                                    <div className="border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                                        {/* 항목들 */}
                                        <div className="divide-y divide-gray-50 bg-white text-xs font-bold text-gray-600">
                                            <div className="flex justify-between p-3">
                                                <span>원래 결제 포인트</span>
                                                <span className="text-gray-900 font-black">{refundEst.totalPoints.toLocaleString()} P</span>
                                            </div>
                                            <div className="flex justify-between p-3 bg-gray-50/50">
                                                <span>광고 노출 설정 기간</span>
                                                <span className="text-gray-900 font-black">{refundEst.totalDays}일</span>
                                            </div>
                                            <div className="flex justify-between p-3">
                                                <span>사용 일수 (경과일)</span>
                                                <span className="text-red-600 font-black">{refundEst.usedDays}일</span>
                                            </div>
                                            <div className="flex justify-between p-3 bg-gray-50/50">
                                                <span>남은 일수 (미사용)</span>
                                                <span className="text-green-600 font-black">{refundEst.remainingDays}일</span>
                                            </div>
                                            <div className="flex justify-between p-3">
                                                <span>일할 계산 금액 (미사용액)</span>
                                                <span className="text-gray-900 font-black">{refundEst.proratedAmount.toLocaleString()} P</span>
                                            </div>
                                            <div className="flex justify-between p-3 bg-gray-50/50 text-red-500">
                                                <span>취소 수수료 (잔여액의 10%)</span>
                                                <span className="font-black">- {refundEst.feeAmount.toLocaleString()} P</span>
                                            </div>
                                        </div>

                                        {/* 최종 환불액 */}
                                        <div className="bg-red-50 border-t border-red-100 p-4 flex justify-between items-center">
                                            <span className="text-xs font-black text-red-700">최종 반환 포인트</span>
                                            <span className="text-lg font-black text-red-600">{refundEst.refundPoints.toLocaleString()} P</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 환불 경고 안내문 */}
                            <div className="p-3.5 bg-red-50/45 text-[11px] text-red-500 rounded-xl border border-red-100 leading-relaxed font-bold">
                                ⚠️ 최종 승인 시, 복구된 포인트가 해당 업체 회원의 지갑으로 즉시 충전 적립되며 광고 노출은 메인 사이트에서 즉시 종료됩니다. 이 작업은 되돌릴 수 없습니다.
                            </div>
                        </div>

                        {/* 푸터 버튼 */}
                        <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50/50">
                            <button
                                onClick={() => { setSelectedAd(null); setRefundEst(null); }}
                                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-black transition-colors"
                            >
                                닫기
                            </button>
                            <button
                                disabled={isCancelling}
                                onClick={handleConfirmCancel}
                                className="flex-1 py-2.5 bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1"
                            >
                                {isCancelling ? '환불 승인 중...' : '최종 취소/환불 승인'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
