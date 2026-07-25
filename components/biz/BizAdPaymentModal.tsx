'use client';

import React, { useState, useEffect } from 'react';
import { Crown, X, Eye, DollarSign, Loader2, Clock, Zap, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdFormData } from '@/components/biz/AdEditorForm';
import { PremiumJobCard } from '@/components/home/premium-job-card';
import { getUserPointsAction } from '@/app/actions/pointActions';
import { manageBizAdAction, getActiveFixedAdCountAction } from '@/lib/actions';
import { GET_POINT_POLICIES } from '@/app/actions/pointPolicyActions';
import { createInquiry } from '@/lib/actions/help';

interface BizAdPaymentModalProps {
    initialData: Partial<AdFormData> & { isPaid?: boolean; is_fixed?: boolean };
    jobId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function BizAdPaymentModal({ initialData, jobId, onClose, onSuccess }: BizAdPaymentModalProps) {
    const [saving, setSaving] = useState(false);
    const [submittingInquiry, setSubmittingInquiry] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('가게 폐업');
    const [cancelDetail, setCancelDetail] = useState('');
    const [userPoints, setUserPoints] = useState<number>(0);
    const [loadingPoints, setLoadingPoints] = useState(true);
    const [policies, setPolicies] = useState<Record<string, number>>({});
    const [fixedAdCount, setFixedAdCount] = useState<number>(0); // 현재 활성 고정 배너 수

    const [form, setForm] = useState<Partial<AdFormData> & { option_fixed?: boolean }>({
        ...initialData,
        exposure_period: initialData.exposure_period || 30,
        is_subscription: initialData.is_subscription || false,
        option_double_slot: initialData.option_double_slot || false,
        option_fixed: initialData.is_fixed || false,
        option_highlight: false
    });

    // 이미 결제되어 진행 중인 광고일 때 추가 연장할 기간 상태 (null = 연장 안 함)
    const [selectedExtensionPeriod, setSelectedExtensionPeriod] = useState<number | 'sub' | null>(null);

    const update = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    // 실시간 정산 명세서 (더블 슬롯 중도 취소에 대한 정보)
    const getRefundDetails = () => {
        if (!isAlreadyPaid) return null;
        const p = form.exposure_period || 30;
        const optionBase = form.option_fixed 
            ? (policies['OPTION_PRICE_SIDE_FIXED_' + p] || (getBasePrice(p) * 3))
            : getBasePrice(p);

        // 기존에 연속 노출(더블 슬롯)이 켜져 있었는데 사용자가 끈 경우
        if (initialData.option_double_slot && !form.option_double_slot) {
            const refundAmount = Math.floor(optionBase * prorationRatio);
            return {
                type: 'DOUBLE_SLOT_CANCEL',
                label: '연속 노출 옵션 도중 해지 반환',
                basePrice: optionBase,
                refundAmount,
                remainingDays,
                totalDays: p
            };
        }
        return null;
    };

    // 요금제 가격 차이를 이용해 60일/90일 할인율을 동적으로 역산하는 헬퍼 함수
    const getAdDiscountPercent = (days: number) => {
        const price30 = getBasePrice(30);
        if (price30 <= 0) return 0;
        
        const pricePeriod = getBasePrice(days);
        if (pricePeriod <= 0) return 0;

        const months = days / 30;
        const originalPrice = price30 * months;
        const discountRatio = ((originalPrice - pricePeriod) / originalPrice) * 100;
        return Math.round(discountRatio);
    };

    // 이미 결제되어 진행 중인 광고인지 판별
    const isAlreadyPaid = initialData.isPaid === true && initialData.expires_at && new Date(initialData.expires_at).getFullYear() !== 2000;
    
    // 남은 일수 및 비율 구하기
    const now = new Date();
    const expiresAt = initialData.expires_at ? new Date(initialData.expires_at) : null;
    const remainingDays = expiresAt && expiresAt > now 
        ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
    const prorationRatio = isAlreadyPaid && remainingDays > 0 
        ? Math.min(1, remainingDays / (form.exposure_period || 30))
        : 1;

    // 결제일(생성일) 기준 5일(120시간) 이내 여부 계산
    const createdAt = initialData.created_at ? new Date(initialData.created_at) : null;
    const daysSinceCreated = createdAt 
        ? (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24) 
        : 0;
    const isWithin5Days = createdAt ? daysSinceCreated <= 5 : true;

    // 환불 계산 로직
    const totalPoints = initialData.total_points || 0;
    const exposurePeriod = form.exposure_period || 30;
    const baseRefundPoints = Math.floor(totalPoints * (remainingDays / exposurePeriod));
    const finalRefundPoints = Math.floor(baseRefundPoints * 0.9);

    const handleCancelRequest = () => {
        setIsCancelModalOpen(true);
    };

    const handleFinalCancelSubmit = async () => {
        if (!isWithin5Days) {
            alert('결제일로부터 5일이 경과한 광고는 취소/철회가 불가능합니다.');
            return;
        }

        if (cancelReason === '기타' && !cancelDetail.trim()) {
            alert('상세 취소 사유를 입력해 주세요.');
            return;
        }

        const companyName = form.company_name || form.company || form.business_name || '업체명 없음';
        const adTitle = form.title || '광고 제목 없음';
        const tier = form.tier || 'GENERAL';

        setSubmittingInquiry(true);
        try {
            const res = await createInquiry({
                category: '포인트·환불',
                title: `[광고 결제 취소 요청] ${companyName} - ${adTitle}`,
                content: `안녕하세요. 광고 결제 취소 및 환불 처리를 요청합니다.

[광고 정보]
- 광고 ID: ${jobId}
- 업체명: ${companyName}
- 광고 제목: ${adTitle}
- 광고 등급(Tier): ${tier}
- 등록일시: ${initialData.created_at ? new Date(initialData.created_at).toLocaleString() : '확인 불가'}
- 만료일시: ${initialData.expires_at ? new Date(initialData.expires_at).toLocaleString() : '확인 불가'}

[환불 정책 계산 내역]
- 원래 결제 포인트: ${totalPoints.toLocaleString()} P
- 광고 노출 기간: ${exposurePeriod}일
- 남은 노출 일수: ${remainingDays}일
- 일할 계산 잔여액: ${baseRefundPoints.toLocaleString()} P
- 10% 수수료 차감액: -${Math.floor(baseRefundPoints * 0.1).toLocaleString()} P
- 예상 반환 포인트 (최종): ${finalRefundPoints.toLocaleString()} P

[취소 및 환불 사유]
- 사유 유형: ${cancelReason}
- 상세 내용: 
${cancelDetail || '상세 사유 미기재'}

위 내용을 확인 후 환불(포인트 반환) 및 광고 중단 처리를 진행해 주시기 바랍니다.`
            });

            if (res.success) {
                alert('결제 취소/철회 문의가 정상적으로 접수되었습니다. 담당자 확인 후 신속히 처리해 드리겠습니다.');
                setIsCancelModalOpen(false);
                onClose();
            } else {
                alert(`문의 접수에 실패했습니다: ${res.message}`);
            }
        } catch (error: any) {
            console.error('취소 문의 접수 중 오류 발생:', error);
            alert('오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setSubmittingInquiry(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
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

                // 고정 배너 개수 조회
                const fixedRes = await getActiveFixedAdCountAction();
                if (fixedRes.success) {
                    setFixedAdCount(fixedRes.count);
                }
            } catch (err) {
                console.error("데이터 로드 실패", err);
            } finally {
                setLoadingPoints(false);
            }
        };
        loadData();
    }, []);

