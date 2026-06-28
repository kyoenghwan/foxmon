import Link from 'next/link';
import { Megaphone, Plus, ShieldAlert } from 'lucide-react';

import { manageBizAdAction } from '@/lib/actions';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import BizAdsList from './BizAdsList';
import { ClaimAdButton } from '@/components/biz/ClaimAdButton';

export const dynamic = 'force-dynamic';

export default async function BizAdsPage() {
    const session = await auth();
    let isVerifiedEmployer = false;
    
    if (session?.user?.id) {
        const { data: profile } = await supabaseAdmin
            .from('users')
            .select('is_business_verified, business_number')
            .eq('id', session.user.id)
            .single();
            
        // 법적 조건: 사업자번호(business_number)가 존재하고, 관리자 승인(is_business_verified)이 모두 완료되어야 함
        isVerifiedEmployer = !!profile?.is_business_verified && !!profile?.business_number;
    }

    const res = isVerifiedEmployer ? await manageBizAdAction('GET') : { success: true, data: [] };
    const ads = (res.success && res.data ? res.data : []);

    const isAgent = session?.user 
        ? ((session.user as any).login_id === 'foxmon_ad' || 
           (session.user as any).login_id === 'mon_ad' || 
           (session.user as any).role === 'ADMIN' || 
           (session.user as any).role === 'SUPER_ADMIN')
        : false;

    return (
        <div className="space-y-6">
            {/* 페이지 헤더 */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-primary" />
                        광고 관리
                    </h2>
                    <p className="text-[13px] text-gray-500 font-medium mt-1">
                        등록한 광고를 관리하세요.
                    </p>
                </div>
                {isVerifiedEmployer && (
                    <div className="flex items-center gap-3 shrink-0">
                        <ClaimAdButton />
                        <Link 
                            href="/biz/ads/new"
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-black text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-sm active:scale-95 shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            새 광고 등록
                        </Link>
                    </div>
                )}
            </div>

            {/* 법적 차단막 (비사업자 / 미인증 회원) */}
            {!isVerifiedEmployer ? (
                <div className="bg-white rounded-2xl border border-gray-150 p-8 shadow-sm flex flex-col items-center justify-center text-center gap-6 max-w-2xl mx-auto my-6">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                        <ShieldAlert className="w-9 h-9" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-black text-lg text-gray-900">⚠️ 사업자 회원 전용 서비스 안내</h3>
                        <p className="text-[13px] font-medium text-gray-500 leading-relaxed max-w-lg">
                            관련 구인광고 심의 법령 및 직업안정법 규정에 의거하여, <strong>구인 광고 게재 및 광고 관리 대시보드 서비스는 공식 사업자등록번호가 승인된 사업자 회원</strong>만 이용하실 수 있습니다.
                        </p>
                        <p className="text-[12px] font-bold text-red-500 leading-relaxed max-w-lg">
                            * 일반 업체회원(신분증 인증)은 포인트 관리/이력서 열람만 가능하며 광고 집행이 제한됩니다. 광고 등록을 원하실 경우 사업자등록증 정보를 먼저 인증해 주시기 바랍니다.
                        </p>
                    </div>
                    <Link 
                        href="/mypage"
                        className="px-6 py-3 bg-primary text-white font-black text-[13px] rounded-xl hover:bg-orange-600 transition-all shadow-md active:scale-95"
                    >
                        마이페이지에서 사업자 인증하기
                    </Link>
                </div>
            ) : ads.length === 0 ? (
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
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <ClaimAdButton />
                        <Link 
                            href="/biz/ads/new"
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-md"
                        >
                            <Plus className="w-4 h-4" />
                            첫 광고 등록하기
                        </Link>
                    </div>
                </div>
            ) : (
                <BizAdsList initialAds={ads} isVerified={isVerifiedEmployer} isAgent={isAgent} />
            )}
        </div>
    );
}
