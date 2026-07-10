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

    // 전광판 효과 텍스트 컴포넌트 (상시 자동 롤링 구조)
    const TickerText = ({ text, maxWidth = '160px', className = '', limit = 12 }: { text: string; maxWidth?: string; className?: string; limit?: number }) => {
        if (!text) return <span className="text-gray-400 font-bold">-</span>;
        const isLong = text.length > limit;

        return (
            <div 
                className="relative overflow-hidden whitespace-nowrap mx-auto cursor-default py-1 text-center"
                style={{ maxWidth }}
            >
                {isLong ? (
                    <div className="w-full overflow-hidden relative h-5">
                        <div className="absolute top-0 left-0 w-max animate-banner-marquee text-left">
                            <span className={className}>{text}</span>
                            <span className="inline-block w-8"></span>
                            <span className={className}>{text}</span>
                            <span className="inline-block w-8"></span>
                        </div>
                    </div>
                ) : (
                    <div className={`w-full truncate text-center ${className}`}>
                        {text}
                    </div>
                )}
            </div>
        );
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '결제 대기';
        const d = new Date(dateStr);
        if (isNaN(d.getTime()) || d.getFullYear() === 2000) return '결제 대기';
        return d.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\. /g, '.').replace(/\.$/, '');
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
            {/* 상시 전광판 CSS 키프레임 주입 */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes adMarquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-ad-marquee {
                    display: inline-block;
                    animation: adMarquee 15s linear infinite;
                }
            `}} />

            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-center table-fixed">
                    <thead>
                        <tr className="bg-gray-50/75 border-b border-gray-150 text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                            <th className="px-4 py-4 text-center w-[110px] min-w-[110px]">배너 종류</th>
                            <th className="px-4 py-4 text-center w-[85px] min-w-[85px]">로고</th>
                            <th className="px-6 py-4 text-center w-[200px] min-w-[200px]">제목</th>
                            <th className="px-4 py-4 text-center w-[110px] min-w-[110px]">업체명</th>
                            <th className="px-4 py-4 text-center w-[100px] min-w-[100px]">근무지역</th>
                            <th className="px-4 py-4 text-center w-[70px] min-w-[70px]">상태</th>
                            <th className="px-4 py-4 text-center w-[105px] min-w-[105px]">노출 만료일</th>
                            <th className="px-4 py-4 text-center w-[130px] min-w-[130px]">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                        {ads.map((ad: any) => {
                            const expiresMs = ad.expires_at ? new Date(ad.expires_at).getTime() : 0;
                            const isInvalidOrPending = !ad.expires_at || isNaN(expiresMs) || new Date(ad.expires_at).getFullYear() === 2000;
                            const isExpired = !isInvalidOrPending && (expiresMs < Date.now());
                            const isPendingOrExpired = isInvalidOrPending || isExpired;
                            
                            return (
                                <tr 
                                    key={ad.id} 
                                    className="hover:bg-gray-50/50 transition-colors"
                                >
                                    {/* 배너 종류 */}
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                        <TierBadge tier={ad.tier} />
                                    </td>

                                    {/* 로고 */}
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center">
                                            {ad.logo_url || ad.image ? (
                                                <div className="w-[75px] h-[50px] rounded-lg border border-gray-200 shadow-sm overflow-hidden bg-white flex items-center justify-center shrink-0">
                                                    <img 
                                                        src={ad.logo_url || ad.image} 
                                                        alt="로고" 
                                                        className="w-full h-full object-contain" 
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-gray-400 font-medium">없음</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* 제목 */}
                                    <td className="px-6 py-4 text-center">
                                        <TickerText 
                                            text={ad.title} 
                                            maxWidth="180px" 
                                            limit={12}
                                            className="font-black text-gray-900" 
                                        />
                                    </td>

                                    {/* 업체명 */}
                                    <td className="px-4 py-4 text-center">
                                        <TickerText 
                                            text={ad.company || ad.company_name} 
                                            maxWidth="95px" 
                                            limit={6}
                                            className="font-bold text-gray-600" 
                                        />
                                    </td>

                                    {/* 근무지역 */}
                                    <td className="px-4 py-4 text-center">
                                        <TickerText 
                                            text={ad.location || '전지역'} 
                                            maxWidth="85px" 
                                            limit={5}
                                            className="text-gray-500 font-medium" 
                                        />
                                    </td>

                                    {/* 상태 */}
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                        <StatusBadge ad={ad} isVerified={!!isVerified} />
                                    </td>

                                    {/* 노출 만료일 */}
                                    <td className="px-4 py-4 whitespace-nowrap text-center font-bold text-gray-600">
                                        {formatDate(ad.expires_at)}
                                    </td>

                                    {/* 관리 (수정 버튼 제거, 오직 결제 버튼만 제공) */}
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center">
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
        </div>
    );
}
