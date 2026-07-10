'use client';

import React, { useState, useEffect } from 'react';
import { Crown, X, Eye, CheckCircle2, DollarSign, Loader2, Clock, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdFormData } from '@/components/biz/AdEditorForm';
import { getUserPointsAction } from '@/app/actions/pointActions';
import { manageAdAction } from '@/lib/actions';
import { QA_GET_COMMON_CODES } from '@/src/atoms/qa/master/QA_GET_COMMON_CODES';
import { GET_POINT_POLICIES, PointPolicyItem } from '@/app/actions/pointPolicyActions';

interface JobPaymentModalProps {
    initialData: Partial<AdFormData>;
    jobId: string;
    onClose: () => void;
    onSuccess: () => void;
}


const TITLE_COLORS = ['#f97316', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899']; // 주황, 빨강, 파랑, 보라, 초록, 핑크
const BG_COLORS = ['#fff7ed', '#fef2f2', '#eff6ff', '#f5f3ff', '#ecfdf5', '#fdf2f8']; // 주황, 빨강, 파랑, 보라, 초록, 핑크 배경
const HIGHLIGHT_COLORS = ['#fde047', '#86efac', '#f9a8d4', '#93c5fd', '#c4b5fd', '#fdba74']; // 노랑, 초록, 핑크, 하늘, 보라, 주황 (형광펜용)

export function JobPaymentModal({ initialData, jobId, onClose, onSuccess }: JobPaymentModalProps) {
    const [saving, setSaving] = useState(false);
    const [userPoints, setUserPoints] = useState<number>(0);
    const [loadingPoints, setLoadingPoints] = useState(true);
    const [activePicker, setActivePicker] = useState<string | null>(null);
    const [generalIcons, setGeneralIcons] = useState<string[]>([]);
    const [policies, setPolicies] = useState<Record<string, number>>({});

    // 모달 전용 상태 (초기값 설정)
    const [form, setForm] = useState<Partial<AdFormData>>({
        ...initialData,
        exposure_period: initialData.exposure_period || 30 // 기본값 30일
    });

    // 필드 업데이트
    const update = (field: keyof AdFormData, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    // 데이터(포인트 및 마스터코드) 로드
    useEffect(() => {
        const loadData = async () => {
            try {
                // 포인트 로드
                const res = await getUserPointsAction();
                if (res.success && res.points !== undefined) {
                    setUserPoints(res.points);
                }
                
                // 일반 아이콘 리스트 로드 (DB 공통코드)
                const codesRes = await QA_GET_COMMON_CODES('AD_GENERAL_ICONS', true);
                if (codesRes.success && codesRes.data) {
                    setGeneralIcons(codesRes.data.map(c => c.code_name));
                }

                // 포인트 정책 로드
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

    // 예상 결제 포인트 (이제 30, 60, 90일 키가 DB에 각각 저장되어 있으므로 그대로 가져옵니다)
    const getPrice = (key: string, period: number) => policies[`${key}_${period}`] || 0;
    
    const calculateTotalPoints = () => {
        const p = form.exposure_period || 30;
        let total = getPrice('OPTION_PRICE_BASE_PERIOD', p);
        
        if (form.is_subscription) {
            total = Math.floor(total * 0.95);
        }
        
        if (form.option_bold) total += getPrice('OPTION_PRICE_BOLD', p);
        if (form.option_color) total += getPrice('OPTION_PRICE_COLOR', p);
        if (form.option_bg) total += getPrice('OPTION_PRICE_BG', p);
        if (form.option_highlight) total += getPrice('OPTION_PRICE_HIGHLIGHT', p);
        if (form.option_icon) total += getPrice('OPTION_PRICE_ICON', p);
        if (form.option_general_icons && form.option_general_icons.length > 0) {
            total += getPrice('OPTION_PRICE_GENERAL_ICONS', p) * form.option_general_icons.length;
        }
        if (form.option_jump) total += getPrice('OPTION_PRICE_JUMP', p);
        return total;
    };

    const handleFinalSubmit = async () => {
        setSaving(true);
        try {
            // DB 업데이트 로직
            const res = await manageAdAction('UPDATE', { ...form, _isPayment: true }, jobId);
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

    // 급여 표시 처리
    const payText = form.pay || (form.pay_amount ? `[${form.pay_type}] ${form.pay_amount}원` : '협의');
    // 마감일 계산 (현재일 + exposure_period)
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + (form.exposure_period || 30));
    const deadlineString = `${deadlineDate.getFullYear()}-${String(deadlineDate.getMonth() + 1).padStart(2, '0')}-${String(deadlineDate.getDate()).padStart(2, '0')}`;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center justify-center p-4" onClick={onClose}>
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-3xl flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
                <div className="w-full flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-white shrink-0">
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Crown className="w-6 h-6 text-yellow-500" /> 구인 공고 노출 옵션 선택
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
                    {/* 1. 라이브 프리뷰 (가로형 리스트 UI) */}
                    <div className="w-full shrink-0 flex flex-col gap-4">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> 라이브 프리뷰 (리스트 노출 화면)</h4>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                            {/* 헤더 영역 */}
                            <div className="grid grid-cols-6 gap-2 bg-gray-50 p-3 border-b border-gray-200 text-center text-[12px] font-bold text-gray-600">
                                <div className="col-span-1">근무지</div>
                                <div className="col-span-2 text-left">채용제목</div>
                                <div className="col-span-1">업체명</div>
                                <div className="col-span-1">급여</div>
                                <div className="col-span-1">마감일</div>
                            </div>
                            
                            {/* Row 영역 (옵션 효과 적용) */}
                            <div 
                                className={`grid grid-cols-6 gap-2 p-3 items-center text-[13px] transition-all duration-300 ${form.option_bg ? 'border' : 'bg-white'}`}
                                style={form.option_bg && form.option_bg_value ? { backgroundColor: form.option_bg_value, borderColor: form.option_bg_value.replace('f', 'e') } : form.option_bg ? { backgroundColor: '#fff7ed', borderColor: '#fed7aa' } : {}}
                            >
                                <div className="col-span-1 text-center text-gray-600 truncate px-1">
                                    {form.location || '지역 미입력'}
                                </div>
                                <div 
                                    className={`col-span-2 flex items-center gap-1.5 truncate ${form.option_bold ? 'font-black' : 'font-medium'}`}
                                    style={form.option_color && form.option_color_value ? { color: form.option_color_value } : form.option_color ? { color: '#f97316' } : { color: '#111827' }}
                                >
                                    {form.option_icon && <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm shrink-0 animate-pulse">급구</span>}
                                    {form.option_general_icons?.map(icon => (
                                        <span key={icon} className="text-[12px] font-black shrink-0 px-1 py-0.5 rounded border border-gray-200 bg-white">{icon}</span>
                                    ))}
                                    <span 
                                        className={`truncate ${form.option_highlight ? 'px-1 rounded' : ''}`}
                                        style={form.option_highlight && form.option_highlight_value ? { backgroundColor: form.option_highlight_value } : form.option_highlight ? { backgroundColor: '#fde047' } : {}}
                                    >
                                        {form.title || '공고 제목이 표시됩니다'}
                                    </span>
                                </div>
                                <div className="col-span-1 text-center text-gray-600 truncate px-1">
                                    {form.business_name || form.company || '업체명'}
                                </div>
                                <div className="col-span-1 text-center font-bold text-pink-600 truncate px-1">
                                    {payText}
                                </div>
                                <div className="col-span-1 text-center text-gray-500 text-[11px] truncate">
                                    ~{deadlineString}
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-[12px] text-gray-400 text-center bg-gray-100/50 py-2 rounded-lg">
                            실제 노출 화면과 약간의 차이가 있을 수 있습니다.
                        </div>
                    </div>

                    {/* 2 & 3. 노출 기간 패키지 및 추가 옵션 */}
                    <div className="w-full flex flex-col gap-6">
                        {/* 노출 기간 선택 */}
                        <section>
                            <h4 className="text-[15px] font-black text-gray-800 mb-3 flex items-center justify-between">
                                <span>1. 노출 기간 패키지 (필수)</span>
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
                                    let price = getPrice('OPTION_PRICE_BASE_PERIOD', days);
                                    if (opt.sub) price = Math.floor(price * 0.95);

                                    return (
                                        <button 
                                            key={opt.id}
                                            type="button"
                                            onClick={() => {
                                                if (opt.sub) {
                                                    update('is_subscription', true);
                                                    update('exposure_period', 30);
                                                } else {
                                                    update('is_subscription', false);
                                                    update('exposure_period', opt.id as 30|60|90);
                                                }
                                            }}
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-gray-200 bg-white hover:border-gray-300'}`}
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
                        <section>
                            <h4 className="text-[15px] font-black text-gray-800 mb-3 flex items-center justify-between">
                                <span>2. 주목도 100배! 추가 옵션</span>
                                <span className="text-[12px] font-medium text-gray-400">선택한 기간({form.exposure_period}일) 적용</span>
                            </h4>
                            <div className="flex flex-col gap-2">
                                {[
                                    { id: 'bold', label: '굵은 글씨', desc: '제목을 굵게 표시', key: 'OPTION_PRICE_BOLD' },
                                    { id: 'color', label: '제목 컬러', desc: '제목 브랜드 컬러 적용', key: 'OPTION_PRICE_COLOR' },
                                    { id: 'highlight', label: '형광펜 효과', desc: '글씨 뒷배경 형광펜 강조', key: 'OPTION_PRICE_HIGHLIGHT' },
                                    { id: 'bg', label: '리스트 배경색', desc: '공고 영역 전체 배경색 강조', key: 'OPTION_PRICE_BG' },
                                    { id: 'icon', label: '급구 아이콘', desc: '🚨급구 마크 표시', key: 'OPTION_PRICE_ICON' },
                                    { id: 'general_icons', label: '일반 아이콘', desc: '뱃지 중복 선택 (개당 비용)', key: 'OPTION_PRICE_GENERAL_ICONS' },
                                    { id: 'jump', label: '자동 점프', desc: '매일 6회 자동 상단 끌어올림', key: 'OPTION_PRICE_JUMP' },
                                ].map(opt => {
                                    const isChecked = !!form[`option_${opt.id}` as keyof AdFormData];
                                    const periodKey = `option_${opt.id}_period` as keyof AdFormData;
                                    const currentPeriod = form[periodKey] || 30;
                                    const price = getPrice(opt.key, currentPeriod as number);
                                    const isGeneralIcons = opt.id === 'general_icons';
                                    const finalPrice = isGeneralIcons && isChecked ? price * (form.option_general_icons?.length || 1) : price;
                                    
                                    return (
                                        <div 
                                            key={opt.id} 
                                            onClick={() => {
                                                const newVal = !isChecked;
                                                update(`option_${opt.id}` as keyof AdFormData, newVal);
                                                if (newVal) {
                                                    update(periodKey, 30);
                                                    if (opt.id === 'color' && !form.option_color_value) update('option_color_value', TITLE_COLORS[0]);
                                                    if (opt.id === 'bg' && !form.option_bg_value) update('option_bg_value', BG_COLORS[0]);
                                                    if (opt.id === 'highlight' && !form.option_highlight_value) update('option_highlight_value', HIGHLIGHT_COLORS[0]);
                                                    if (opt.id === 'general_icons' && (!form.option_general_icons || form.option_general_icons.length === 0)) {
                                                        update('option_general_icons', generalIcons.length > 0 ? [generalIcons[0]] : []);
                                                    }
                                                }
                                            }}
                                            className={`flex items-center justify-between py-2 px-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                                                isChecked 
                                                    ? 'border-indigo-500 bg-indigo-50/20 shadow-sm' 
                                                    : 'border-[#f1f1f5] bg-[#fafafc] hover:bg-white hover:border-gray-300'
                                            }`}
                                        >
                                            {/* 좌측: 원형 체크박스 + 옵션명 */}
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                                    isChecked 
                                                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                                                        : 'border-gray-300 bg-white'
                                                }`}>
                                                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                </div>
                                                <span className={`text-[13px] font-black tracking-tight shrink-0 ${isChecked ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {opt.label}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium truncate hidden md:inline ml-1">
                                                    {opt.desc}
                                                </span>
                                            </div>
 
                                            {/* 우측: 도구 및 금액 */}
                                            <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                                {/* 색상 선택 (OS 기본 컬러 피커) */}
                                                {isChecked && (opt.id === 'color' || opt.id === 'highlight' || opt.id === 'bg') && (
                                                    <div className="relative w-5 h-5 rounded-full overflow-hidden border border-gray-300 shadow-sm cursor-pointer transition-transform hover:scale-110 shrink-0" title="색상 변경">
                                                        <input 
                                                            type="color" 
                                                            value={form[`option_${opt.id}_value` as keyof AdFormData] as string || '#ffffff'}
                                                            onChange={(e) => update(`option_${opt.id}_value` as keyof AdFormData, e.target.value)}
                                                            className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer border-0 p-0"
                                                        />
                                                    </div>
                                                )}

                                                {/* 일반 아이콘 팝오버 트리거 */}
                                                {isChecked && opt.id === 'general_icons' && (
                                                    <div className="relative">
                                                        <button 
                                                            type="button" 
                                                            onClick={(e) => { e.stopPropagation(); setActivePicker(activePicker === opt.id ? null : opt.id); }}
                                                            className="px-2 py-0.5 rounded border border-gray-300 bg-white text-[11px] font-bold text-gray-600 hover:bg-gray-50 shadow-sm"
                                                        >
                                                            선택
                                                        </button>
                                                        {activePicker === opt.id && (
                                                            <div className="absolute bottom-full mb-2 right-0 bg-white border border-gray-200 shadow-2xl rounded-xl p-3 z-50 w-[240px]" onClick={e => e.stopPropagation()}>
                                                                <div className="text-[12px] font-bold text-gray-700 mb-3 flex justify-between items-center">
                                                                    <span>아이콘 선택 (최대 2개)</span>
                                                                    <button type="button" className="text-gray-400 hover:text-gray-600 text-[14px]" onClick={() => setActivePicker(null)}>✕</button>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {generalIcons.length === 0 ? (
                                                                        <span className="text-gray-400 text-xs py-2">등록된 아이콘이 없습니다.</span>
                                                                    ) : generalIcons.map(icon => {
                                                                        const selected = form.option_general_icons?.includes(icon) || false;
                                                                        return (
                                                                            <button key={icon} type="button"
                                                                                onClick={() => {
                                                                                    let current = form.option_general_icons || [];
                                                                                    if (selected) {
                                                                                        current = current.filter(x => x !== icon);
                                                                                        if (current.length === 0) return; // 최소 1개는 유지
                                                                                    } else {
                                                                                        if (current.length >= 2) return alert('일반 아이콘은 최대 2개까지만 선택 가능합니다.');
                                                                                        current = [...current, icon];
                                                                                    }
                                                                                    update('option_general_icons', current);
                                                                                }}
                                                                                className={`text-[12px] font-black px-2 py-1 rounded border transition-colors ${selected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                                            >
                                                                                {icon}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {isChecked && (
                                                    <select
                                                        className="text-[11px] font-bold border border-gray-300 rounded-md px-1.5 py-0.5 outline-none focus:border-indigo-500 bg-white cursor-pointer"
                                                        value={currentPeriod as number}
                                                        onChange={(e) => update(periodKey, Number(e.target.value))}
                                                    >
                                                        <option value={30}>30일</option>
                                                        <option value={60}>60일 (-10%)</option>
                                                        <option value={90}>90일 (-20%)</option>
                                                    </select>
                                                )}
                                                <span className="text-[13px] font-black text-indigo-600 min-w-[65px] text-right">+{finalPrice.toLocaleString()} P</span>
                                            </div>
                                        </div>
                                    );
                                })}
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