    const getBasePrice = (period: number) => {
        const tier = form.tier || 'GENERAL';
        return policies[`TIER_PRICE_${tier}_${period}`] || 0;
    };


    
    const calculateTotalPoints = () => {
        const p = form.exposure_period || 30;
        const doubleDiscount = policies['DISCOUNT_RATIO_BIZ_DOUBLE_SLOT'] !== undefined ? policies['DISCOUNT_RATIO_BIZ_DOUBLE_SLOT'] : 5;
        const fixedPrice = policies['OPTION_PRICE_SIDE_FIXED_' + p] || (getBasePrice(p) * 3);

        if (isAlreadyPaid) {
            // ─── [도중 옵션 추가 결제: 일할 계산 모드] ───
            let additionalCost = 0;

            // 1. 연속 노출 옵션 추가 구매 (기존에 안 샀는데 새로 선택한 경우)
            if (form.option_double_slot && !initialData.option_double_slot) {
                const optionBase = form.option_fixed ? fixedPrice : getBasePrice(p);
                const doubleCost = Math.floor(optionBase * ((100 - doubleDiscount) / 100));
                additionalCost += Math.floor(doubleCost * prorationRatio);
            }

            // 1-2. 연속 노출 옵션 도중 해지/취소 (기존에 샀는데 체크를 해제한 경우)
            if (initialData.option_double_slot && !form.option_double_slot) {
                const optionBase = form.option_fixed ? fixedPrice : getBasePrice(p);
                const doubleRefund = Math.floor(optionBase * prorationRatio);
                additionalCost -= doubleRefund;
            }

            // 2. 고정 노출 옵션 추가 구매 (기존에 안 샀는데 새로 선택한 경우)
            if (form.option_fixed && !initialData.is_fixed) {
                const base = getBasePrice(p);
                const upgradeDiff = Math.max(0, fixedPrice - base);
                additionalCost += Math.floor(upgradeDiff * prorationRatio);
            }

            // 3. 도중 기간 추가 연장 구매 (선택했을 경우)
            if (selectedExtensionPeriod !== null) {
                const prevDays = initialData.exposure_period || 30;
                const extDays = selectedExtensionPeriod === 'sub' ? 30 : selectedExtensionPeriod;

                if (extDays > prevDays) {
                    const deltaDays = extDays - prevDays;
                    const extBasePrice = getBasePrice(extDays);
                    const extFixedPrice = policies['OPTION_PRICE_SIDE_FIXED_' + extDays] || (extBasePrice * 3);

                    const unitBase = (form.option_fixed ? extFixedPrice : extBasePrice) / extDays;
                    let unitTotal = unitBase;

                    if (selectedExtensionPeriod === 'sub') {
                        unitTotal = unitTotal * 0.95;
                    }

                    if (form.option_double_slot) {
                        unitTotal = unitTotal * 2 * ((100 - doubleDiscount) / 100);
                    }

                    const extCost = Math.floor(unitTotal * deltaDays);
                    additionalCost += extCost;
                }
            }

            return additionalCost;
        } else {
            // ─── [일반 신규 결제 / 기간 만료 후 연장 모드] ───
            let base = form.option_fixed ? fixedPrice : getBasePrice(p);
            let total = base;
            
            if (form.is_subscription) {
                total = Math.floor(total * 0.95);
            }

            if (form.option_double_slot) {
                total *= 2;
            }

            if (form.option_double_slot) {
                total = Math.floor(total * ((100 - doubleDiscount) / 100));
            }

            return total;
        }
    };
    
