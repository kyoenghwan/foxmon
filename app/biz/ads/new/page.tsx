'use client';

import React, { useState, useEffect } from 'react';
import { AdSelectorAndPaymentForm } from '@/components/biz/AdSelectorAndPaymentForm';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { manageBizAdAction } from '@/lib/actions';
import { MobileBlockNotice } from '@/components/biz/MobileBlockNotice';

export default function NewAdPage() {
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadBanners = async () => {
            try {
                // 내 광고 정보 중 Draft(임시저장 배너 템플릿)만 필터링해서 가져옴
                const res = await manageBizAdAction('GET');
                if (res.success && res.data) {
                    const draftBanners = res.data.filter((ad: any) => {
                        const expiresYear = ad.expires_at ? new Date(ad.expires_at).getFullYear() : 2000;
                        return !ad.expires_at || expiresYear === 2000 || ad.is_draft === true;
                    });
                    setBanners(draftBanners);
                }
            } catch (error) {
                console.error('배너 로드 에러:', error);
            } finally {
                setLoading(false);
            }
        };

        loadBanners();
    }, []);

    return (
        <>
            <MobileBlockNotice />
            <div className="hidden md:block space-y-6">
                {/* 페이지 헤더 */}
                <div className="flex items-center gap-4">
                    <Link href="/biz/ads" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">새 광고 등록</h2>
                        <p className="text-[13px] text-gray-500 font-medium mt-0.5">
                            내가 보관 중인 배너를 선택하고 광고 노출 기간을 결제하여 광고를 시작합니다.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-gray-100 rounded-2xl">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-[12px] text-gray-400 font-bold">내 배너 템플릿 목록 로딩 중...</p>
                    </div>
                ) : (
                    <AdSelectorAndPaymentForm initialBanners={banners} />
                )}
            </div>
        </>
    );
}
