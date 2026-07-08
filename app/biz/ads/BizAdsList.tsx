'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Pause, Play, Pencil, Clock, CreditCard } from 'lucide-react';
import { BizAdPaymentModal } from '@/components/biz/BizAdPaymentModal';

const TierBadge = ({ tier }: { tier: string }) => {
    const styles: Record<string, string> = {
        PREMIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        SIDE: 'bg-blue-100 text-blue-800 border-blue-200',
        SPECIAL: 'bg-purple-100 text-purple-800 border-purple-200',
        GENERAL: 'bg-gray-100 text-gray-600 border-gray-200',
        AD_GENERAL: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    const labels: Record<string, string> = {
        PREMIUM: '🔥 프리미엄',
        SIDE: '🚀 사이드',
        SPECIAL: '⚡ 스페셜',
        GENERAL: '일반',
        AD_GENERAL: '배너(일반)',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black border ${styles[tier] || styles.GENERAL}`}>
            {labels[tier] || tier || '일반'}
        </span>
    );
};

const StatusBadge = ({ ad, isVerified }: { ad: any, isVerified: boolean }) => {
    const isPending = new Date(ad.expires_at).getFullYear() === 2000;
    const isExpired = new Date(ad.expires_at) < new Date() && !isPending;
    
    // claim_code가 있다면 업체 광고 수락 대기 상태 (수락 대기중)
    const hasClaimCode = !!ad.claim_code;
    
    // 사업자 검증이 안 되었으면서 결제 대기 상태인 경우
    let status = (isPending || isExpired) && !isVerified ? 'UNVERIFIED' : isPending ? 'PENDING' : isExpired ? 'EXPIRED' : 'ACTIVE';

    if (hasClaimCode) {
        status = 'CLAIM_PENDING';
    }

    const styles: Record<string, string> = {
        ACTIVE: 'bg-green-100 text-green-700',
        PAUSED: 'bg-gray-100 text-gray-500',
        EXPIRED: 'bg-red-100 text-red-600',
        PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
        UNVERIFIED: 'bg-red-50 text-red-600 border border-red-200',
        CLAIM_PENDING: 'bg-purple-100 text-purple-700 border border-purple-300',
    };
    const labels: Record<string, string> = {
        ACTIVE: '진행 중',
        PAUSED: '일시정지',
        EXPIRED: '노출 종료',
        PENDING: '결제 대기중',
        UNVERIFIED: '사업자 검증 중',
        CLAIM_PENDING: '수락 대기중',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${styles[status] || ''}`}>
            {status === 'ACTIVE' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
            {status === 'CLAIM_PENDING' && <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />}
            {labels[status] || status}
        </span>
    );
};

export default function BizAdsList({ initialAds, isVerified, isAgent }: { initialAds: any[], isVerified?: boolean, isAgent?: boolean }) {
    const router = useRouter();
    const [ads, setAds] = useState(initialAds);
    const [paymentAd, setPaymentAd] = useState<any | null>(null);

    const handlePaymentSuccess = () => {
        setPaymentAd(null);
        // 결제 성공 시 페이지 새로고침하여 최신 상태 반영
        window.location.reload();
    };

    return (
        <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50 whitespace-nowrap">
                            <th className="text-left px-6 py-4 text-[12px] font-black text-gray-500">광고명</th>
                            <th className="text-center px-4 py-4 text-[12px] font-black text-gray-500">등급</th>
                            <th className="text-center px-4 py-4 text-[12px] font-black text-gray-500">상태</th>
                            <th className="text-center px-4 py-4 text-[12px] font-black text-gray-500">만료일</th>
                            <th className="text-center px-6 py-4 text-[12px] font-black text-gray-500">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ads.map((ad: any) => {
                            const expiresMs = ad.expires_at ? new Date(ad.expires_at).getTime() : 0;
                            const isInvalidOrPending = !ad.expires_at || isNaN(expiresMs) || new Date(ad.expires_at).getFullYear() === 2000;
                            const isExpired = !isInvalidOrPending && (expiresMs < Date.now());
                            const isPendingOrExpired = isInvalidOrPending || isExpired;
                            
                            return (
                                <tr 
                                    key={ad.id} 
                                    onClick={() => router.push(`/biz/ads/${ad.id}/edit`)}
                                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {(ad.logo_url || ad.image) && (
                                                <img src={ad.logo_url || ad.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                            )}
                                            <div className="max-w-[150px] sm:max-w-[250px]">
                                                {/* @ts-ignore */}
                                                <marquee scrollamount="3" className="font-bold text-[14px] text-gray-900 block">{ad.title}</marquee>
                                                <p className="text-[12px] text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">{ad.company} · {ad.location}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                        <TierBadge tier={ad.tier} />
                                    </td>
                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                        <StatusBadge ad={ad} isVerified={!!isVerified} />
                                    </td>
                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                        <span className="flex items-center justify-center gap-1 text-[13px] font-medium text-gray-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            {ad.expires_at && new Date(ad.expires_at).getFullYear() !== 2000 
                                                ? new Date(ad.expires_at).toLocaleDateString() 
                                                : ad.claim_code 
                                                    ? '수락 대기' 
                                                    : '결제 대기'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-2">
                                            {isPendingOrExpired ? (
                                                <button 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        const canPay = isVerified || isAgent || !!ad.claim_code;
                                                        if (!canPay) {
                                                            alert("사업자 정보 검증이 완료된 업체만 결제 및 광고 노출이 가능합니다.\n진행 중인 검증이 끝날 때까지 잠시만 기다려주세요.");
                                                            return;
                                                        }
                                                        setPaymentAd(ad); 
                                                    }}
                                                    className={`text-[11px] font-black px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors ${
                                                        !(isVerified || isAgent || !!ad.claim_code)
                                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                                            : 'bg-gray-900 text-white hover:bg-black'
                                                    }`}
                                                >
                                                    <CreditCard className="w-3 h-3" /> 결제 및 노출
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        setPaymentAd({ ...ad, isPaid: true }); 
                                                    }}
                                                    className="text-[11px] font-black px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                                                >
                                                    <CreditCard className="w-3 h-3" /> 결제 옵션 확인
                                                </button>
                                            )}
                                            <div className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="수정">
                                                <Pencil className="w-4 h-4 text-gray-500" />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {paymentAd && (
                <BizAdPaymentModal 
                    initialData={paymentAd} 
                    jobId={paymentAd.id} 
                    onClose={() => setPaymentAd(null)} 
                    onSuccess={handlePaymentSuccess} 
                />
            )}
        </>
    );
}
