import Link from 'next/link';
import { Megaphone, Plus } from 'lucide-react';

import { manageBizAdAction } from '@/lib/actions';
import BizAdsList from './BizAdsList';

export default async function BizAdsPage() {
    const res = await manageBizAdAction('GET');
    const ads = (res.success && res.data ? res.data : []);

    return (
        <div className="space-y-6">
            {/* 페이지 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-primary" />
                        광고 관리
                    </h2>
                    <p className="text-[13px] text-gray-500 font-medium mt-1">
                        등록한 유료 배너 광고를 확인하고 관리하세요.
                    </p>
                </div>
                <Link 
                    href="/biz/ads/new"
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-black text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-sm active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    새 광고 등록
                </Link>
            </div>

            {/* 광고 목록 */}
            {ads.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center">
                        <Megaphone className="w-8 h-8 text-primary/60" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg text-gray-800">등록된 광고가 없습니다</h3>
                        <p className="text-[13px] font-medium text-gray-500 mt-1">
                            첫 광고를 등록하고 구직자에게 업체를 알려보세요!
                        </p>
                    </div>
                    <Link 
                        href="/biz/ads/new"
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        첫 광고 등록하기
                    </Link>
                </div>
            ) : (
                <BizAdsList initialAds={ads} />
            )}
        </div>
    );
}
