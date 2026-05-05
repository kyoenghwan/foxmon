'use client';

import React, { useState, useEffect } from 'react';
import { Crown, X, Eye, CheckCircle2, DollarSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdFormData } from '@/components/biz/AdEditorForm';
import { getUserPointsAction } from '@/app/actions/pointActions';
import { manageAdAction } from '@/lib/actions';

interface JobPaymentModalProps {
    initialData: Partial<AdFormData>;
    jobId: string;
    onClose: () => void;
    onSuccess: () => void;
}

// 결제 및 옵션 가격 정책
const JOB_PRICING = {
    period: { 30: 70000, 60: 125000, 90: 170000 },
    options: {
        bold: { 30: 30000, 60: 55000, 90: 70000 },
        color: { 30: 15000, 60: 25000, 90: 35000 },
        bg: { 30: 15000, 60: 25000, 90: 35000 },
        highlight: { 30: 15000, 60: 25000, 90: 35000 },
        icon: { 30: 15000, 60: 25000, 90: 35000 },
        general_icons: { 30: 10000, 60: 18000, 90: 25000 },
        jump: { 30: 30000, 60: 55000, 90: 70000 },
    }
};

const TITLE_COLORS = ['#f97316', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899']; // 주황, 빨강, 파랑, 보라, 초록, 핑크
const BG_COLORS = ['#fff7ed', '#fef2f2', '#eff6ff', '#f5f3ff', '#ecfdf5', '#fdf2f8']; // 주황, 빨강, 파랑, 보라, 초록, 핑크 배경
const HIGHLIGHT_COLORS = ['#fde047', '#86efac', '#f9a8d4', '#93c5fd', '#c4b5fd', '#fdba74']; // 노랑, 초록, 핑크, 하늘, 보라, 주황 (형광펜용)

const GENERAL_ICONS = ['💖초보환영', '🏠원룸제공', '✨최고급시설', '🚫블랙관리', '💰당일지급', '👍숙식제공', '💪열정페이', '🤝가족같은'];

export function JobPaymentModal({ initialData, jobId, onClose, onSuccess }: JobPaymentModalProps) {
    const [saving, setSaving] = useState(false);
    const [userPoints, setUserPoints] = useState<number>(0);
    const [loadingPoints, setLoadingPoints] = useState(true);

    // 모달 전용 상태 (초기값 설정)
    const [form, setForm] = useState<Partial<AdFormData>>({
        ...initialData,
        exposure_period: initialData.exposure_period || 30 // 기본값 30일
    });

    // 필드 업데이트
    const update = (field: keyof AdFormData, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    // 포인트 로드
    useEffect(() => {
        const loadPoints = async () => {
            try {
                const res = await getUserPointsAction();
                if (res.success && res.points !== undefined) {
                    setUserPoints(res.points);
                }
            } catch (err) {
                console.error("포인트 로드 실패", err);
            } finally {
                setLoadingPoints(false);
            }
        };
        loadPoints();
    }, []);

    // 예상 결제 포인트
    const calculateTotalPoints = () => {
        const p = form.exposure_period || 30;
        let total = JOB_PRICING.period[p] || 0;
        
        if (form.option_bold) total += JOB_PRICING.options.bold[form.option_bold_period || 30] || 0;
        if (form.option_color) total += JOB_PRICING.options.color[form.option_color_period || 30] || 0;
        if (form.option_bg) total += JOB_PRICING.options.bg[form.option_bg_period || 30] || 0;
        if (form.option_highlight) total += JOB_PRICING.options.highlight[form.option_highlight_period || 30] || 0;
        if (form.option_icon) total += JOB_PRICING.options.icon[form.option_icon_period || 30] || 0;
        if (form.option_general_icons && form.option_general_icons.length > 0) {
            total += (JOB_PRICING.options.general_icons[form.option_general_icons_period || 30] || 0) * form.option_general_icons.length;
        }
        if (form.option_jump) total += JOB_PRICING.options.jump[form.option_jump_period || 30] || 0;
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
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                        <X className="w-5 h-5" />
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
                                <span className="text-[12px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">장기 결제 시 최대 20% 할인!</span>
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
                                        <span className="text-[13px] font-bold text-gray-500 mt-1">{JOB_PRICING.period[days as 30|60|90].toLocaleString()} P</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 부가 옵션 선택 */}
                        <section>
                            <h4 className="text-[15px] font-black text-gray-800 mb-3 flex items-center justify-between">
                                <span>2. 주목도 100배! 추가 옵션</span>
                                <span className="text-[12px] font-medium text-gray-400">선택한 기간({form.exposure_period}일) 적용</span>
                            </h4>
                            <div className="flex flex-col gap-2">
                                {[
                                    { id: 'bold', label: '굵은 글씨 (Bold)', desc: '제목을 굵게 표시하여 눈에 띄게', basePrices: JOB_PRICING.options.bold },
                                    { id: 'color', label: '제목 컬러 (Color)', desc: '제목에 매력적인 브랜드 컬러 적용', basePrices: JOB_PRICING.options.color },
                                    { id: 'highlight', label: '형광펜 효과 (Highlight)', desc: '글씨 뒷배경을 형광펜으로 강조', basePrices: JOB_PRICING.options.highlight },
                                    { id: 'bg', label: '리스트 배경색 (Background)', desc: '공고 영역 전체 배경색을 은은하게 강조', basePrices: JOB_PRICING.options.bg },
                                    { id: 'icon', label: '급구 아이콘 (Urgent Icon)', desc: '시선을 사로잡는 🚨급구 마크 (항상 맨 앞에 표시)', basePrices: JOB_PRICING.options.icon },
                                    { id: 'general_icons', label: '일반 아이콘 (General Icons)', desc: '최대 2개까지 중복 선택 가능한 예쁜 뱃지 (개당 비용 발생)', basePrices: JOB_PRICING.options.general_icons },
                                    { id: 'jump', label: '자동 점프 (Auto Jump)', desc: '매일 6회 (4시간 마다 실행) 자동으로 리스트 최상단 끌어올림!', basePrices: JOB_PRICING.options.jump },
                                ].map(opt => {
                                    const isChecked = !!form[`option_${opt.id}` as keyof AdFormData];
                                    const periodKey = `option_${opt.id}_period` as keyof AdFormData;
                                    const currentPeriod = form[periodKey] || 30;
                                    const price = opt.basePrices[currentPeriod as 30|60|90] || 0;
                                    const isGeneralIcons = opt.id === 'general_icons';
                                    const finalPrice = isGeneralIcons && isChecked ? price * (form.option_general_icons?.length || 1) : price;
                                    
                                    return (
                                        <div key={opt.id} className={`flex flex-col p-3.5 rounded-xl border transition-all ${isChecked ? 'border-primary bg-white shadow-sm' : 'border-gray-200 bg-gray-50/50 hover:bg-white'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => {
                                                    const newVal = !isChecked;
                                                    update(`option_${opt.id}` as keyof AdFormData, newVal);
                                                    if (newVal) {
                                                        update(periodKey, 30);
                                                        if (opt.id === 'color' && !form.option_color_value) update('option_color_value', TITLE_COLORS[0]);
                                                        if (opt.id === 'bg' && !form.option_bg_value) update('option_bg_value', BG_COLORS[0]);
                                                        if (opt.id === 'highlight' && !form.option_highlight_value) update('option_highlight_value', HIGHLIGHT_COLORS[0]);
                                                        if (opt.id === 'general_icons' && (!form.option_general_icons || form.option_general_icons.length === 0)) update('option_general_icons', [GENERAL_ICONS[0]]);
                                                    }
                                                }}>
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${isChecked ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'}`}>
                                                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`text-[14px] font-bold ${isChecked ? 'text-gray-900' : 'text-gray-700'}`}>{opt.label}</span>
                                                        <span className="text-[12px] text-gray-500 font-medium hidden lg:inline-block">· {opt.desc}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {isChecked && (
                                                        <select
                                                            className="text-[12px] font-bold border border-gray-300 rounded px-2 py-1 outline-none focus:border-primary bg-white cursor-pointer"
                                                            value={currentPeriod}
                                                            onChange={(e) => update(periodKey, Number(e.target.value))}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <option value={30}>30일</option>
                                                            <option value={60}>60일 (-10%)</option>
                                                            <option value={90}>90일 (-20%)</option>
                                                        </select>
                                                    )}
                                                    <span className="text-[14px] font-bold text-indigo-600 min-w-[60px] text-right">+{finalPrice.toLocaleString()} P</span>
                                                </div>
                                            </div>
                                            <span className="text-[12px] text-gray-500 font-medium sm:hidden mt-2 ml-8">{opt.desc}</span>
                                            
                                            {/* 세부 설정 영역 (색상, 아이콘 등) */}
                                            {isChecked && opt.id !== 'bold' && opt.id !== 'jump' && (
                                                <div className="mt-4 ml-8 flex flex-col gap-4" onClick={e => e.stopPropagation()}>

                                                    {/* 색상 선택 팔레트 (옵션 활성화 시) */}
                                                    {opt.id === 'color' && (
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-[12px] font-bold text-gray-600 shrink-0 w-16">글씨 색상</span>
                                                            {TITLE_COLORS.map(c => (
                                                                <button key={c} type="button" onClick={() => update('option_color_value', c)}
                                                                    className={`w-6 h-6 rounded-full border-2 transition-all ${form.option_color_value === c ? 'border-primary scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                                                                    style={{ backgroundColor: c }}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    {opt.id === 'highlight' && (
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-[12px] font-bold text-gray-600 shrink-0 w-16">형광펜 색상</span>
                                                            {HIGHLIGHT_COLORS.map(c => (
                                                                <button key={c} type="button" onClick={() => update('option_highlight_value', c)}
                                                                    className={`w-6 h-6 rounded-full border-2 transition-all ${form.option_highlight_value === c ? 'border-primary scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                                                                    style={{ backgroundColor: c }}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    {opt.id === 'bg' && (
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-[12px] font-bold text-gray-600 shrink-0 w-16">배경 색상</span>
                                                            {BG_COLORS.map((c, i) => (
                                                                <button key={c} type="button" onClick={() => update('option_bg_value', c)}
                                                                    className={`w-6 h-6 rounded-full border-2 transition-all ${form.option_bg_value === c ? 'border-primary scale-110 shadow-sm' : 'border-gray-200 hover:scale-105'}`}
                                                                    style={{ backgroundColor: c }} title={['주황', '빨강', '파랑', '보라', '초록', '핑크'][i]}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    {opt.id === 'general_icons' && (
                                                        <div className="flex gap-2 flex-wrap items-start">
                                                            <span className="text-[12px] font-bold text-gray-600 shrink-0 w-16 mt-1">아이콘 선택</span>
                                                            <div className="flex-1 flex flex-wrap gap-2">
                                                                {GENERAL_ICONS.map(icon => {
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
                                                                            className={`text-[12px] font-black px-2 py-1 rounded border transition-colors ${selected ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
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
