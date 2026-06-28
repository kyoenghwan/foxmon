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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ads.map((ad: any) => {
                return (
                    <div 
                        key={ad.id}
                        className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                        onClick={() => router.push(`/biz/banners/${ad.id}/edit`)}
                    >
                        {/* 배너 이미지 프리뷰 */}
                        <div 
                            className="relative h-32 flex items-center justify-center overflow-hidden shrink-0"
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
                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="font-black text-[14px] text-gray-900 truncate">{ad.title}</h3>
                                <p className="text-[12px] text-gray-500 font-medium truncate">{ad.company || ad.company_name} · {ad.location}</p>
                            </div>

                            {/* 액션 버튼 */}
                            <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2 shrink-0">
                                <button
                                    onClick={(e) => { e.stopPropagation(); router.push(`/biz/banners/${ad.id}/edit`); }}
                                    className="flex-1 flex items-center justify-center gap-1 py-2 text-[12px] font-bold text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <Pencil className="w-3.5 h-3.5" /> 배너 수정
                                </button>
                                <button
                                    disabled={deletingId === ad.id}
                                    onClick={(e) => handleDelete(e, ad.id)}
                                    className="flex-1 flex items-center justify-center gap-1 py-2 text-[12px] font-bold text-red-600 bg-red-50/50 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> 배너 삭제
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
