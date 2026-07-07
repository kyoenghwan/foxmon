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
            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left">
                    <thead>
                        <tr className="bg-gray-50/75 border-b border-gray-150 text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                            <th className="px-6 py-4">배너 종류</th>
                            <th className="px-6 py-4">배너 이미지</th>
                            <th className="px-6 py-4">로고</th>
                            <th className="px-6 py-4">제목</th>
                            <th className="px-6 py-4">업체명</th>
                            <th className="px-6 py-4">근무지역</th>
                            <th className="px-6 py-4">상태</th>
                            <th className="px-6 py-4">노출 만료일</th>
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
                                {/* 배너 종류 */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <TierBadge tier={ad.tier} />
                                </td>

                                {/* 배너 이미지 */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div 
                                        className="w-[70px] h-[40px] rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50"
                                        style={{ backgroundColor: ad.background_color || ad.color }}
                                    >
                                        {ad.image ? (
                                            <img 
                                                src={ad.image} 
                                                alt="배너" 
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            <ImageIcon className="w-4 h-4 text-gray-400" />
                                        )}
                                    </div>
                                </td>

                                {/* 로고 */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {ad.logo_url ? (
                                        <img 
                                            src={ad.logo_url} 
                                            alt="로고" 
                                            className="w-8 h-8 rounded-lg object-cover border border-gray-200 shadow-sm" 
                                        />
                                    ) : (
                                        <span className="text-[11px] text-gray-400 font-medium">없음</span>
                                    )}
                                </td>

                                {/* 제목 */}
                                <td className="px-6 py-4 max-w-[250px] truncate">
                                    <span className="font-black text-gray-900 hover:text-primary transition-colors">
                                        {ad.title}
                                    </span>
                                </td>

                                {/* 업체명 */}
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-600">
                                    {ad.company || ad.company_name || '업체명 없음'}
                                </td>

                                {/* 근무지역 */}
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">
                                    {ad.location || '전지역'}
                                </td>

                                {/* 상태 */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge ad={ad} />
                                </td>

                                {/* 노출 만료일 */}
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-600">
                                    {formatDate(ad.expires_at)}
                                </td>

                                {/* 관리 (수정/삭제 버튼) */}
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
