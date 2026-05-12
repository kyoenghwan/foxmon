'use client';

import React, { useState, useEffect } from 'react';
import { Crown, X, Eye, DollarSign, Loader2, Clock, Zap, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdFormData } from '@/components/biz/AdEditorForm';
import { getUserPointsAction } from '@/app/actions/pointActions';
import { manageBizAdAction } from '@/lib/actions';
import { GET_POINT_POLICIES } from '@/app/actions/pointPolicyActions';

interface BizAdPaymentModalProps {
    initialData: Partial<AdFormData>;
    jobId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function BizAdPaymentModal({ initialData, jobId, onClose, onSuccess }: BizAdPaymentModalProps) {
    const [saving, setSaving] = useState(false);
    const [userPoints, setUserPoints] = useState<number>(0);
    const [loadingPoints, setLoadingPoints] = useState(true);
    const [policies, setPolicies] = useState<Record<string, number>>({});

    const [form, setForm] = useState<Partial<AdFormData>>({
        ...initialData,
        exposure_period: initialData.exposure_period || 30,
        is_subscription: false,
        option_double_slot: false,
        option_jump: false
    });

    const update = (field: keyof AdFormData, value: any) => {
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
        
        if (form.option_double_slot) {
            total *= 2;
        }

        if (form.option_jump) {
            total += policies[`OPTION_PRICE_JUMP_${p}`] || 0;
        }

        if (form.option_double_slot) {
            total = Math.floor(total * 0.95);
        }

        return total;
    };

    const handleFinalSubmit = async () => {
        setSaving(true);
        try {
            const res = await manageBizAdAction('UPDATE', { ...form, _isPayment: true }, jobId);
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
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6 md:gap-8 bg-gray-50/50">
                    {/* 1. 배너 라이브 프리뷰 */}
                    <div className="w-full shrink-0 flex flex-col gap-4">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> 라이브 프리뷰 (배너 노출 화면)</h4>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative p-6 flex flex-col items-center justify-center min-h-[180px] bg-slate-50">
                            <span className="absolute top-3 left-3 bg-gray-900 text-white text-[11px] px-2 py-0.5 rounded shadow-sm font-black">{getTierName()}</span>
                            
                            <div className={`w-full max-w-[400px] flex ${form.option_double_slot ? 'flex-col gap-1' : ''}`}>
                                {(form.logo_url || form.image) ? (
                                    <img src={(form.logo_url || form.image) as string} alt="광고 배너" className="w-full h-auto object-contain rounded-lg shadow border border-gray-200 bg-white" />
                                ) : (
                                    <div className="w-full h-[120px] rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-sm">
                                        등록된 배너 이미지가 없습니다.
                                    </div>
                                )}
                                {form.option_double_slot && (form.logo_url || form.image) && (
                                    <img src={(form.logo_url || form.image) as string} alt="광고 배너 (연속 노출)" className="w-full h-auto object-contain rounded-lg shadow border border-gray-200 bg-white opacity-90" />
                                )}
                            </div>
                            
                            <div className="mt-4 text-[14px] font-black text-gray-800 text-center">
                                {form.title || '광고 제목'}
                            </div>
                            <div className="text-[12px] text-gray-500 font-medium mt-0.5">
                                {form.company || form.business_name}
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
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[30, 60, 90].map(days => (
                                    <button 
                                        key={days}
                                        type="button"
                                        onClick={() => update('exposure_period', days as 30|60|90)}
                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${form.exposure_period === days ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                    >
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className={`text-lg font-black ${form.exposure_period === days ? 'text-primary' : 'text-gray-700'}`}>{days}일</span>
                                            {days === 60 && <span className="text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded">10% OFF</span>}
                                            {days === 90 && <span className="text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded">20% OFF</span>}
                                        </div>
                                        <span className="text-[13px] font-bold text-gray-500 mt-1">{getBasePrice(days).toLocaleString()} P</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 자동 연장 (구독) 스위치 */}
                        <div className={`border-2 rounded-xl p-4 transition-all cursor-pointer select-none flex flex-col gap-3 ${form.is_subscription ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 bg-white hover:bg-gray-50'}`} onClick={() => update('is_subscription', !form.is_subscription)}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${form.is_subscription ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-[15px] text-gray-900">매월 자동 연장 (구독) 신청</h4>
                                        <p className="text-[12px] font-medium text-gray-500">매번 결제할 필요 없이 할인가로 자동 노출</p>
                                    </div>
                                </div>
                                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_subscription ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_subscription ? 'translate-x-6' : 'translate-x-1'}`} />
                                </div>
                            </div>
                            
                            {form.is_subscription && (
                                <div className="mt-2 p-3 bg-white border border-blue-100 rounded-lg shadow-sm">
                                    <p className="text-[12px] font-bold text-blue-800 mb-2">🎁 구독 유지 기간에 따른 놀라운 추가 할인 혜택!</p>
                                    <div className="grid grid-cols-6 gap-1 text-center">
                                        {[
                                            { m: '1개월', d: '5%' },
                                            { m: '2개월', d: '10%' },
                                            { m: '3개월', d: '15%' },
                                            { m: '4개월', d: '20%' },
                                            { m: '5개월', d: '25%' },
                                            { m: '6개월~', d: '30%' },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex flex-col bg-blue-50 rounded py-1.5">
                                                <span className="text-[10px] text-gray-500">{item.m}</span>
                                                <span className="text-[11px] font-black text-blue-700">{item.d}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 text-center">* 할인은 다음 갱신 결제부터 자동으로 적용됩니다.</p>
                                </div>
                            )}
                        </div>
                        
                        {/* 부가 옵션 선택 */}
                        <section className="mt-4">
                            <h4 className="text-[15px] font-black text-gray-800 mb-3 flex items-center justify-between">
                                <span>2. 주목도 100배! 부가 옵션</span>
                                <span className="text-[12px] font-medium text-gray-400">선택한 기간({form.exposure_period}일) 내내 유지</span>
                            </h4>
                            <div className="flex flex-col gap-3">
                                {/* 연속 노출 (더블 슬롯) */}
                                <div className={`flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${form.option_double_slot ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`} onClick={() => update('option_double_slot', !form.option_double_slot)}>
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
                                
                                {/* 자동 점프 */}
                                <div className={`flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${form.option_jump ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`} onClick={() => update('option_jump', !form.option_jump)}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${form.option_jump ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <Zap className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h5 className="font-black text-[14px] text-gray-900">스마트 자동 점프 (Auto Jump)</h5>
                                                <p className="text-[12px] font-medium text-gray-500">내 광고가 100위권 밖으로 밀려나면 상위권으로 끌어올림!</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[14px] font-black text-indigo-600">
                                                +{policies[`OPTION_PRICE_JUMP_${form.exposure_period || 30}`]?.toLocaleString() || 0} P
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
                    </div>
                </div>
            </div>
        </div>
    );
}