    // 추가 결제할 금액이 있는지 판별 (도중 추가 결제일 경우)
    const isProratedUpgrade = isAlreadyPaid && calculateTotalPoints() > 0;

    const handleFinalSubmit = async () => {
        setSaving(true);
        try {
            const finalForm = {
                ...form,
                is_fixed: form.option_fixed,
                option_highlight: false,
                _isPayment: true,
                is_extension: !isAlreadyPaid || (isAlreadyPaid && selectedExtensionPeriod !== null),
                exposure_period: isAlreadyPaid && selectedExtensionPeriod ? ((selectedExtensionPeriod === 'sub' ? 30 : selectedExtensionPeriod) as 30 | 60 | 90) : (form.exposure_period || 30),
                is_subscription: isAlreadyPaid && selectedExtensionPeriod ? (selectedExtensionPeriod === 'sub') : !!form.is_subscription
            };
            const res = await manageBizAdAction('UPDATE', finalForm, jobId);
            if (!res.success) {
                throw new Error(res.message);
            }
            onSuccess();
        } catch (err: any) {
            console.error("결제 처리 중 오류", err);
            alert(err?.message || "결제 처리 중 오류가 발생했습니다.");
        } finally {
            setSaving(false);
        }
    };

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + (form.exposure_period || 30));

    const getTierName = () => {
        const t = form.tier || 'GENERAL';
        const m: Record<string,string> = {
            PREMIUM: '프리미엄 배너',
            SIDE: '사이드 배너',
            SPECIAL: '스페셜 배너',
            GENERAL: '일반 배너',
            AD_GENERAL: '배너(일반)'
        };
        return m[t] || t;
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center justify-center p-4" onClick={onClose}>
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-3xl flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
                <div className="w-full flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-white shrink-0">
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Crown className="w-6 h-6 text-yellow-500" /> 광고(배너) 노출 옵션 선택
                    </h3>
                    <button
                        onClick={onClose}
                        className="focus:outline-none focus-visible:outline-none focus:ring-0 shrink-0"
                    >
                        <span className="hidden md:flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
                            <X className="w-5 h-5" />
                        </span>
                        <span className="md:hidden inline-block px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 hover:text-gray-900 rounded-full text-[12px] font-black transition-all">
                            닫기
                        </span>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6 md:gap-8 bg-gray-50/50">
                    {/* 1. 배너 라이브 프리뷰 */}
                    <div className="w-full shrink-0 flex flex-col gap-4">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> 라이브 프리뷰 (배너 노출 화면)</h4>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative p-6 flex flex-col items-center justify-center min-h-[180px] bg-slate-50">
                            <span className="absolute top-3 left-3 bg-gray-900 text-white text-[11px] px-2 py-0.5 rounded shadow-sm font-black z-10">{getTierName()}</span>
                            
                            <div className={`w-full flex justify-center items-center ${form.option_double_slot ? 'flex-row flex-wrap gap-4' : ''}`}>
                                {(() => {
                                    const isPremiumMain = form.tier === 'PREMIUM_MAIN';
                                    const isSide = form.tier === 'SIDE';
                                    const isGeneral = form.tier === 'GENERAL' || form.tier === 'AD_GENERAL';
                                    const isSpecial = form.tier === 'SPECIAL';

                                    // 1) PREMIUM_MAIN (상단 고정 배너 메인)일 때
                                    if (isPremiumMain) {
                                        // PREMIUM_MAIN 이면서 직접 업로드 모드이거나 이미지가 등록된 경우
                                        if (form.premium_banner_mode === 'upload' && form.image) {
                                            return (
                                                <div className="w-[400px] max-w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-md border border-gray-200">
                                                    <img src={form.image} alt="배너 이미지" className="w-full h-full object-cover" />
                                                </div>
                                            );
                                        }

                                        // 템플릿 모드 및 기본 메인 배너 카드
                                        const hasLogo = !!(form.logo_url || form.image);
                                        const logoUrl = form.logo_url || form.image;
                                        
                                        let payType = '';
                                        let payAmount = form.pay || (form.salary_type ? `[${form.salary_type}] ${form.salary_amount}` : form.salary_amount) || (form.pay_amount ? `${form.pay_type} ${form.pay_amount}` : '급여 정보');
                                        if (typeof payAmount === 'string' && payAmount.includes(']') && payAmount.startsWith('[')) {
                                            const splitIndex = payAmount.indexOf(']');
                                            payType = payAmount.substring(1, splitIndex).trim();
                                            payAmount = payAmount.substring(splitIndex + 1).trim();
                                        } else if (payAmount === '추후협의') {
                                            payType = '협의';
                                            payAmount = '추후협의';
                                        } else {
                                            const parts = String(payAmount).split(' ');
                                            if (parts.length > 1 && ['시급', '일급', '주급', '월급', '건당', '협의', '기타'].includes(parts[0])) {
                                                payType = parts[0];
                                                payAmount = parts.slice(1).join(' ');
                                            }
                                        }

                                        const themeMap: Record<string, string> = {
                                            gold: 'from-yellow-900 via-orange-900 to-black',
                                            platinum: 'from-slate-700 via-gray-900 to-black',
                                            diamond: 'from-cyan-900 via-blue-900 to-black',
                                            ruby: 'from-rose-900 via-red-900 to-black',
                                            sapphire: 'from-blue-900 via-indigo-900 to-black',
                                            emerald: 'from-emerald-900 via-green-900 to-black',
                                            amethyst: 'from-purple-900 via-fuchsia-900 to-black',
                                            obsidian: 'from-gray-900 via-black to-black'
                                        };
                                        const bgGradient = form.theme && form.theme !== 'none' && themeMap[form.theme] 
                                            ? `bg-gradient-to-br ${themeMap[form.theme]}` 
                                            : 'bg-gradient-to-br from-indigo-900 via-purple-900 to-black';

                                        return (
                                            <div className="flex justify-center w-full">
                                                <div className={`flex-shrink-0 w-[400px] max-w-full h-[180px] rounded-2xl ${bgGradient} p-5 shadow-md relative overflow-hidden group`}>
                                                    {form.image && form.premium_banner_mode !== 'upload' && (
                                                        <div 
                                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 mix-blend-overlay opacity-60"
                                                            style={{ backgroundImage: `url(${form.image})` }}
                                                        />
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
                                                    <div className="relative z-20 h-full flex flex-col justify-between">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                {hasLogo && (
                                                                    <div className="w-[50px] h-[34px] bg-white rounded-md p-1 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
                                                                        <div className="w-full h-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${logoUrl})` }} />
                                                                    </div>
                                                                )}
                                                                <h3 className="text-white font-black text-xl line-clamp-1 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                                                    {form.company_name || form.company || form.business_name || '테스트상호'}
                                                                </h3>
                                                            </div>
                                                            <p className="text-white/95 text-sm font-bold line-clamp-2 max-w-[95%] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-snug">
                                                                {form.title || '배너 제목이 표시됩니다'}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col gap-1 mt-auto">
                                                            <p className="text-white/70 text-[10px] font-bold tracking-wider">{form.location || '지역'}</p>
                                                            <div className="flex items-center gap-1.5">
                                                                {payType && (
                                                                    <span className="px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-md text-white text-[10px] font-black tracking-wide border border-white/10 shadow-sm">
                                                                        {payType}
                                                                    </span>
                                                                )}
                                                                <span className="text-white font-black text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                                                                    {payAmount}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // 2) SIDE / PREMIUM / GENERAL 등 기타 배너
                                    const renderCard = (keyPostfix: string) => (
                                        <div key={`preview-${keyPostfix}`} style={{ width: (isSide ? '150px' : '200px'), maxWidth: '100%', opacity: keyPostfix === 'double' ? 0.9 : 1 }}>
                                            <PremiumJobCard
                                                id={`preview-${keyPostfix}`}
                                                company={form.company_name || form.company || form.business_name || '테스트상호'}
                                                title={form.title || '배너 제목이 표시됩니다'}
                                                location={form.location || '지역'}
                                                category={form.category1 || form.category || '일반'}
                                                pay={form.pay || (form.salary_type ? `[${form.salary_type}] ${form.salary_amount}` : form.salary_amount) || (form.pay_amount ? `${form.pay_type} ${form.pay_amount}` : '급여 협의')}
                                                image={form.logo_url || form.image}
                                                impactType={isGeneral ? 'none' : (form.option_highlight ? ((form.theme as any) || 'gold') : 'none')}
                                                effectIntensity={
                                                    isSpecial || isGeneral || !form.option_highlight || (form.outer_action_type === 'none' && form.inner_action_type === 'none')
                                                        ? 'none'
                                                        : `${form.effect_intensity || 'medium'}::${form.outer_action_type || 'none'}::${form.inner_action_type || 'none'}`
                                                }
                                                isSide={isSide}
                                                hideLogo={isGeneral}
                                                tier={form.tier as any}
                                                customColor={form.color}
                                                bgOpacity={form.bg_opacity}
                                            />
                                        </div>
                                    );

                                    return (
                                        <>
                                            {renderCard('main')}
                                            {form.option_double_slot && renderCard('double')}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                        
                        <div className="text-[12px] text-gray-400 text-center bg-gray-100/50 py-2 rounded-lg">
                            실제 화면에서는 영역 비율에 맞게 조정되어 노출됩니다.
                        </div>
                    </div>

                    {/* 2. 노출 기간 패키지 */}
                    <div className="w-full flex flex-col gap-4">
                        <section>
                            <h4 className="text-[15px] font-black text-gray-800 mb-3 flex items-center justify-between">
                                <span>1. 노출 기간 선택 (필수)</span>
                                <span className="text-[12px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">장기 결제 시 최대 20% 할인!</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 30, label: '30일', sub: false },
                                    { id: 60, label: '60일', sub: false },
                                    { id: 90, label: '90일', sub: false },
                                    { id: 'sub', label: '매월 자동 연장 (구독)', sub: true },
                                ].map(opt => {
                                    // 현재 결제되어 이미 사용 중인 기간인지 여부 판별
                                    const isCurrentlyActive = isAlreadyPaid && (
                                        opt.sub 
                                            ? !!initialData.is_subscription 
                                            : (!initialData.is_subscription && initialData.exposure_period === opt.id)
                                    );

                                    const isSelected = isAlreadyPaid 
                                        ? (selectedExtensionPeriod === null 
                                            ? isCurrentlyActive 
                                            : (opt.sub ? selectedExtensionPeriod === 'sub' : selectedExtensionPeriod === opt.id))
                                        : (opt.sub ? form.is_subscription : (!form.is_subscription && form.exposure_period === opt.id));
                                    const days = opt.sub ? 30 : opt.id as number;
                                    let price = getBasePrice(days);
                                    if (opt.sub) price = Math.floor(price * 0.95);

                                    return (
                                        <button 
                                            key={opt.id}
                                            type="button"
                                            onClick={() => {
                                                if (isAlreadyPaid) {
                                                    // 토글 방식으로 동작 (기존 이용 중인 카드 누르면 연장 취소)
                                                    const clickedActive = opt.sub ? (selectedExtensionPeriod === 'sub') : (selectedExtensionPeriod === opt.id);
                                                    if (clickedActive || isCurrentlyActive) {
                                                        setSelectedExtensionPeriod(null);
                                                    } else {
                                                        setSelectedExtensionPeriod(opt.id as any);
                                                    }
                                                } else {
                                                    if (opt.sub) {
                                                        update('is_subscription', true);
                                                        update('exposure_period', 30);
                                                    } else {
                                                        update('is_subscription', false);
                                                        update('exposure_period', opt.id as 30|60|90);
                                                    }
                                                }
                                            }}
                                            className={`flex justify-between items-center p-4 rounded-xl border-2 transition-all text-left outline-none cursor-pointer ${
                                                isSelected 
                                                    ? 'border-primary bg-primary/5 shadow-sm font-bold' 
                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[14px] font-black text-gray-900">{opt.label}</span>
                                                    {isCurrentlyActive && (
                                                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                                                            이용 중
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] font-medium text-gray-400 mt-0.5">
                                                    {opt.sub ? '30일마다 5%씩 자동 누적할인' : '기본 요금 결제'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                {opt.sub && <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">최대 15% 할인</span>}
                                                {!opt.sub && days === 60 && getAdDiscountPercent(60) > 0 && <span className="text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded">{getAdDiscountPercent(60)}% OFF</span>}
                                                {!opt.sub && days === 90 && getAdDiscountPercent(90) > 0 && <span className="text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded">{getAdDiscountPercent(90)}% OFF</span>}
                                                <span className="text-[14px] font-bold text-gray-500">{price.toLocaleString()} P</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {isAlreadyPaid && (
                                <div className="mt-2.5 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-[12px] font-bold text-indigo-700 text-center animate-in fade-in slide-in-from-top-2">
                                    💡 현재 광고가 활성화되어 진행 중입니다. (남은 일수: {remainingDays}일) 추가로 연장할 노출 기간을 위에서 선택할 수 있습니다.
                                </div>
                            )}

                            {form.is_subscription && (
                                <div className="mt-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
                                    <p className="text-[13px] font-bold text-blue-800 mb-3 flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-blue-500" />
                                        자동연장 유지 기간에 따른 놀라운 할인 혜택!
                                    </p>
                                    <div className="grid grid-cols-3 gap-1.5 text-center">
                                        {[
                                            { m: '첫째 달', d: '5% 할인' },
                                            { m: '둘째 달 (2회차)', d: '10% 할인' },
                                            { m: '셋째 달 이상 (3회차~)', d: '15% 할인 (최대)' },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex flex-col bg-white border border-blue-100 rounded py-2">
                                                <span className="text-[10px] text-gray-500 font-bold">{item.m}</span>
                                                <span className="text-[12.5px] font-black text-blue-600 mt-0.5">{item.d}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-2 text-center">* 매 30일(자동 연장)마다 5%씩 추가 적용되어 최대 15%까지 상시 할인됩니다.</p>
                                </div>
                            )}
                        </section>
                        
                        {/* 부가 옵션 선택 */}
                        <section className="mt-4">
                            <h4 className="text-[15px] font-black text-gray-800 mb-3 flex items-center justify-between">
                                <span>2. 주목도 100배! 부가 옵션</span>
                                {isAlreadyPaid ? (
                                    <span className="text-[11.5px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                        💡 남은 기간 ({remainingDays}일) 일할 계산 적용 중
                                    </span>
                                ) : (
                                    <span className="text-[12px] font-medium text-gray-400">선택한 기간({form.exposure_period}일) 내내 유지</span>
                                )}
                            </h4>
                            <div className="flex flex-col gap-3">
                                {/* 연속 노출 (더블 슬롯) */}
                                {(() => {
                                    const p = form.exposure_period || 30;
                                    const doubleDiscount = policies['DISCOUNT_RATIO_BIZ_DOUBLE_SLOT'] !== undefined ? policies['DISCOUNT_RATIO_BIZ_DOUBLE_SLOT'] : 5;
                                    const optionBase = form.option_fixed ? (policies['OPTION_PRICE_SIDE_FIXED_' + p] || (getBasePrice(p) * 3)) : getBasePrice(p);
                                    const doubleCost = Math.floor(optionBase * ((100 - doubleDiscount) / 100));
                                    const proratedCost = Math.floor(doubleCost * prorationRatio);

                                    const isPurchased = !!initialData.option_double_slot;

                                    return (
                                        <div 
                                            className={`flex flex-col p-4 rounded-xl border-2 transition-all select-none cursor-pointer hover:border-gray-300 ${
                                                form.option_double_slot ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 bg-white'
                                            }`} 
                                            onClick={() => { 
                                                update('option_double_slot', !form.option_double_slot); 
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${form.option_double_slot ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                        <Layers className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h5 className="font-black text-[14px] text-gray-900">연속 노출 (더블 슬롯)</h5>
                                                            {isPurchased && (
                                                                <span className="text-[10px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">적용 중</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[12px] font-medium text-gray-500">배너 2칸을 나란히 차지하여 압도적인 시선 강탈!</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[14px] font-black text-indigo-600">
                                                        {isPurchased && !form.option_double_slot ? (
                                                            <span className="text-emerald-600">해지 (환불 예정)</span>
                                                        ) : (
                                                            isAlreadyPaid && !isPurchased ? `+${proratedCost.toLocaleString()} P` : `총 결제액 ${doubleDiscount}% 할인`
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] font-medium text-gray-400">
                                                        {isAlreadyPaid && !isPurchased ? `(원가 ${doubleCost.toLocaleString()} P)` : '(기본 요금 2배 부과)'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                                
                                {/* 스마트 고정 노출 (Fix Slot) - 사이드 배너 전용 */}
                                {form.tier === 'SIDE' && (() => {
                                    const maxFixedSlots = policies['LIMIT_SIDE_FIXED_SLOTS'] || 4;
                                    const isLimitReached = fixedAdCount >= maxFixedSlots;
                                    const isPurchased = !!initialData.is_fixed;
                                    const isSelectDisabled = isLimitReached && !isPurchased;

                                    const period = form.exposure_period || 30;
                                    const fixedPrice = policies['OPTION_PRICE_SIDE_FIXED_' + period] || (getBasePrice(period) * 3);
                                    const base = getBasePrice(period);
                                    const upgradeDiff = Math.max(0, fixedPrice - base);
                                    const proratedCost = Math.floor(upgradeDiff * prorationRatio);

                                    const fixedRatio = base > 0 ? Math.round(fixedPrice / base) : 3;

                                    return (
                                        <div 
                                            className={`flex flex-col p-4 rounded-xl border-2 transition-all select-none ${
                                                form.option_fixed ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 bg-white'
                                            } ${
                                                isPurchased || isSelectDisabled 
                                                    ? 'opacity-70 bg-gray-50/50 cursor-not-allowed' 
                                                    : 'cursor-pointer hover:border-gray-300'
                                            }`} 
                                            onClick={() => { 
                                                if (isPurchased) return;
                                                if (isSelectDisabled) {
                                                    alert(`죄송합니다. 사이드 배너 고정 옵션은 선착순 ${maxFixedSlots}구좌가 모두 마감되었습니다.`);
                                                    return;
                                                }
                                                update('option_fixed', !form.option_fixed); 
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${form.option_fixed ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                        <Zap className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h5 className="font-black text-[14px] text-gray-900">스마트 고정 노출 (Fix Slot)</h5>
                                                            {isPurchased && (
                                                                <span className="text-[10px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">적용 중</span>
                                                            )}
                                                            {!isPurchased && isLimitReached && (
                                                                <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
                                                                    선착순 마감 ({fixedAdCount}/{maxFixedSlots})
                                                                </span>
                                                            )}
                                                            {!isPurchased && !isLimitReached && (
                                                                <span className="text-[10px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-full border border-green-200">
                                                                    신청 가능 ({fixedAdCount}/{maxFixedSlots})
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[12px] font-medium text-gray-500">배너 명당 영역에 상시 고정 노출! (롤링 제외)</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[14px] font-black text-indigo-600">
                                                        {isAlreadyPaid && !isPurchased ? `+${proratedCost.toLocaleString()} P` : `${fixedPrice.toLocaleString()} P`}
                                                    </div>
                                                    <div className="text-[11px] font-medium text-gray-400">
                                                        {isAlreadyPaid && !isPurchased ? `(업그레이드 단가 차액)` : `(${fixedRatio}배 단가 적용)`}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </section>
                    </div>
                </div>

                {/* 정산 영수증 명세서 표출부 */}
                {(() => {
                    const refund = getRefundDetails();
                    if (!refund) return null;
                    return (
                        <div className="mx-6 mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-[12.5px] font-bold text-emerald-800 space-y-1.5 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-1.5 text-[13px] font-black text-emerald-950 mb-1">
                                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                                💡 옵션 변경 실시간 정산 계산서
                            </div>
                            <div className="flex justify-between items-center">
                                <span>{refund.label}</span>
                                <span className="text-emerald-700 text-[14px] font-black">+{refund.refundAmount.toLocaleString()} P 환급 예정</span>
                            </div>
                            <div className="text-[11px] text-emerald-600 font-bold leading-relaxed">
                                * 계산식: 연속 노출 할인 전 기본 요금 ({refund.basePrice.toLocaleString()} P) &times; 잔여 노출 비율 ({refund.remainingDays}일 / {refund.totalDays}일)
                            </div>
                        </div>
                    );
                })()}

                {/* 하단 결제 정보 바 */}
                <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            {isAlreadyPaid 
                                ? (calculateTotalPoints() < 0 ? "차액 반환 예정 포인트" : "추가 결제할 포인트 (남은 기간 일할)") 
                                : "총 결제할 포인트"
                            }
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className={`text-[24px] font-black ${calculateTotalPoints() < 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                                {calculateTotalPoints() < 0 
                                    ? `+${Math.abs(calculateTotalPoints()).toLocaleString()}` 
                                    : `${calculateTotalPoints().toLocaleString()}`
                                } P
                            </span>
                            <span className="text-[11.5px] font-bold text-gray-400">
                                / 내 잔여 포인트: {loadingPoints ? '...' : `${userPoints.toLocaleString()} P`}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {isAlreadyPaid ? (
                            calculateTotalPoints() > 0 ? (
                                <>
                                    <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none h-14 px-6 rounded-xl font-bold text-[15px] border-gray-300">
                                        닫기
                                    </Button>
                                    {calculateTotalPoints() > userPoints && !loadingPoints && (
                                        <Button 
                                            onClick={() => window.location.href = '/biz/points'} 
                                            className="flex-1 sm:flex-none h-14 px-8 rounded-xl font-black text-[16px] shadow-xl bg-orange-500 hover:bg-orange-600 text-white"
                                        >
                                            포인트 충전하기
                                        </Button>
                                    )}
                                    <Button 
                                        onClick={handleFinalSubmit} 
                                        disabled={saving || loadingPoints || calculateTotalPoints() > userPoints} 
                                        className="flex-1 sm:flex-none h-14 px-8 rounded-xl font-black text-[16px] shadow-xl bg-gray-900 hover:bg-black text-white"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <DollarSign className="w-5 h-5 mr-2" />}
                                        추가 옵션 결제하기
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none h-14 px-6 rounded-xl font-bold text-[15px] border-gray-300">
                                        닫기
                                    </Button>
                                    {calculateTotalPoints() > userPoints && !loadingPoints && (
                                        <Button 
                                            onClick={() => window.location.href = '/biz/points'} 
                                            className="flex-1 sm:flex-none h-14 px-8 rounded-xl font-black text-[16px] shadow-xl bg-orange-500 hover:bg-orange-600 text-white"
                                        >
                                            포인트 충전하기
                                        </Button>
                                    )}
                                    <Button 
                                        onClick={handleCancelRequest} 
                                        disabled={submittingInquiry || saving}
                                        className="flex-1 sm:flex-none h-14 px-8 rounded-xl font-black text-[15px] shadow-sm bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                    >
                                        {submittingInquiry ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                        결제 취소/철회 문의
                                    </Button>
                                </>
                            )
                        ) : (
                            <>
                                <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none h-14 px-6 rounded-xl font-bold text-[15px] border-gray-300">
                                    취소
                                </Button>
                                {calculateTotalPoints() > userPoints && !loadingPoints && (
                                    <Button 
                                        onClick={() => window.location.href = '/biz/points'} 
                                        className="flex-1 sm:flex-none h-14 px-8 rounded-xl font-black text-[16px] shadow-xl bg-orange-500 hover:bg-orange-600 text-white"
                                    >
                                        포인트 충전하기
                                    </Button>
                                )}
                                <Button 
                                    onClick={handleFinalSubmit} 
                                    disabled={saving || loadingPoints || calculateTotalPoints() > userPoints} 
                                    className="flex-1 sm:flex-none h-14 px-8 rounded-xl font-black text-[16px] shadow-xl bg-gray-900 hover:bg-black text-white"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <DollarSign className="w-5 h-5 mr-2" />}
                                    결제 및 최종 등록하기
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                
                {/* 광고취소 신청 모달 */}
                {isCancelModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
                            {/* 헤더 */}
                            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                                    <span className="text-red-500 font-extrabold">⚠️</span> 광고 취소/철회
                                </h3>
                                <button onClick={() => setIsCancelModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            {/* 본문 */}
                            <div className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
                                {!isWithin5Days ? (
                                    <div className="flex flex-col items-center text-center py-4 gap-3">
                                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center font-bold text-2xl">⚠️</div>
                                        <h4 className="font-bold text-gray-900 text-[16px]">결제 취소 기간 만료</h4>
                                        <p className="text-[13px] text-gray-500 leading-relaxed">
                                            광고 취소 및 철회는 결제일로부터 <span className="font-bold text-red-500">5일 이내</span>에만 접수하실 수 있습니다.<br />
                                            현재 이 광고는 결제 후 5일이 경과하여 자동 취소가 제한됩니다.<br />
                                            기타 특별한 사정은 고객센터로 직접 문의해 주시기 바랍니다.
                                        </p>
                                        <Button onClick={() => setIsCancelModalOpen(false)} className="w-full mt-4 h-12 rounded-xl bg-gray-900 text-white font-bold">
                                            확인
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-blue-50 text-blue-800 rounded-xl p-4 text-[12px] font-medium leading-relaxed">
                                            💡 광고 취소는 결제 후 5일 이내에만 접수 가능합니다. 남은 일수만큼 일할 정산되며, <strong>정산된 포인트의 10% 위약 수수료</strong>가 공제된 후 잔여 포인트가 반환됩니다.
                                        </div>
                                        
                                        {/* 예상 환불 금액 계산 테이블 */}
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-2.5">
                                            <h4 className="font-bold text-[13px] text-gray-700">예상 환불 포인트</h4>
                                            <div className="flex justify-between items-center text-[12px] text-gray-500">
                                                <span>원래 결제 포인트</span>
                                                <span className="font-semibold text-gray-700">{totalPoints.toLocaleString()} P</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[12px] text-gray-500">
                                                <span>광고 노출 일수</span>
                                                <span className="font-semibold text-gray-700">{exposurePeriod}일 중 {exposurePeriod - remainingDays}일 노출</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[12px] text-gray-500">
                                                <span>남은 노출 일수</span>
                                                <span className="font-semibold text-gray-700">{remainingDays}일</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[12px] text-gray-500">
                                                <span>일할 정산 포인트</span>
                                                <span className="font-semibold text-gray-700">{baseRefundPoints.toLocaleString()} P</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[12px] text-red-500">
                                                <span>취소 운영 수수료 (10%)</span>
                                                <span className="font-semibold">-{Math.floor(baseRefundPoints * 0.1).toLocaleString()} P</span>
                                            </div>
                                            <div className="h-px bg-gray-200 my-1" />
                                            <div className="flex justify-between items-center text-[13px] font-bold text-gray-900">
                                                <span>최종 예상 환불 포인트</span>
                                                <span className="text-primary text-[15px]">{finalRefundPoints.toLocaleString()} P</span>
                                            </div>
                                        </div>

                                        {/* 사유 선택 */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[12px] font-bold text-gray-600">취소 사유 선택 *</label>
                                            <select 
                                                value={cancelReason}
                                                onChange={(e) => setCancelReason(e.target.value)}
                                                className="w-full h-11 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:border-primary font-medium bg-white"
                                            >
                                                <option value="가게 폐업">🏢 가게 폐업</option>
                                                <option value="사업자 변경/양도">💼 사업자 변경 및 양도</option>
                                                <option value="단순 변심 및 광고 중단">🔄 단순 변심 및 광고 중단</option>
                                                <option value="기타">✏️ 기타 (직접 작성)</option>
                                            </select>
                                        </div>

                                        {/* 상세 작성 */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[12px] font-bold text-gray-600">상세 사유 {cancelReason === '기타' ? '*' : '(선택)'}</label>
                                            <textarea 
                                                value={cancelDetail}
                                                onChange={(e) => setCancelDetail(e.target.value)}
                                                placeholder="고객센터에 전달할 상세한 사유를 적어주세요."
                                                className="w-full h-24 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-primary font-medium resize-none"
                                            />
                                        </div>

                                        {/* 하단 버튼 */}
                                        <div className="flex gap-2.5 mt-2">
                                            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)} className="flex-1 h-12 rounded-xl font-bold border-gray-200">
                                                취소
                                            </Button>
                                            <Button 
                                                onClick={handleFinalCancelSubmit} 
                                                disabled={submittingInquiry}
                                                className="flex-1 h-12 rounded-xl font-black bg-indigo-600 hover:bg-indigo-700 text-white"
                                            >
                                                {submittingInquiry ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                                취소 문의 접수
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
