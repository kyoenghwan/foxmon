import React from 'react';
import { QA_GET_SITE_BANNERS } from '@/src/atoms/qa/admin/QA_GET_SITE_BANNERS';
import { CreditCard } from 'lucide-react';
import { AdsClientWrapper } from '@/components/admin/ads/AdsClientWrapper';

export const dynamic = 'force-dynamic';

export default async function AdminAdsPage() {
    const res = await QA_GET_SITE_BANNERS();
    // 테이블이 없어서 에러가 날 경우 빈 배열 처리
    const banners = res.success && res.data ? res.data : [];
    const dbError = !res.success ? res.error : null;

    return (
        <div className="space-y-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-primary" />
                        공지 및 이벤트
                    </h2>
                    <p className="text-[13px] text-gray-500 font-medium mt-1">
                        플랫폼 전체에 노출되는 이벤트 팝업 및 메인 배너를 관리합니다.
                    </p>
                </div>
            </div>

            {dbError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm font-bold mt-4">
                    ⚠️ 데이터베이스 테이블이 아직 생성되지 않았습니다. 루트 폴더의 migration_site_banners.sql 파일을 실행해주세요.
                </div>
            )}

            <AdsClientWrapper initialBanners={banners} />
        </div>
    );
}
