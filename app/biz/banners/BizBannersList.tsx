'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Clock, CreditCard, Eye, ImageIcon } from 'lucide-react';
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
        PREMIUM: '🔥 프리미엄 메인',
        SIDE: '🚀 사이드',
        SPECIAL: '⚡ 스페셜',
        GENERAL: '📋 일반',
        AD_GENERAL: '📢 배너(일반)',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black border ${styles[tier] || styles.GENERAL}`}>
            {labels[tier] || tier || '일반'}
        </span>
    );
};

export function BizBannersList({ initialAds, isVerified }: { initialAds: any[], isVerified?: boolean }) {
    const router = useRouter();
    const [ads] = useState(initialAds);
    const [paymentAd, setPaymentAd] = useState<any | null>(null);

    const handlePaymentSuccess = () => {
        setPaymentAd(null);
        window.location.reload();
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {ads.map((ad: any) => {
                    const expiresMs = ad.expires_at ? new Date(ad.expires_at).getTime() : 0;
                    const isInvalidOrPending = !ad.expires_at || isNaN(expiresMs) || new Date(ad.expires_at).getFullYear() === 2000;
                    const isExpired = !isInvalidOrPending && (expiresMs < Date.now());
                    const isPendingOrExpired = isInvalidOrPending || isExpired;
                    const hasClaimCode = !!ad.claim_code;

                    return (
                        <div 
                            key={ad.id}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                            onClick={() => router.push(`/biz/ads/${ad.id}/edit`)}
                        >
                            {/* 배너 이미지 프리뷰 */}
                            <div 
                                className="relative h-32 flex items-center justify-center overflow-hidden"
                                style={{ backgroundColor: ad.background_color || ad.color || '#f3f4f6' }}
                            >
                                {ad.image ? (
                                    <img 
                                        src={ad.image} 
                                        alt={ad.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                    />
                                ) : (
                                    <div className="flex flex-col items-center text-gray-400">
                                        <ImageIcon className="w-8 h-8 mb-1" />
                                        <span className="text-[11px] font-bold">배너 이미지 없음</span>
                                    </div>
                                )}
                                {/* 로고 오버레이 */}
                                {ad.logo_url && (
                                    <img 
                                        src={ad.logo_url} 
                                        alt="로고" 
                                        className="absolute bottom-2 left-2 w-10 h-10 rounded-lg object-cover border-2 border-white shadow-sm" 
                                    />
                                )}
                                {/* 등급 배지 */}
                                <div className="absolute top-2 right-2">
                                    <TierBadge tier={ad.tier} />
                                </div>
                            </div>

                            {/* 카드 정보 */}
                            <div className="p-4 space-y-3">
                                <div>
                                    <h3 className="font-black text-[14px] text-gray-900 truncate">{ad.title}</h3>
                                    <p className="text-[12px] text-gray-500 font-medium truncate">{ad.company} · {ad.location}</p>
                                </div>

                                {/* 상태 & 만료일 */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        {isPendingOrExpired ? (
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                {hasClaimCode ? '수락 대기' : '결제 대기'}
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                진행 중
                                            </span>
                                        )}
                                    </div>
                                    <span className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        {ad.expires_at && new Date(ad.expires_at).getFullYear() !== 2000 
                                            ? new Date(ad.expires_at).toLocaleDateString() 
                                            : '-'}
                                    </span>
                                </div>

                                {/* 액션 버튼 */}
                                <div className="flex gap-2 pt-2 border-t border-gray-100">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); router.push(`/biz/ads/${ad.id}/edit`); }}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-bold text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <Pencil className="w-3.5 h-3.5" /> 배너 수정
                                    </button>
                                    {isPendingOrExpired && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setPaymentAd(ad); }}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-bold text-white bg-gray-900 rounded-lg hover:bg-black transition-colors"
                                        >
                                            <CreditCard className="w-3.5 h-3.5" /> 결제
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
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
