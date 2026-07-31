'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Check, AlertTriangle, Layers, Clock, Coins, Megaphone, ArrowRight, Sparkles } from 'lucide-react';
import { manageBizAdAction } from '@/lib/actions';
import { getUserPointsAction } from '@/app/actions/pointActions';
import { GET_POINT_POLICIES } from '@/app/actions/pointPolicyActions';

interface AdSelectorAndPaymentFormProps {
    initialBanners: any[];
}

export function AdSelectorAndPaymentForm({ initialBanners }: AdSelectorAndPaymentFormProps) {
    const router = useRouter();
    const [banners, setBanners] = useState<any[]>(initialBanners.filter((b: any) => b.tier !== 'GENERAL' && b.tier !== 'AD_GENERAL'));
    const [selectedAd, setSelectedAd] = useState<any | null>(null);

    // 포인트 및 요금 관련 상태
    const [userPoints, setUserPoints] = useState<number>(0);
    const [loadingPoints, setLoadingPoints] = useState(true);
    const [policies, setPolicies] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);

    // 결제 옵션 상태
    const [period, setPeriod] = useState<30 | 60 | 90>(30);
    const [isSubscription, setIsSubscription] = useState(false);
    const [optionDoubleSlot, setOptionDoubleSlot] = useState(false);
    const [optionFixed, setOptionFixed] = useState(false);
    const [optionHighlight, setOptionHighlight] = useState(false);

    useEffect(() => {
        const loadFinanceData = async () => {
            try {
                const res = await getUserPointsAction();
                if (res.success && res.points !== undefined) {
                    setUserPoints(res.points);
                }

                const policiesRes = await GET_POINT_POLICIES();
                if (policiesRes.success && policiesRes.data) {
                    const policyMap: Record<string, number> = {};
                    policiesRes.data.forEach(p => {
                        policyMap[p.config_key] = p.config_value;
                    });
                    setPolicies(policyMap);
                }
            } catch (err) {
                console.error('포인트 및 정책 로드 에러:', err);
            } finally {
                setLoadingPoints(false);
            }
        };

        loadFinanceData();
    }, []);

    // 템플릿(Draft 배너) 리스트 실시간 리로드
    const reloadBanners = async () => {
        try {
            const res = await manageBizAdAction('GET');
            if (res.success && res.data) {
                const draftBanners = res.data.filter((ad: any) => {
                    const expiresYear = ad.expires_at ? new Date(ad.expires_at).getFullYear() : 2000;
                    const isDraft = !ad.expires_at || expiresYear === 2000 || ad.is_draft === true;
                    return isDraft && ad.tier !== 'GENERAL' && ad.tier !== 'AD_GENERAL';
                });
                setBanners(draftBanners);
                if (selectedAd) {
                    const updatedSelected = draftBanners.find(b => b.id === selectedAd.id);
                    setSelectedAd(updatedSelected || null);
                }
            }
        } catch (error) {
            console.error('배너 리스트 갱신 실패:', error);
        }
    };

    const getBasePrice = (selectedTier: string, selectedPeriod: number) => {
        const tier = selectedTier || 'GENERAL';
        return policies[`TIER_PRICE_${tier}_${selectedPeriod}`] || 0;
    };

    const calculateTotalPoints = () => {
        if (!selectedAd) return 0;
        const doubleDiscount = policies['DISCOUNT_RATIO_BIZ_DOUBLE_SLOT'] !== undefined ? policies['DISCOUNT_RATIO_BIZ_DOUBLE_SLOT'] : 5;
        const themeEffectPrice = policies['OPTION_PRICE_BIZ_THEME_EFFECT_' + period] || 30000;
        const fixedPrice = policies['OPTION_PRICE_SIDE_FIXED_' + period] || (getBasePrice(selectedAd.tier, period) * 3);

        let base = optionFixed ? fixedPrice : getBasePrice(selectedAd.tier, period);
        let total = base;

        if (isSubscription) {
            total = Math.floor(total * 0.95); // 정기구독 5% 할인
        }

        if (optionDoubleSlot) {
            total *= 2;
        }

        if (optionHighlight) {
            total += themeEffectPrice;
        }

        if (optionDoubleSlot) {
            total = Math.floor(total * ((100 - doubleDiscount) / 100));
        }

        return total;
    };

    const handleCheckout = async () => {
        if (!selectedAd) {
            alert('광고를 진행할 배너를 먼저 선택해주세요.');
            return;
        }

        const totalPoints = calculateTotalPoints();
        if (userPoints < totalPoints) {
            alert(`보유 포인트가 부족합니다.\n보유: ${userPoints.toLocaleString()}P / 필요: ${totalPoints.toLocaleString()}P\n포인트 충전 후 다시 시도해 주세요.`);
            return;
        }

        if (!confirm(`선택한 배너로 광고 등록을 신청하시겠습니까?\n총 ${totalPoints.toLocaleString()}P가 차감됩니다.`)) {
            return;
        }

        setSaving(true);
        try {
            // Draft 상태인 광고를 결제 정보와 함께 활성화(is_draft=false 및 expires_at 신규 설정)로 업데이트합니다.
            const finalForm = {
                tier: selectedAd.tier,
                exposure_period: period,
                is_subscription: isSubscription,
                option_double_slot: optionDoubleSlot,
                is_fixed: optionFixed,
                option_highlight: optionHighlight,
                _isPayment: true,
                _isDraft: false // Draft 상태 해제
            };

            const res = await manageBizAdAction('UPDATE', finalForm, selectedAd.id);
            if (res.success) {
                alert('광고 등록 및 포인트 결제가 완료되었습니다!\n구직자 홈 화면에 광고가 게재됩니다.');
                router.push('/biz/ads');
            } else {
                alert('결제 처리 실패: ' + res.message);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('결제 처리 중 예상치 못한 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const getTierLabel = (tier: string) => {
        const labels: Record<string, string> = {
            PREMIUM_MAIN: '🔥 프리미엄 메인',
            SIDE: '🚀 사이드 배너',
            SPECIAL: '⚡ 스페셜 본문',
            GENERAL: '📋 일반 구인',
            AD_GENERAL: '📢 일반 배너'
        };
        return labels[tier] || tier;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* 좌측: 배너 선택기 (7/12) */}
            <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-[15px] text-gray-900 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-primary" />
                            1. 보관 중인 배너 선택
                        </h3>
                        <span className="text-[11px] font-bold text-gray-400">총 {banners.length}개 보관됨</span>
                    </div>

                    {banners.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center flex flex-col items-center gap-3">
                            <Megaphone className="w-8 h-8 text-gray-300" />
                            <p className="text-[13px] text-gray-500 font-bold">보관 중인 배너 템플릿이 없습니다.</p>
                            <button
                                type="button"
                                onClick={() => router.push('/biz/banners/new')}
                                className="px-4 py-2 bg-primary hover:bg-orange-600 text-white text-[12px] font-black rounded-lg transition-all active:scale-95"
                            >
                                + 첫 배너 디자인하러 가기
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
                            {banners.map((banner) => {
                                const isSelected = selectedAd?.id === banner.id;
                                return (
                                    <div
                                        key={banner.id}
                                        onClick={() => setSelectedAd(banner)}
                                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden ${
                                            isSelected 
                                                ? 'border-primary bg-orange-50/20 shadow-sm' 
                                                : 'border-gray-150 hover:border-gray-300 bg-white'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                                {getTierLabel(banner.tier)}
                                            </span>
                                            {isSelected && (
                                                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white stroke-[3px]" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="truncate">
                                            <p className="font-black text-[13px] text-gray-800 truncate">{banner.title}</p>
                                            <p className="text-[11px] text-gray-500 font-bold truncate mt-0.5">
                                                {banner.company || banner.company_name} · {banner.location}
                                            </p>
                                        </div>
                                        {/* 간단 비주얼 프리뷰 */}
                                        <div 
                                            className="h-10 rounded border border-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-bold overflow-hidden mt-1"
                                            style={{ backgroundColor: banner.background_color || banner.color || '#f9fafb' }}
                                        >
                                            {banner.image ? '🖼️ 이미지 배너' : '🎨 단색 배너'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 선택된 배너 세부 프리뷰 */}
                {selectedAd && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm animate-fadeIn">
                        <h4 className="font-black text-[14px] text-gray-900 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            선택된 배너 외형 미리보기
                        </h4>
                        
                        <div 
                            className="rounded-xl border border-gray-200 p-8 flex items-center justify-center min-h-[140px] shadow-inner"
                            style={{ backgroundColor: selectedAd.background_color || selectedAd.color || '#f3f4f6' }}
                        >
                            {selectedAd.image ? (
                                <img 
                                    src={selectedAd.image} 
                                    alt={selectedAd.title} 
                                    className="max-h-28 object-contain rounded-lg shadow-sm"
                                />
                            ) : (
                                <div className="text-center">
                                    <p className="font-black text-lg text-gray-800" style={{ color: selectedAd.text_color || '#111827' }}>
                                        {selectedAd.title}
                                    </p>
                                    <p className="text-[12px] font-bold text-gray-600 mt-1">
                                        {selectedAd.company || selectedAd.company_name} · {selectedAd.location}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
                            <p className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">구인 공고 정보 요약</p>
                            <div className="grid grid-cols-2 gap-2 text-[12px] text-gray-600 font-bold">
                                <div>급여: <span className="text-primary font-black">{selectedAd.pay_type} {selectedAd.pay_amount || selectedAd.pay}</span></div>
                                <div>근무 시간: {selectedAd.work_time || selectedAd.work_hours || '정보 없음'}</div>
                                <div>채용 분야: {selectedAd.employment_type || '정보 없음'}</div>
                                <div>연락처: {selectedAd.contact_phone || selectedAd.contact_info || '정보 없음'}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 우측: 가격 정보 및 결제 폼 (5/12) */}
            <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6 shadow-sm">
                    <h3 className="font-black text-[15px] text-gray-900 flex items-center gap-2">
                        <Coins className="w-5 h-5 text-primary" />
                        2. 광고 기간 설정 및 결제
                    </h3>

                    {/* 내 보유 포인트 */}
                    <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 flex justify-between items-center">
                        <span className="text-[12px] font-bold text-gray-600">내 보유 포인트</span>
                        <span className="text-[16px] font-black text-gray-900 flex items-center gap-1">
                            {loadingPoints ? (
                                <span className="w-16 h-4 bg-gray-200 animate-pulse rounded" />
                            ) : (
                                <>
                                    {userPoints.toLocaleString()} <span className="text-[12px] font-bold text-primary">P</span>
                                </>
                            )}
                        </span>
                    </div>

                    {!selectedAd ? (
                        <div className="text-center py-12 text-gray-400 font-medium text-[13px] border border-dashed border-gray-150 rounded-xl">
                            배너를 먼저 선택하시면 결제 옵션이 활성화됩니다.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* 노출 기간 선택 */}
                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-gray-600 block">광고 노출 기간</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[30, 60, 90].map((d) => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setPeriod(d as any)}
                                            className={`py-3 rounded-xl font-black text-[13px] border-2 transition-all active:scale-95 ${
                                                period === d 
                                                    ? 'border-primary bg-primary text-white shadow-sm' 
                                                    : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'
                                            }`}
                                        >
                                            {d}일 게재
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 광고 상품 정보 */}
                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                <div className="flex justify-between items-center text-[13px] font-bold">
                                    <span className="text-gray-500">배너 광고 등급</span>
                                    <span className="text-gray-900">{getTierLabel(selectedAd.tier)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[13px] font-bold">
                                    <span className="text-gray-500">기간별 기본 요금</span>
                                    <span className="text-gray-900">
                                        {getBasePrice(selectedAd.tier, period).toLocaleString()} P
                                    </span>
                                </div>
                            </div>

                            {/* 추가 부가 옵션 (사이드 배너일 때 고정 옵션 등 활성화) */}
                            {selectedAd.tier === 'SIDE' && (
                                <div className="border-t border-gray-100 pt-4 space-y-3">
                                    <label className="text-[12px] font-bold text-gray-600 block mb-1">사이드 배너 전용 옵션</label>
                                    <label className="flex items-center gap-2 text-[13px] font-bold text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={optionFixed}
                                            onChange={(e) => setOptionFixed(e.target.checked)}
                                            className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                                        />
                                        <span>우측 고정 노출 (3배 가격 적용)</span>
                                    </label>
                                </div>
                            )}

                            {/* 테마 효과 추가 옵션 */}
                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                <label className="text-[12px] font-bold text-gray-600 block mb-1">부가 데코레이션 옵션</label>
                                <label className="flex items-center gap-2 text-[13px] font-bold text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={optionHighlight}
                                        onChange={(e) => setOptionHighlight(e.target.checked)}
                                        className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                                    />
                                    <span>배너 광원 테마 효과 추가 (+30,000P)</span>
                                </label>
                            </div>

                            {/* 최종 정산 요금 */}
                            <div className="border-t border-gray-150 pt-4 space-y-2">
                                <div className="flex justify-between items-center text-[13px] font-bold text-gray-500">
                                    <span>총 소요 포인트</span>
                                    <span className="text-[18px] font-black text-red-600">
                                        {calculateTotalPoints().toLocaleString()} P
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-bold">
                                    <span className="text-gray-400">결제 후 잔여 포인트</span>
                                    <span className={userPoints < calculateTotalPoints() ? 'text-red-500' : 'text-emerald-600'}>
                                        {(userPoints - calculateTotalPoints()).toLocaleString()} P
                                    </span>
                                </div>
                            </div>

                            {/* 경고문 */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 font-bold leading-normal">
                                ⚠️ 광고가 시작된 이후에는 중간에 광고 등급 변경이나 기간 중도 취소 및 환불이 불가능합니다. 신중히 확인 후 결제를 진행해 주세요.
                            </div>

                            {/* 결제 버튼 */}
                            <button
                                type="button"
                                disabled={saving || userPoints < calculateTotalPoints()}
                                onClick={handleCheckout}
                                className="w-full py-4 bg-primary hover:bg-orange-600 text-white font-black text-[14px] rounded-2xl transition-all shadow-md active:scale-98 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>결제 및 광고 배포 진행 중...</>
                                ) : (
                                    <>
                                        결제 및 광고 게재 신청하기 <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
