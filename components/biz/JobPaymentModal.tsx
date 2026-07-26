'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Crown, X, Eye, CheckCircle2, DollarSign, Loader2, Clock, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdFormData } from '@/components/biz/AdEditorForm';
import { getUserPointsAction } from '@/app/actions/pointActions';
import { manageAdAction } from '@/lib/actions';
import { QA_GET_COMMON_CODES } from '@/src/atoms/qa/master/QA_GET_COMMON_CODES';
import { GET_POINT_POLICIES, PointPolicyItem } from '@/app/actions/pointPolicyActions';
import { safeIconsArray } from '@/lib/utils';

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

    // 기존 공고 노출 상태 및 남은 기간 계산
    const currentExpiresAt = initialData?.expires_at ? new Date(initialData.expires_at) : null;
    const isCurrentlyActive = !!(currentExpiresAt && currentExpiresAt.getTime() > Date.now());
    const remainingDays = isCurrentlyActive 
        ? Math.max(1, Math.ceil((currentExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

    // 모달 전용 상태 (노출 중이면 기본값 0: 기간 연장 안 함)
    const [form, setForm] = useState<Partial<AdFormData>>({
        ...initialData,
        option_general_icons: safeIconsArray(initialData?.option_general_icons),
        exposure_period: isCurrentlyActive ? 0 : (initialData?.exposure_period || 30)
    });

    const selectedGeneralIcons = safeIconsArray(form.option_general_icons);

    const optionsList = [
        { id: 'bold', label: '굵은 글씨', desc: '제목을 굵게 표시', priceKey: 'OPTION_PRICE_BOLD', defaultPrice: 30000 },
        { id: 'color', label: '제목 컬러', desc: '제목 브랜드 컬러 적용', priceKey: 'OPTION_PRICE_COLOR', defaultPrice: 15000 },
        { id: 'highlight', label: '형광펜 효과', desc: '글씨 뒷배경 형광펜 강조', priceKey: 'OPTION_PRICE_HIGHLIGHT', defaultPrice: 15000 },
        { id: 'bg', label: '리스트 배경색', desc: '공고 영역 전체 배경색 강조', priceKey: 'OPTION_PRICE_BG', defaultPrice: 15000 },
        { id: 'icon', label: '급구 아이콘', desc: '🚨급구 마크 표시', priceKey: 'OPTION_PRICE_ICON', defaultPrice: 15000 },
        { id: 'general_icons', label: '일반 아이콘', desc: '뱃지 중복 선택 (개당 비용)', priceKey: 'OPTION_PRICE_GENERAL_ICONS', defaultPrice: 10000 },
        { id: 'jump', label: '자동 점프', desc: '하루 24번(1시간 마다) 자동 상단 끌어올림', priceKey: 'OPTION_PRICE_JUMP', defaultPrice: 30000 },
    ];

    const containerRef = useRef<HTMLDivElement>(null);
    const iconsWrapperRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLSpanElement>(null);
    const [showTwoLines, setShowTwoLines] = useState(false);
    const [marqueeDistance, setMarqueeDistance] = useState(0);

    useEffect(() => {
        const checkLayout = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.clientWidth;
                const iconsWidth = iconsWrapperRef.current ? iconsWrapperRef.current.clientWidth : 0;
                setShowTwoLines(iconsWidth > containerWidth * 0.45);

                if (titleRef.current) {
                    const parentWidth = titleRef.current.parentElement?.clientWidth || containerWidth;
                    const scrollW = titleRef.current.scrollWidth;
                    if (scrollW > parentWidth) {
                        setMarqueeDistance(parentWidth - scrollW);
                    } else {
                        setMarqueeDistance(0);
                    }
                }
            }
        };

        checkLayout();

        if (containerRef.current) {
            const observer = new ResizeObserver(() => checkLayout());
            observer.observe(containerRef.current);
            return () => observer.disconnect();
        }
    }, [form.option_icon, form.option_general_icons, form.title, showTwoLines]);

    // 필드 업데이트
    const update = (field: keyof AdFormData, value: any) => {
        if (field === 'option_general_icons') {
            const sanitized = safeIconsArray(value);
            setForm(prev => ({ ...prev, [field]: sanitized }));
        } else {
            setForm(prev => ({ ...prev, [field]: value }));
        }
    };

    // 데이터 로드
    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await getUserPointsAction();
                if (res.success && res.points !== undefined) {
                    setUserPoints(res.points);
                }
                
                const codesRes = await QA_GET_COMMON_CODES('AD_GENERAL_ICONS', true);
                if (codesRes.success && codesRes.data) {
                    setGeneralIcons(codesRes.data.map(c => c.code_name));
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

    const getPrice = (key: string, defVal: number = 0) => policies[key] || defVal;

    // 상세 계산 내역 (Breakdown) 및 총 포인트 산정
    const calculateBreakdown = () => {
        const items: { label: string; amount: number; desc?: string }[] = [];
        let total = 0;
        const period = Number(form.exposure_period || 0);

        // 1. 노출 기간 패키지 금액
        if (period > 0) {
            let basePrice = getPrice(`OPTION_PRICE_BASE_PERIOD_${period}`, period === 30 ? 70000 : period === 60 ? 125000 : 189000);
            if (form.is_subscription) {
                basePrice = Math.floor(basePrice * 0.95);
            }
            items.push({
                label: `노출 기간 연장 (${form.is_subscription ? '구독' : period + '일'})`,
                amount: basePrice,
                desc: isCurrentlyActive ? `기존 만료일(~${initialData.expires_at?.split('T')[0]})에 +${period}일 추가 연장` : `오늘부터 ${period}일 노출`
            });
            total += basePrice;
        } else {
            items.push({
                label: `노출 기간 연장 안 함`,
                amount: 0,
                desc: `기존 남은 노출기간 ${remainingDays}일(~${initialData?.expires_at ? initialData.expires_at.split('T')[0] : ''}) 유지`
            });
        }

        // 2. 추가 옵션 금액
        const isProrated = period === 0 && isCurrentlyActive;
        const ratio = isProrated ? (remainingDays / 30) : 1;

        const calcOptionPrice = (isOptionChecked: boolean, wasOptionChecked: boolean, key: string, defaultPrice: number, optionName: string) => {
            if (!isOptionChecked) return;

            if (isProrated && wasOptionChecked) {
                items.push({
                    label: `${optionName} (기존 유효)`,
                    amount: 0,
                    desc: `이미 적용 중인 옵션`
                });
                return;
            }

            const baseUnitPrice = getPrice(key, defaultPrice);
            let finalPrice = baseUnitPrice;

            if (isProrated) {
                finalPrice = Math.floor(baseUnitPrice * ratio);
                items.push({
                    label: `${optionName} (남은 ${remainingDays}일 일할 계산)`,
                    amount: finalPrice,
                    desc: `${baseUnitPrice.toLocaleString()} P × (${remainingDays}/30일)`
                });
            } else {
                items.push({
                    label: `${optionName}`,
                    amount: finalPrice,
                    desc: `${period > 0 ? period : 30}일 적용`
                });
            }
            total += finalPrice;
        };

        calcOptionPrice(!!form.option_bold, !!initialData?.option_bold, 'OPTION_PRICE_BOLD', 30000, '굵은 글씨');
        calcOptionPrice(!!form.option_color, !!initialData?.option_color, 'OPTION_PRICE_COLOR', 15000, '제목 컬러');
        calcOptionPrice(!!form.option_bg, !!initialData?.option_bg, 'OPTION_PRICE_BG', 15000, '리스트 배경색');
        calcOptionPrice(!!form.option_highlight, !!initialData?.option_highlight, 'OPTION_PRICE_HIGHLIGHT', 15000, '형광펜 효과');
        calcOptionPrice(!!form.option_icon, !!initialData?.option_icon, 'OPTION_PRICE_ICON', 15000, '🚨 급구 아이콘');

        // 일반 아이콘 (개수 비례)
        const currentIcons = selectedGeneralIcons;
        const initIcons = safeIconsArray(initialData?.option_general_icons);
        if (currentIcons.length > 0) {
            const baseUnitPrice = getPrice('OPTION_PRICE_GENERAL_ICONS', 10000);
            
            if (isProrated) {
                const newIconsCount = currentIcons.filter(ic => !initIcons.includes(ic)).length;
                if (newIconsCount > 0) {
                    const iconPrice = Math.floor(baseUnitPrice * newIconsCount * ratio);
                    items.push({
                        label: `일반 아이콘 ${newIconsCount}개 신규 추가 (남은 ${remainingDays}일 일할 계산)`,
                        amount: iconPrice,
                        desc: `${baseUnitPrice.toLocaleString()} P × ${newIconsCount}개 × (${remainingDays}/30일)`
                    });
                    total += iconPrice;
                }
                const keptIconsCount = currentIcons.length - newIconsCount;
                if (keptIconsCount > 0) {
                    items.push({
                        label: `일반 아이콘 ${keptIconsCount}개 (기존 유효)`,
                        amount: 0,
                        desc: `이미 적용된 아이콘`
                    });
                }
            } else {
                const iconPrice = baseUnitPrice * currentIcons.length;
                items.push({
                    label: `일반 아이콘 ${currentIcons.length}개`,
                    amount: iconPrice,
                    desc: `${baseUnitPrice.toLocaleString()} P × ${currentIcons.length}개`
                });
                total += iconPrice;
            }
        }

        calcOptionPrice(!!form.option_jump, !!initialData?.option_jump, 'OPTION_PRICE_JUMP', 30000, '자동 점프');

        return { items, total };
    };

    const breakdown = calculateBreakdown();

    const payText = form.pay || (form.pay_amount ? `[${form.pay_type}] ${form.pay_amount}원` : '협의');
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + (form.exposure_period || 30));
    const deadlineString = `${deadlineDate.getFullYear()}-${String(deadlineDate.getMonth() + 1).padStart(2, '0')}-${String(deadlineDate.getDate()).padStart(2, '0')}`;

    const handleFinalSubmit = async () => {
        setSaving(true);
        try {
            const res = await manageAdAction('UPDATE', { ...form, _isPayment: true }, jobId);
            if (!res.success) {
                throw new Error(res.message || "결제 처리에 실패했습니다.");
            }
            onSuccess();
        } catch (err: any) {
            console.error("결제 처리 중 오류", err);
            alert(err?.message || "결제 처리 중 오류가 발생했습니다.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center justify-center p-4" onClick={onClose}>
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-3xl flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
                <div className="w-full flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-white shrink-0">
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Crown className="w-6 h-6 text-yellow-500" /> 구인 공고 노출 옵션 선택
                    </h3>
                    <button
                        onClick={onClose}
                        className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 hover:text-gray-900 rounded-xl text-[13px] font-black transition-all shrink-0"
                    >
                        닫기
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
                                    ref={containerRef}
                                    className={`col-span-2 flex gap-1.5 ${showTwoLines ? 'flex-col items-start' : 'flex-row items-center truncate'} ${form.option_bold ? 'font-black' : 'font-medium'}`}
                                    style={form.option_color && form.option_color_value ? { color: form.option_color_value } : form.option_color ? { color: '#f97316' } : { color: '#111827' }}
                                >
                                    <style dangerouslySetInnerHTML={{__html: `
                                        @keyframes marqueeAlternate {
                                            0%, 15% { transform: translateX(0); }
                                            85%, 100% { transform: translateX(var(--marquee-dist, 0px)); }
                                        }
                                        .animate-marquee-alt {
                                            display: inline-block;
                                            animation: marqueeAlternate 6s ease-in-out infinite alternate;
                                        }
                                        @keyframes siren {
                                            0% { transform: rotate(-20deg) scale(0.9); }
                                            100% { transform: rotate(20deg) scale(1.2); }
                                        }
                                        .animate-siren {
                                            display: inline-block;
                                            animation: siren 0.4s ease-in-out infinite alternate;
                                        }
                                    `}} />

                                    {/* 아이콘 영역 */}
                                    {(form.option_icon || selectedGeneralIcons.length > 0) && (
                                        <div ref={iconsWrapperRef} className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                                            {form.option_icon && (
                                                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm shrink-0 flex items-center gap-0.5">
                                                    <span className="animate-siren origin-center mr-0.5">🚨</span>
                                                    급구
                                                </span>
                                            )}
                                            {selectedGeneralIcons.map(icon => (
                                                <span key={icon} className="text-[12px] font-black shrink-0 px-1 py-0.5 rounded border border-gray-200 bg-white">{icon}</span>
                                            ))}
                                        </div>
                                    )}

                                    {/* 제목 영역 */}
                                    <div className="overflow-hidden w-full whitespace-nowrap relative flex items-center">
                                        <span 
                                            ref={titleRef}
                                            className={`${form.option_highlight ? 'px-1 rounded' : ''} ${marqueeDistance < 0 ? 'animate-marquee-alt' : ''}`}
                                            style={{
                                                ...(form.option_highlight && form.option_highlight_value ? { backgroundColor: form.option_highlight_value } : form.option_highlight ? { backgroundColor: '#fde047' } : {}),
                                                '--marquee-dist': `${marqueeDistance}px`
                                            } as React.CSSProperties}
                                        >
                                            {form.title || '공고 제목이 표시됩니다'}
                                        </span>
                                    </div>
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
                        
                        <div className="bg-orange-50 border border-orange-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-[12.5px] shadow-2xs">
                            <div className="flex items-center gap-2 font-bold text-gray-700">
                                <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                                <span>현재 공고 노출 상태: {isCurrentlyActive ? (
                                    <span className="text-blue-600 font-extrabold">노출 중 (남은 {remainingDays}일, ~{initialData?.expires_at?.split('T')[0]})</span>
                                ) : (
                                    <span className="text-gray-500 font-medium">미노출 / 만료됨</span>
                                )}</span>
                            </div>
                            <div className="font-black text-orange-600 bg-white px-3 py-1 rounded-lg border border-orange-200 shadow-2xs">
                                {form.exposure_period === 0 ? (
                                    `기존 노출만료일 유지: ~${initialData?.expires_at?.split('T')[0]}`
                                ) : (
                                    `결제 완료 시 노출 종료일: ~${(() => {
                                        const base = isCurrentlyActive ? new Date(initialData.expires_at) : new Date();
                                        const addDays = form.is_subscription ? 30 : (form.exposure_period || 30);
                                        base.setDate(base.getDate() + addDays);
                                        return base.toISOString().split('T')[0];
                                    })()} (+${form.is_subscription ? 30 : form.exposure_period}일 연장)`
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 2 & 3. 노출 기간 패키지 및 추가 옵션 */}
                    <div className="w-full flex flex-col gap-6">
                        {/* 노출 기간 선택 */}
                        <section className="order-2">
                            <h4 className="text-[15px] font-black text-gray-800 mb-3 flex items-center justify-between">
                                <span>2. 노출 기간 패키지 {isCurrentlyActive ? '(선택)' : '(필수)'}</span>
                                <span className="text-[12px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                    {isCurrentlyActive ? `기존 기간유지 또는 연장 선택` : `장기 결제 시 최대 20% 할인!`}
                                </span>
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    ...(isCurrentlyActive ? [{ id: 0, label: '기간 연장 안 함', sub: false, isZero: true }] : []),
                                    { id: 30, label: '30일', sub: false, isZero: false },
                                    { id: 60, label: '60일', sub: false, isZero: false },
                                    { id: 90, label: '90일', sub: false, isZero: false },
                                    { id: 'sub', label: '매월 자동 연장 (구독)', sub: true, isZero: false },
                                ].map(opt => {
                                    const isSelected = opt.isZero 
                                        ? (form.exposure_period === 0 && !form.is_subscription)
                                        : opt.sub 
                                            ? form.is_subscription 
                                            : (!form.is_subscription && form.exposure_period === opt.id);

                                    const days = opt.sub ? 30 : opt.id as number;
                                    let price = opt.isZero ? 0 : getPrice(`OPTION_PRICE_BASE_PERIOD_${days}`, days === 30 ? 70000 : days === 60 ? 125000 : 189000);
                                    if (opt.sub) price = Math.floor(price * 0.95);

                                    return (
                                        <button 
                                            key={opt.id}
                                            type="button"
                                            onClick={() => {
                                                if (opt.isZero) {
                                                    update('is_subscription', false);
                                                    update('exposure_period', 0);
                                                } else if (opt.sub) {
                                                    update('is_subscription', true);
                                                    update('exposure_period', 30);
                                                } else {
                                                    update('is_subscription', false);
                                                    update('exposure_period', opt.id as 30|60|90);
                                                }
                                            }}
                                            className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                        >
                                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                                {opt.sub && <Clock className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />}
                                                <span className={`text-[14.5px] font-black ${isSelected ? 'text-primary' : 'text-gray-700'}`}>{opt.label}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-center">
                                                {opt.isZero && <span className="text-[11px] font-bold text-gray-500">기존 남은 {remainingDays}일 유지 (0 P)</span>}
                                                {opt.sub && <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">첫 달 5% 할인</span>}
                                                {!opt.sub && !opt.isZero && days === 60 && <span className="text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded">10% OFF</span>}
                                                {!opt.sub && !opt.isZero && days === 90 && <span className="text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded">20% OFF</span>}
                                                {!opt.isZero && <span className="text-[13.5px] font-bold text-gray-500">{price.toLocaleString()} P</span>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* 부가 옵션 선택 */}
                        <section className="order-1">
                            <h4 className="text-[15px] font-black text-gray-800 mb-3 flex items-center justify-between">
                                <span>1. 주목도 100배! 추가 옵션</span>
                                <span className="text-[12px] font-bold text-gray-400">
                                    {form.exposure_period === 0 ? `남은 ${remainingDays}일 일할 비례 적용` : `선택한 기간 적용`}
                                </span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {optionsList.map(opt => {
                                    const fieldKey = `option_${opt.id}` as keyof AdFormData;
                                    const isChecked = opt.id === 'general_icons' 
                                        ? selectedGeneralIcons.length > 0
                                        : !!form[fieldKey];
                                    
                                    const unitPrice = getPrice(opt.priceKey, opt.defaultPrice);
                                    let displayPrice = unitPrice;

                                    if (form.exposure_period === 0 && isCurrentlyActive) {
                                        displayPrice = Math.floor(unitPrice * (remainingDays / 30));
                                    }

                                    if (opt.id === 'general_icons' && selectedGeneralIcons.length > 0) {
                                        displayPrice = displayPrice * selectedGeneralIcons.length;
                                    }

                                    return (
                                        <div 
                                            key={opt.id} 
                                            onClick={() => {
                                                if (opt.id === 'general_icons') {
                                                    if (selectedGeneralIcons.length > 0) {
                                                        update('option_general_icons', []);
                                                    } else {
                                                        update('option_general_icons', [generalIcons[0] || '🔥핫이슈']);
                                                    }
                                                } else {
                                                    const newVal = !isChecked;
                                                    update(fieldKey, newVal);
                                                    if (newVal) {
                                                        if (opt.id === 'color' && !form.option_color_value) update('option_color_value', TITLE_COLORS[0]);
                                                        if (opt.id === 'bg' && !form.option_bg_value) update('option_bg_value', BG_COLORS[0]);
                                                        if (opt.id === 'highlight' && !form.option_highlight_value) update('option_highlight_value', HIGHLIGHT_COLORS[0]);
                                                    }
                                                }
                                            }}
                                            className={`flex items-center justify-between py-2.5 px-3 rounded-xl border transition-all cursor-pointer select-none ${
                                                isChecked 
                                                    ? 'border-indigo-500 bg-indigo-50/20 shadow-xs' 
                                                    : 'border-[#f1f1f5] bg-[#fafafc] hover:bg-white hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                                    isChecked 
                                                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                                                        : 'border-gray-300 bg-white'
                                                }`}>
                                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className={`text-[13px] font-black tracking-tight truncate ${isChecked ? 'text-gray-900' : 'text-gray-700'}`}>
                                                        {opt.label}
                                                    </span>
                                                    <span className="text-[10.5px] text-gray-400 font-medium truncate">
                                                        {opt.desc}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 ml-1" onClick={e => e.stopPropagation()}>
                                                {isChecked && (opt.id === 'color' || opt.id === 'highlight' || opt.id === 'bg') && (
                                                    <div className="relative w-4 h-4 rounded-full overflow-hidden border border-gray-300 shadow-xs cursor-pointer shrink-0" title="색상 변경">
                                                        <input 
                                                            type="color" 
                                                            value={form[`option_${opt.id}_value` as keyof AdFormData] as string || '#ffffff'}
                                                            onChange={(e) => update(`option_${opt.id}_value` as keyof AdFormData, e.target.value)}
                                                            className="absolute -top-2 -left-2 w-8 h-8 cursor-pointer border-0 p-0"
                                                        />
                                                    </div>
                                                )}

                                                {isChecked && opt.id === 'general_icons' && (
                                                    <div className="relative">
                                                        <button 
                                                            type="button" 
                                                            onClick={(e) => { e.stopPropagation(); setActivePicker(activePicker === opt.id ? null : opt.id); }}
                                                            className="px-1.5 py-0.5 rounded border border-gray-300 bg-white text-[10.5px] font-bold text-gray-600 hover:bg-gray-50 shadow-xs"
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
                                                                    {generalIcons.map(icon => {
                                                                        const selected = selectedGeneralIcons.includes(icon);
                                                                        return (
                                                                            <button key={icon} type="button"
                                                                                onClick={() => {
                                                                                    let current = [...selectedGeneralIcons];
                                                                                    if (selected) {
                                                                                        current = current.filter(x => x !== icon);
                                                                                        if (current.length === 0) return;
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

                                                <span className="text-[12.5px] font-black text-indigo-600 text-right whitespace-nowrap">+{displayPrice.toLocaleString()} P</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                </div>

                {/* 하단 결제 바 및 상세 결제 내역 (Breakdown) */}
                <div className="p-4 md:p-6 border-t border-gray-200 bg-white shrink-0 flex flex-col gap-3">
                    {/* 상세 결제 포인트 계산 내역 카드 */}
                    <div className="w-full bg-gray-50 rounded-xl p-3.5 border border-gray-200/80">
                        <div className="text-[12.5px] font-black text-gray-700 mb-2 flex items-center justify-between">
                            <span>📊 결제 포인트 상세 계산 내역</span>
                            <span className="text-[11px] font-bold text-gray-500">
                                {form.exposure_period === 0 ? `(남은 ${remainingDays}일 일할 비례 적용)` : `(${form.exposure_period || 30}일 연장 기준)`}
                            </span>
                        </div>
                        <div className="space-y-1.5 text-[12px]">
                            {breakdown.items.map((it, idx) => (
                                <div key={idx} className="flex items-center justify-between text-gray-600">
                                    <span className="font-semibold text-gray-800">• {it.label} <span className="text-[10.5px] text-gray-400 font-normal">({it.desc})</span></span>
                                    <span className={`font-bold ${it.amount > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
                                        {it.amount > 0 ? `+${it.amount.toLocaleString()} P` : '0 P'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-1">
                        <div className="flex flex-col items-center sm:items-start">
                            <span className="text-[13px] text-gray-500 font-bold mb-0.5">총 예상 결제 포인트</span>
                            <div className="text-2xl md:text-3xl font-black text-primary tracking-tight flex items-baseline gap-2">
                                {breakdown.total.toLocaleString()} <span className="text-lg font-bold">P</span>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="text-[12px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-medium">내 잔여 포인트: {loadingPoints ? '조회 중...' : `${userPoints.toLocaleString()} P`}</span>
                                {breakdown.total > userPoints && !loadingPoints && (
                                    <span className="text-[12px] text-red-500 font-bold animate-pulse">잔액 부족!</span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none h-14 px-6 rounded-xl font-bold text-[15px] border-gray-300">
                                취소
                            </Button>
                            <Button 
                                onClick={handleFinalSubmit}
                                disabled={saving || (breakdown.total > userPoints && !loadingPoints)}
                                className="flex-1 sm:flex-none h-14 px-8 bg-primary hover:bg-orange-600 text-white rounded-xl font-black text-[16px] shadow-lg shadow-primary/30 transition-all flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        처리 중...
                                    </>
                                ) : (
                                    '결제 및 최종 등록하기'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
