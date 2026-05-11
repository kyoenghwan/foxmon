'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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

const StatusBadge = ({ ad }: { ad: any }) => {
    const isPending = new Date(ad.expires_at).getFullYear() === 2000;
    const isExpired = new Date(ad.expires_at) < new Date() && !isPending;
    const status = isPending ? 'PENDING' : isExpired ? 'EXPIRED' : 'ACTIVE';

    const styles: Record<string, string> = {
        ACTIVE: 'bg-green-100 text-green-700',
        PAUSED: 'bg-gray-100 text-gray-500',
        EXPIRED: 'bg-red-100 text-red-600',
        PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
    };
    const labels: Record<string, string> = {
        ACTIVE: '진행 중',
        PAUSED: '일시정지',
        EXPIRED: '만료',
        PENDING: '결제 대기중',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${styles[status] || ''}`}>
            {status === 'ACTIVE' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
            {labels[status] || status}
        </span>
    );
};

export default function BizAdsList({ initialAds }: { initialAds: any[] }) {
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
                        <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="text-left px-6 py-4 text-[12px] font-black text-gray-500">광고명</th>
                            <th className="text-left px-4 py-4 text-[12px] font-black text-gray-500">등급</th>
                            <th className="text-left px-4 py-4 text-[12px] font-black text-gray-500">상태</th>
                            <th className="text-left px-4 py-4 text-[12px] font-black text-gray-500">조회수</th>
                            <th className="text-left px-4 py-4 text-[12px] font-black text-gray-500">만료일</th>
                            <th className="text-right px-6 py-4 text-[12px] font-black text-gray-500">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ads.map((ad: any) => {
                            const isPendingOrExpired = new Date(ad.expires_at) < new Date();
                            
                            return (
                                <tr key={ad.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {(ad.logo_url || ad.image) && (
                                                <img src={ad.logo_url || ad.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                            )}
                                            <div>
                                                <p className="font-bold text-[14px] text-gray-900">{ad.title}</p>
                                                <p className="text-[12px] text-gray-500">{ad.company} · {ad.location}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <TierBadge tier={ad.tier} />
                                    </td>
                                    <td className="px-4 py-4">
                                        <StatusBadge ad={ad} />
                                        {isPendingOrExpired && (
                                            <button 
                                                onClick={() => setPaymentAd(ad)}
                                                className="mt-2 text-[11px] font-black bg-gray-900 text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-black transition-colors"
                                            >
                                                <CreditCard className="w-3 h-3" /> 결제 및 노출
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="flex items-center gap-1 text-[13px] font-bold text-gray-700">
                                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                                            {ad.view_count?.toLocaleString() || 0}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="flex items-center gap-1 text-[13px] font-medium text-gray-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            {ad.expires_at && new Date(ad.expires_at).getFullYear() !== 2000 ? new Date(ad.expires_at).toLocaleDateString() : '결제 대기'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/jobs/${ad.id}`} target="_blank" className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="미리보기">
                                                <Eye className="w-4 h-4 text-primary" />
                                            </Link>
                                            <Link href={`/biz/ads/${ad.id}/edit`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="수정">
                                                <Pencil className="w-4 h-4 text-gray-500" />
                                            </Link>
                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="일시정지/재개 (구현 예정)">
                                                <Pause className="w-4 h-4 text-gray-500" />
                                            </button>
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
