'use client';

import React, { useState, useEffect } from 'react';
import { Crown, X, Eye, DollarSign, Loader2, Clock, Zap, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdFormData } from '@/components/biz/AdEditorForm';
import { PremiumJobCard } from '@/components/home/premium-job-card';
import { getUserPointsAction } from '@/app/actions/pointActions';
import { manageBizAdAction, getActiveFixedAdCountAction } from '@/lib/actions';
import { GET_POINT_POLICIES } from '@/app/actions/pointPolicyActions';

interface BizAdPaymentModalProps {
    initialData: Partial<AdFormData> & { isPaid?: boolean; is_fixed?: boolean };
    jobId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function BizAdPaymentModal({ initialData, jobId, onClose, onSuccess }: BizAdPaymentModalProps) {
    const [saving, setSaving] = useState(false);
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
        option_highlight: initialData.option_highlight || false
    });

    const update = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
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
        let total = getBasePrice(p);
        
        if (form.is_subscription) {
            total = Math.floor(total * 0.95);
        }

        if (form.option_double_slot) {
            total *= 2;
        }

        if (form.option_fixed) {
            total *= 3; // 스마트 고정 노출 3배 단가 적용
        }

        if (form.option_highlight) {
            total += 30000; // 스페셜 테마 이펙트 30,000 P 추가
        }

        if (form.option_double_slot) {
            total = Math.floor(total * 0.95);
        }

        return total;
    };

    const handleFinalSubmit = async () => {
        setSaving(true);
        try {
            const finalForm = {
                ...form,
                is_fixed: form.option_fixed,
                option_highlight: form.option_highlight,
                _isPayment: true
            };
            const res = await manageBizAdAction('UPDATE', finalForm, jobId);
            if (!res.success) {
                throw new Error(res.message);
            }
            onSuccess();
        } catch (err) {
            console.error("결제 처리 중 오류", err);
            alert("결제 처리 중 오류가 발생했습니다.");
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
                                    const isSide = form.tier === 'SIDE';
                                    const isGeneral = form.tier === 'GENERAL' || form.tier === 'AD_GENERAL';
                                    const isSpecial = form.tier === 'SPECIAL';

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
                                                effectIntensity={isSpecial || isGeneral || !form.option_highlight || form.action_type === 'none' ? 'none' : `${form.effect_intensity || 'medium'}::${form.action_type || 'shimmer'}`}
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
                                    const isSelected = opt.sub ? form.is_subscription : (!form.is_subscription && form.exposure_period === opt.id);
                                    const days = opt.sub ? 30 : opt.id as number;
                                    let price = getBasePrice(days);
                                    if (opt.sub) price = Math.floor(price * 0.95);

                                    return (
                                        <button 
                                            key={opt.id}
                                            type="button"
                                            onClick={() => {
                                                if (initialData.isPaid) return;
                                                if (opt.sub) {
                                                    update('is_subscription', true);
                                                    update('exposure_period', 30);
                                                } else {
                                                    update('is_subscription', false);
                                                    update('exposure_period', opt.id as 30|60|90);
                                                }
                                            }}
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-gray-200 bg-white'} ${initialData.isPaid ? 'opacity-70 cursor-default' : 'hover:border-gray-300 cursor-pointer'}`}
                                        >
                                            <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                                {opt.sub && <Clock className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />}
                                                <span className={`text-[15px] font-black ${isSelected ? 'text-primary' : 'text-gray-700'}`}>{opt.label}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {opt.sub && <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">첫 달 5% 할인</span>}
                                                {!opt.sub && days === 60 && <span className="text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded">10% OFF</span>}
                                                {!opt.sub && days === 90 && <span className="text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded">20% OFF</span>}
                                                <span className="text-[14px] font-bold text-gray-500">{price.toLocaleString()} P</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {form.is_subscription && (
                                <div className="mt-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
                                    <p className="text-[13px] font-bold text-blue-800 mb-3 flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-blue-500" />
                                        구독 유지 기간에 따른 놀라운 추가 할인 혜택!
                                    </p>
                                    <div className="grid grid-cols-6 gap-1.5 text-center">
                                        {[
                                            { m: '1개월', d: '5%' },
                                            { m: '2개월', d: '10%' },
                                            { m: '3개월', d: '15%' },
                                            { m: '4개월', d: '20%' },
                                            { m: '5개월', d: '25%' },
                                            { m: '6개월~', d: '30%' },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex flex-col bg-white border border-blue-100 rounded py-2">
                                                <span className="text-[10px] text-gray-500">{item.m}</span>
                                                <span className="text-[12px] font-black text-blue-600">{item.d}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-2 text-center">* 위 할인은 결제 연장(갱신) 시점부터 자동으로 순차 적용됩니다.</p>
                                </div>
                            )}
                        </section>
                        
                        {/* 부가 옵션 선택 */}
                        <section className="mt-4">
                            <h4 className="text-[15px] font-black text-gray-800 mb-3 flex items-center justify-between">
                                <span>2. 주목도 100배! 부가 옵션</span>
                                <span className="text-[12px] font-medium text-gray-400">선택한 기간({form.exposure_period}일) 내내 유지</span>
                            </h4>
                            <div className="flex flex-col gap-3">
                                {/* 연속 노출 (더블 슬롯) */}
                                <div className={`flex flex-col p-4 rounded-xl border-2 transition-all select-none ${form.option_double_slot ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 bg-white'} ${initialData.isPaid ? 'opacity-70 cursor-default' : 'cursor-pointer hover:border-gray-300'}`} onClick={() => { if (!initialData.isPaid) update('option_double_slot', !form.option_double_slot); }}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${form.option_double_slot ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <Layers className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h5 className="font-black text-[14px] text-gray-900">연속 노출 (더블 슬롯)</h5>
                                                <p className="text-[12px] font-medium text-gray-500">배너 2칸을 나란히 차지하여 압도적인 시선 강탈!</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[14px] font-black text-indigo-600">총 결제액 5% 할인</div>
                                            <div className="text-[11px] font-medium text-gray-400">(기본 요금 2배 부과)</div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* 스마트 고정 노출 (Fix Slot) - 사이드 배너 전용 */}
                                {form.tier === 'SIDE' && (() => {
                                    const isLimitReached = fixedAdCount >= 4;
                                    const isAlreadyFixed = !!initialData.is_fixed;
                                    const isSelectDisabled = isLimitReached && !isAlreadyFixed;

                                    return (
                                        <div 
                                            className={`flex flex-col p-4 rounded-xl border-2 transition-all select-none ${
                                                form.option_fixed ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 bg-white'
                                            } ${
                                                initialData.isPaid || isSelectDisabled 
                                                    ? 'opacity-65 bg-gray-50/50 cursor-not-allowed' 
                                                    : 'cursor-pointer hover:border-gray-300'
                                            }`} 
                                            onClick={() => { 
                                                if (initialData.isPaid) return;
                                                if (isSelectDisabled) {
                                                    alert("죄송합니다. 사이드 배너 고정 옵션은 선착순 4구좌가 모두 마감되었습니다.");
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
                                                            {isLimitReached && (
                                                                <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
                                                                    선착순 마감 ({fixedAdCount}/4)
                                                                </span>
                                                            )}
                                                            {!isLimitReached && (
                                                                <span className="text-[10px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-full border border-green-200">
                                                                    신청 가능 ({fixedAdCount}/4)
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[12px] font-medium text-gray-500">배너 1~4번 명당 영역에 상시 고정 노출! (롤링 제외)</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[14px] font-black text-indigo-600">기본 요금 3배 부과</div>
                                                    <div className="text-[11px] font-medium text-gray-400">(Fix Slot 프리미엄)</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                                
                                {/* 스페셜 테마 이펙트 (Theme Effect) */}
                                <div 
                                    className={`flex flex-col p-4 rounded-xl border-2 transition-all select-none ${
                                        form.option_highlight ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 bg-white'
                                    } ${
                                        initialData.isPaid ? 'opacity-70 cursor-default' : 'cursor-pointer hover:border-gray-300'
                                    }`} 
                                    onClick={() => { 
                                        if (!initialData.isPaid) update('option_highlight', !form.option_highlight); 
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${form.option_highlight ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <Eye className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h5 className="font-black text-[14px] text-gray-900">스페셜 테마 이펙트 (Theme Effect)</h5>
                                                <p className="text-[12px] font-medium text-gray-500">배너 테두리에 화려한 네온, 골드 효과 등을 적용해 시선 강탈!</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[14px] font-black text-indigo-600">
                                                +30,000 P
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* 하단 결제 바 */}
                <div className="p-4 md:p-6 border-t border-gray-200 bg-white shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col items-center sm:items-start">
                        <span className="text-[13px] text-gray-500 font-bold mb-1">총 예상 결제 포인트 ({form.exposure_period}일)</span>
                        <div className="text-2xl md:text-3xl font-black text-primary tracking-tight flex items-baseline gap-2">
                            {calculateTotalPoints().toLocaleString()} <span className="text-lg font-bold">P</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                            <span className="text-[12px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-medium">내 잔여 포인트: {loadingPoints ? '조회 중...' : `${userPoints.toLocaleString()} P`}</span>
                            {calculateTotalPoints() > userPoints && !loadingPoints && (
                                <span className="text-[12px] text-red-500 font-bold animate-pulse">잔액 부족!</span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {initialData.isPaid ? (
                            <>
                                <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none h-14 px-6 rounded-xl font-bold text-[15px] border-gray-300">
                                    닫기
                                </Button>
                                <Button onClick={() => alert('관리자에게 취소/철회 문의를 접수했습니다. (구현 예정)')} className="flex-1 sm:flex-none h-14 px-8 rounded-xl font-black text-[15px] shadow-sm bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
                                    결제 취소/철회 문의
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none h-14 px-6 rounded-xl font-bold text-[15px] border-gray-300">
                                    취소
                                </Button>
                                {calculateTotalPoints() > userPoints && !loadingPoints ? (
                                    <Button onClick={() => alert('포인트 충전 페이지로 이동합니다. (구현 예정)')} className="flex-1 sm:flex-none h-14 px-8 rounded-xl font-black text-[16px] shadow-xl bg-orange-500 hover:bg-orange-600 text-white">
                                        포인트 충전하기
                                    </Button>
                                ) : (
                                    <Button onClick={handleFinalSubmit} disabled={saving || loadingPoints} className="flex-1 sm:flex-none h-14 px-8 rounded-xl font-black text-[16px] shadow-xl bg-gray-900 hover:bg-black text-white">
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <DollarSign className="w-5 h-5 mr-2" />}
                                        결제 및 최종 등록하기
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
