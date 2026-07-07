'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, ImageIcon } from 'lucide-react';
import { manageBizAdAction } from '@/lib/actions';

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
    const [ads, setAds] = useState(initialAds);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('정말 이 배너를 삭제하시겠습니까?')) return;

        setDeletingId(id);
        try {
            const res = await manageBizAdAction('DELETE', undefined, id);
            if (res.success) {
                setAds(prev => prev.filter(ad => ad.id !== id));
                alert('배너가 삭제되었습니다.');
            } else {
                alert('삭제 실패: ' + res.message);
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('삭제 중 오류가 발생했습니다.');
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '무제한 노출';
        const d = new Date(dateStr);
        if (d.getFullYear() === 2000) return '템플릿';
        return d.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const StatusBadge = ({ ad }: { ad: any }) => {
        const isExpired = ad.expires_at ? new Date(ad.expires_at) < new Date() : false;
        if (isExpired) {
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">만료됨</span>;
        }
        if (ad.status === 'ACTIVE') {
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">노출 중</span>;
        }
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">{ad.status || '대기'}</span>;
    };

    // 전광판 효과 텍스트 컴포넌트 (Pure CSS 기반 겹침 차단 구조)
    const TickerText = ({ text, maxWidth = '160px', className = '' }: { text: string; maxWidth?: string; className?: string }) => {
        if (!text) return <span className="text-gray-400 font-bold">-</span>;
        return (
            <div 
                className="relative overflow-hidden whitespace-nowrap mx-auto cursor-default py-1 ticker-container text-center"
                style={{ maxWidth }}
            >
                {/* 평상시 노출되는 기본 말줄임 텍스트 */}
                <div className={`w-full truncate ticker-static ${className}`}>
                    {text}
                </div>
                {/* 호버 시에만 나타나서 흐르는 텍스트 */}
                <div className="absolute top-1 left-0 w-max ticker-flow animate-banner-marquee text-left">
                    <span className={className}>{text}</span>
                    <span className="inline-block w-8"></span> {/* 간격 확보용 */}
                    <span className={className}>{text}</span>
                    <span className="inline-block w-8"></span>
                </div>
            </div>
        );
    };

    if (!ads || ads.length === 0) {
        return (
            <div className="py-12 bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-12 h-12 mb-2" />
                <p className="font-bold">등록된 배너 광고가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
            {/* 전광판 CSS 키프레임 및 호버 겹침 방지 스타일 주입 */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes bannerMarquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-banner-marquee {
                    display: inline-block;
                    animation: bannerMarquee 8s linear infinite;
                }
                .ticker-flow {
                    display: none;
                }
                .ticker-static {
                    display: block;
                }
                .ticker-container:hover .ticker-flow {
                    display: inline-block;
                }
                .ticker-container:hover .ticker-static {
                    display: none;
                }
            `}} />

            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-center">
                    <thead>
                        <tr className="bg-gray-50/75 border-b border-gray-150 text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                            <th className="px-6 py-4 text-center">배너 종류</th>
                            <th className="px-6 py-4 text-center w-[150px]">로고</th>
                            <th className="px-6 py-4 text-center">제목</th>
                            <th className="px-6 py-4 text-center">업체명</th>
                            <th className="px-6 py-4 text-center">근무지역</th>
                            <th className="px-6 py-4 text-center">상태</th>
                            <th className="px-6 py-4 text-center">노출 만료일</th>
                            <th className="px-6 py-4 text-center">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                        {ads.map((ad: any) => (
                            <tr 
                                key={ad.id} 
                                className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                onClick={() => router.push(`/biz/banners/${ad.id}/edit`)}
                            >
                                {/* 배너 종류 (가운데 정렬) */}
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <TierBadge tier={ad.tier} />
                                </td>

                                {/* 로고 (2:1 비율인 w-[90px] h-[45px] 적용, 찌그러짐 방지용 object-contain 및 bg-white 처리) */}
                                <td className="px-6 py-4 whitespace-nowrap text-center w-[150px]">
                                    <div className="flex items-center justify-center">
                                        {ad.logo_url ? (
                                            <div className="w-[90px] h-[45px] rounded-lg border border-gray-200 shadow-sm overflow-hidden bg-white flex items-center justify-center shrink-0">
                                                <img 
                                                    src={ad.logo_url} 
                                                    alt="로고" 
                                                    className="w-full h-full object-contain" 
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-[11px] text-gray-400 font-medium">없음</span>
                                        )}
                                    </div>
                                </td>

                                {/* 제목 (마우스 호버 시 우측에서 좌측으로 흐르는 전광판) */}
                                <td className="px-6 py-4 text-center">
                                    <TickerText 
                                        text={ad.title} 
                                        maxWidth="240px" 
                                        className="font-black text-gray-900 hover:text-primary transition-colors" 
                                    />
                                </td>

                                {/* 업체명 (마우스 호버 시 우측에서 좌측으로 흐르는 전광판) */}
                                <td className="px-6 py-4 text-center">
                                    <TickerText 
                                        text={ad.company || ad.company_name} 
                                        maxWidth="130px" 
                                        className="font-bold text-gray-600" 
                                    />
                                </td>

                                {/* 근무지역 (마우스 호버 시 우측에서 좌측으로 흐르는 전광판) */}
                                <td className="px-6 py-4 text-center">
                                    <TickerText 
                                        text={ad.location || '전지역'} 
                                        maxWidth="120px" 
                                        className="text-gray-500 font-medium" 
                                    />
                                </td>

                                {/* 상태 (가운데 정렬) */}
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <StatusBadge ad={ad} />
                                </td>

                                {/* 노출 만료일 (가운데 정렬) */}
                                <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-gray-600">
                                    {formatDate(ad.expires_at)}
                                </td>

                                {/* 관리 (가운데 정렬) */}
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => router.push(`/biz/banners/${ad.id}/edit`)}
                                            className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                                        >
                                            <Pencil className="w-3 h-3" /> 수정
                                        </button>
                                        <button
                                            disabled={deletingId === ad.id}
                                            onClick={(e) => handleDelete(e, ad.id)}
                                            className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-red-600 bg-red-50/50 rounded-lg hover:bg-red-50 transition-colors border border-red-100 disabled:opacity-50"
                                        >
                                            <Trash2 className="w-3 h-3" /> 삭제
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
