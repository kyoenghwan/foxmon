'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Loader2, Save, Image, Info, DollarSign, MapPin, AlignLeft, Layers, Crown, Upload, RefreshCw, MessageSquare, Bold, Italic, Underline, AlignCenter, AlignLeft as AlignLeftIcon, AlignRight, List, ListOrdered, Palette, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AdFormData {
    id?: string;
    company: string;
    title: string;
    location: string;
    pay: string;
    image: string;
    color: string;
    tier: 'PREMIUM' | 'SPECIAL' | 'GENERAL';
    auto_renew: boolean;
    theme?: string;
    effect_intensity?: 'high' | 'medium' | 'low' | 'none';
    logo_url?: string;
    // 상세 내용
    work_type: string;
    work_hours: string;
    benefits: string;
    contact_info: string;
    address: string;
    detail_content: string;
}

// 프리미엄 테마 목록 (premium-job-card.tsx THEME_CONFIG 기반)
const PREMIUM_THEMES = [
    { key: 'gold', label: 'GOLD', color: '#EAB308', bg: 'bg-yellow-400' },
    { key: 'neon', label: 'NEON', color: '#9333EA', bg: 'bg-purple-500' },
    { key: 'neon_crazy', label: 'CRAZY', color: '#EF4444', bg: 'bg-gradient-to-r from-red-500 to-blue-500' },
    { key: 'fire', label: 'FIRE', color: '#DC2626', bg: 'bg-red-600' },
    { key: 'ice', label: 'ICE', color: '#06B6D4', bg: 'bg-cyan-500' },
    { key: 'emerald', label: 'EMERALD', color: '#059669', bg: 'bg-emerald-600' },
    { key: 'glitch', label: 'CYBER', color: '#D946EF', bg: 'bg-fuchsia-600' },
    { key: 'storm', label: 'STORM', color: '#2563EB', bg: 'bg-blue-600' },
    { key: 'ghost', label: 'GHOST', color: '#6B7280', bg: 'bg-gray-500' },
    { key: 'forest', label: 'FOREST', color: '#15803D', bg: 'bg-green-700' },
    { key: 'ocean', label: 'OCEAN', color: '#1E40AF', bg: 'bg-blue-800' },
    { key: 'sakura', label: 'SAKURA', color: '#F472B6', bg: 'bg-pink-400' },
    { key: 'galaxy', label: 'GALAXY', color: '#312E81', bg: 'bg-indigo-900' },
    { key: 'sun', label: 'SUNLIGHT', color: '#F97316', bg: 'bg-orange-400' },
    { key: 'lava', label: 'LAVA', color: '#991B1B', bg: 'bg-red-800' },
    { key: 'matrix', label: 'MATRIX', color: '#166534', bg: 'bg-green-800' },
    { key: 'retro', label: 'RETRO', color: '#EC4899', bg: 'bg-pink-500' },
    { key: 'diamond', label: 'DIAMOND', color: '#60A5FA', bg: 'bg-blue-300' },
    { key: 'platinum', label: 'PLATINUM', color: '#9CA3AF', bg: 'bg-gray-300' },
    { key: 'aura', label: 'AURA', color: '#E879F9', bg: 'bg-fuchsia-400' },
    { key: 'candy', label: 'CANDY', color: '#FB7185', bg: 'bg-rose-400' },
    { key: 'toxic', label: 'TOXIC', color: '#84CC16', bg: 'bg-lime-500' },
];

const TIER_OPTIONS = [
    { value: 'PREMIUM' as const, label: '프리미엄', price: 300000, priceLabel: '300,000P', desc: '최상단 테마 강조 노출', emoji: '👑' },
    { value: 'SPECIAL' as const, label: '스페셜', price: 150000, priceLabel: '150,000P', desc: '상단 우선 노출', emoji: '⭐' },
    { value: 'GENERAL' as const, label: '일반', price: 50000, priceLabel: '50,000P', desc: '기본 노출', emoji: '📋' },
];

const COLOR_PALETTE = [
    '#FF6B35', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
    '#EC4899', '#14B8A6', '#EF4444', '#6366F1', '#1F2937',
];

const EFFECT_OPTIONS = [
    { value: 'high', label: '강', desc: '최대 애니메이션' },
    { value: 'medium', label: '중', desc: '적당한 효과' },
    { value: 'low', label: '약', desc: '은은한 효과' },
    { value: 'none', label: '없음', desc: '정적 표시' },
];

interface AdEditorFormProps {
    initialData?: Partial<AdFormData>;
    onSubmit: (data: AdFormData) => Promise<void>;
    isNew?: boolean;
}

// ─── 리치 텍스트 에디터 컴포넌트 ───
function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showBgColorPicker, setShowBgColorPicker] = useState(false);

    const exec = useCallback((command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    }, [onChange]);

    const ToolBtn = ({ cmd, icon, title, active }: { cmd: string; icon: React.ReactNode; title: string; active?: boolean }) => (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); exec(cmd); }}
            className={`w-8 h-8 flex items-center justify-center rounded-md transition-all hover:bg-gray-200 ${active ? 'bg-gray-200 text-primary' : 'text-gray-600'}`}
            title={title}
        >
            {icon}
        </button>
    );

    const textColors = ['#000000', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#FFFFFF'];
    const bgColors = ['transparent', '#FEF3C7', '#DCFCE7', '#DBEAFE', '#F3E8FF', '#FCE7F3', '#FEE2E2', '#F3F4F6'];

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* 툴바 */}
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
                <ToolBtn cmd="bold" icon={<Bold className="w-3.5 h-3.5" />} title="굵게" />
                <ToolBtn cmd="italic" icon={<Italic className="w-3.5 h-3.5" />} title="기울임" />
                <ToolBtn cmd="underline" icon={<Underline className="w-3.5 h-3.5" />} title="밑줄" />

                <div className="w-px h-5 bg-gray-300 mx-1" />

                <ToolBtn cmd="justifyLeft" icon={<AlignLeftIcon className="w-3.5 h-3.5" />} title="좌측 정렬" />
                <ToolBtn cmd="justifyCenter" icon={<AlignCenter className="w-3.5 h-3.5" />} title="가운데 정렬" />
                <ToolBtn cmd="justifyRight" icon={<AlignRight className="w-3.5 h-3.5" />} title="우측 정렬" />

                <div className="w-px h-5 bg-gray-300 mx-1" />

                <ToolBtn cmd="insertUnorderedList" icon={<List className="w-3.5 h-3.5" />} title="목록" />
                <ToolBtn cmd="insertOrderedList" icon={<ListOrdered className="w-3.5 h-3.5" />} title="순서 목록" />

                <div className="w-px h-5 bg-gray-300 mx-1" />

                {/* 글자 크기 */}
                <select
                    onChange={(e) => exec('fontSize', e.target.value)}
                    className="text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-md px-1.5 py-1 outline-none cursor-pointer"
                    defaultValue="3"
                >
                    <option value="1">작게</option>
                    <option value="3">보통</option>
                    <option value="5">크게</option>
                    <option value="7">매우 크게</option>
                </select>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                {/* 글자 색상 */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => { setShowColorPicker(!showColorPicker); setShowBgColorPicker(false); }}
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-600"
                        title="글자 색상"
                    >
                        <Type className="w-3.5 h-3.5" />
                    </button>
                    {showColorPicker && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 flex gap-1">
                            {textColors.map(c => (
                                <button key={c} type="button" onMouseDown={(e) => { e.preventDefault(); exec('foreColor', c); setShowColorPicker(false); }}
                                    className="w-6 h-6 rounded-full border border-gray-200 hover:scale-125 transition-transform"
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* 배경 색상 */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => { setShowBgColorPicker(!showBgColorPicker); setShowColorPicker(false); }}
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-600"
                        title="배경 색상"
                    >
                        <Palette className="w-3.5 h-3.5" />
                    </button>
                    {showBgColorPicker && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 flex gap-1">
                            {bgColors.map(c => (
                                <button key={c} type="button" onMouseDown={(e) => { e.preventDefault(); exec('hiliteColor', c); setShowBgColorPicker(false); }}
                                    className="w-6 h-6 rounded-full border border-gray-200 hover:scale-125 transition-transform"
                                    style={{ backgroundColor: c === 'transparent' ? '#fff' : c }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 에디터 본문 */}
            <div
                ref={editorRef}
                contentEditable
                className="min-h-[200px] px-4 py-3 text-[14px] leading-relaxed outline-none focus:bg-gray-50/50 transition-colors"
                dangerouslySetInnerHTML={{ __html: value }}
                onInput={() => {
                    if (editorRef.current) onChange(editorRef.current.innerHTML);
                }}
                onBlur={() => {
                    if (editorRef.current) onChange(editorRef.current.innerHTML);
                }}
            />
        </div>
    );
}

// ─── 메인 폼 컴포넌트 ───
export function AdEditorForm({ initialData, onSubmit, isNew = false }: AdEditorFormProps) {
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'banner' | 'detail'>('banner');
    const [form, setForm] = useState<AdFormData>({
        company: '',
        title: '',
        location: '',
        pay: '',
        image: '',
        color: '#FF6B35',
        tier: 'GENERAL',
        auto_renew: false,
        theme: 'gold',
        effect_intensity: 'medium',
        logo_url: '',
        work_type: '',
        work_hours: '',
        benefits: '',
        contact_info: '',
        address: '',
        detail_content: '',
        ...initialData,
    });

    const update = (key: keyof AdFormData, value: any) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        if (!form.company || !form.title || !form.location || !form.pay) {
            alert('업체명, 공고 제목, 위치, 급여는 필수 입력 항목입니다.');
            return;
        }
        setSaving(true);
        try {
            await onSubmit(form);
        } finally {
            setSaving(false);
        }
    };

    const currentTier = TIER_OPTIONS.find(t => t.value === form.tier)!;
    const discountedPrice = Math.floor(currentTier.price * 0.95);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('로고는 5MB 이하로 업로드해주세요.'); return; }
        const reader = new FileReader();
        reader.onloadend = (event) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 200;
                let w = img.width, h = img.height;
                if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
                else { if (h > MAX) { w *= MAX / h; h = MAX; } }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (ctx) { ctx.drawImage(img, 0, 0, w, h); update('logo_url', canvas.toDataURL('image/png', 0.9)); }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-6">
            {/* 탭 메뉴 */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('banner')}
                    className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-all ${activeTab === 'banner' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    📢 배너 정보
                </button>
                <button
                    onClick={() => setActiveTab('detail')}
                    className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-all ${activeTab === 'detail' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    📋 공고 상세 내용
                </button>
            </div>

            {/* ═══════ 배너 정보 탭 ═══════ */}
            {activeTab === 'banner' && (
                <div className="space-y-6">

                    {/* ① 배너 미리보기 (실제 홈 화면 카드와 동일 구조) */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h3 className="font-black text-[15px] text-gray-800 mb-4 flex items-center gap-2">
                            <Image className="w-4 h-4 text-primary" />
                            배너 미리보기
                        </h3>

                        {/* 실제 카드 미리보기 */}
                        {(() => {
                            const themeColor = form.tier === 'PREMIUM' && form.theme
                                ? PREMIUM_THEMES.find(t => t.key === form.theme)?.color || '#EAB308'
                                : form.tier === 'SPECIAL' ? (form.color || '#FF6B35') : '#6B7280';
                            const themeLabel = form.tier === 'PREMIUM' && form.theme
                                ? PREMIUM_THEMES.find(t => t.key === form.theme)?.label || 'PREMIUM'
                                : '';
                            const isPremiumOrSpecial = form.tier !== 'GENERAL';

                            return (
                                <div className="w-full max-w-[220px]">
                                    <div className="relative h-[130px] w-full p-[3px]">
                                        {/* 테마 배경 글로우 */}
                                        {isPremiumOrSpecial && (
                                            <div className="absolute inset-0 overflow-hidden rounded-xl z-0"
                                                style={{ backgroundColor: themeColor, opacity: 0.5 }} />
                                        )}

                                        {/* 메인 카드 바디 */}
                                        <div className="relative h-full w-full rounded-[calc(0.75rem-3px)] overflow-hidden shadow-sm p-2.5 flex flex-col justify-between z-10 bg-white"
                                            style={{ borderWidth: 2, borderColor: isPremiumOrSpecial ? themeColor + '80' : '#e5e7eb' }}>

                                            {/* 카드 내부 은은한 그라디언트 (프리미엄/스페셜) */}
                                            {isPremiumOrSpecial && (
                                                <div className="absolute inset-0 pointer-events-none z-0"
                                                    style={{ background: `linear-gradient(135deg, ${themeColor}08 0%, transparent 60%)` }} />
                                            )}

                                            {/* 콘텐츠: 로고 + 업체명 */}
                                            <div className="flex gap-2 mb-1.5 relative z-10">
                                                <div className="w-[80px] h-[40px] shrink-0 overflow-hidden bg-gray-50 flex items-center justify-center rounded-sm"
                                                    style={{ borderWidth: 1, borderColor: isPremiumOrSpecial ? themeColor + '30' : '#f3f4f6' }}>
                                                    {(form.logo_url || form.image) ? (
                                                        <div className="w-full h-full bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${form.logo_url || form.image})` }} />
                                                    ) : (
                                                        <div className="text-gray-300 font-black text-[10px] bg-gray-100 w-full h-full flex items-center justify-center">NO LOGO</div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                                                    <h3 className="font-black text-[14px] truncate tracking-tight"
                                                        style={{ color: isPremiumOrSpecial ? themeColor : '#111827' }}>
                                                        {form.company || '업체명'}
                                                    </h3>
                                                    <div className="flex items-center text-[11px] text-gray-500 truncate tracking-tight mt-0.5">
                                                        <span className="shrink-0 px-1 py-0.5 leading-none mr-1.5 font-bold rounded-[2px]"
                                                            style={{
                                                                color: isPremiumOrSpecial ? themeColor : '#2b6cb0',
                                                                borderWidth: 1,
                                                                borderColor: isPremiumOrSpecial ? themeColor + '50' : '#2b6cb0',
                                                                backgroundColor: isPremiumOrSpecial ? themeColor + '10' : '#ebf8ff'
                                                            }}>
                                                            {(form.location || '지역').split(' ')[0]}
                                                        </span>
                                                        <span className="truncate font-medium">
                                                            {(form.location || '전지역').split(' ').slice(1).join(' ') || '전지역'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 공고 제목 */}
                                            <div className="mb-1.5 flex-1 flex flex-col justify-center relative z-10">
                                                <p className="text-[12px] line-clamp-1 leading-[1.4] font-bold tracking-tight inline-block w-fit px-1 rounded-[2px]"
                                                    style={{
                                                        color: '#1f2937',
                                                        backgroundColor: isPremiumOrSpecial ? themeColor + '15' : '#bbf7d050'
                                                    }}>
                                                    {form.title || '공고 제목을 입력하세요'}
                                                </p>
                                            </div>

                                            {/* 급여 */}
                                            <div className="flex items-end justify-between mt-auto relative z-10">
                                                <div className="flex items-center text-[13px] font-bold text-gray-900 truncate tracking-tight gap-1.5">
                                                    <span className="shrink-0 text-white text-[10px] px-1.5 py-0.5 rounded-sm shadow-sm"
                                                        style={{ backgroundColor: isPremiumOrSpecial ? themeColor : '#805ad5' }}>
                                                        TC
                                                    </span>
                                                    <span className="text-gray-800">{form.pay || '급여 정보'}</span>
                                                </div>
                                                <div className="shrink-0 flex items-center border px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-gray-50 text-gray-600 border-gray-300">
                                                    2회 180일
                                                </div>
                                            </div>

                                            {/* 테마 뱃지 (프리미엄) */}
                                            {form.tier === 'PREMIUM' && themeLabel && (
                                                <div className="absolute top-0 right-0 z-20">
                                                    <div className="flex items-center justify-center text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg min-w-[50px] shadow-sm"
                                                        style={{ backgroundColor: themeColor }}>
                                                        {themeLabel}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* ② 광고 등급 선택 (한 줄 탭) */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h3 className="font-black text-[15px] text-gray-800 mb-4 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-primary" />
                            광고 등급 선택
                        </h3>

                        {/* 한 줄 탭 형태 */}
                        <div className="flex gap-2">
                            {TIER_OPTIONS.map(t => (
                                <button
                                    key={t.value}
                                    onClick={() => update('tier', t.value)}
                                    className={`flex-1 py-3 px-3 rounded-xl border-2 transition-all text-center ${
                                        form.tier === t.value
                                            ? t.value === 'PREMIUM' ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-300'
                                            : t.value === 'SPECIAL' ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-300'
                                            : 'border-gray-500 bg-gray-50 ring-2 ring-gray-300'
                                            : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="text-[15px]">{t.emoji}</span>
                                    <p className={`font-black text-[13px] mt-0.5 ${form.tier === t.value ? 'text-gray-900' : 'text-gray-600'}`}>{t.label}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{t.desc}</p>
                                    <p className={`text-[12px] font-black mt-1 ${form.tier === t.value ? 'text-primary' : 'text-gray-400'}`}>{t.priceLabel}/30일</p>
                                </button>
                            ))}
                        </div>

                        {/* 사이드/상단 배너 안내 */}
                        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <div className="text-[12px] text-blue-700 leading-relaxed">
                                <p className="font-bold">📢 사이드 배너 · 상단 메인 배너 광고</p>
                                <p className="mt-0.5">별도 협의가 필요합니다. <span className="font-black text-blue-900">관리자에게 문의</span>해 주세요. (카카오톡: <span className="font-black">@foxmon</span>)</p>
                            </div>
                        </div>

                        {/* 자동 연장 */}
                        <div className="mt-4 bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer flex-1">
                                <input
                                    type="checkbox" checked={form.auto_renew} onChange={e => update('auto_renew', e.target.checked)}
                                    className="w-4 h-4 accent-primary rounded"
                                />
                                <div>
                                    <span className="text-[13px] font-bold text-gray-700 flex items-center gap-1.5">
                                        <RefreshCw className="w-3.5 h-3.5 text-primary" />
                                        자동 연장
                                        <span className="text-[11px] font-black text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">5% 할인</span>
                                    </span>
                                    <p className="text-[11px] text-gray-500 mt-0.5">30일 만료 시 동일 등급으로 자동 재등록됩니다.</p>
                                </div>
                            </label>
                            {form.auto_renew && (
                                <div className="text-right shrink-0">
                                    <p className="text-[11px] text-gray-400 line-through">{currentTier.priceLabel}</p>
                                    <p className="text-[14px] font-black text-primary">{discountedPrice.toLocaleString()}P</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ③ 등급별 배너 설정 */}
                    {form.tier === 'PREMIUM' && (
                        <div className="bg-white rounded-2xl border border-yellow-200 p-6 space-y-5">
                            <h3 className="font-black text-[15px] text-gray-800 flex items-center gap-2">
                                <Crown className="w-4 h-4 text-yellow-500" />
                                프리미엄 테마 설정
                            </h3>

                            {/* 테마 선택 */}
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-2 block">테마 선택</label>
                                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-11 gap-1.5">
                                    {PREMIUM_THEMES.map(theme => (
                                        <button
                                            key={theme.key}
                                            onClick={() => update('theme', theme.key)}
                                            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border-2 transition-all text-center ${
                                                form.theme === theme.key ? 'border-gray-900 bg-gray-100 ring-1 ring-gray-400' : 'border-gray-100 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.color }} />
                                            <span className="text-[9px] font-black text-gray-600 leading-none">{theme.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 효과 강도 */}
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-2 block">효과 강도</label>
                                <div className="flex gap-2">
                                    {EFFECT_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => update('effect_intensity', opt.value)}
                                            className={`flex-1 py-2.5 rounded-lg border-2 text-center transition-all ${
                                                form.effect_intensity === opt.value
                                                    ? 'border-primary bg-orange-50 text-primary'
                                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}
                                        >
                                            <p className="font-black text-[13px]">{opt.label}</p>
                                            <p className="text-[10px] mt-0.5">{opt.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 로고 업로드 */}
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-2 block">업체 로고</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                                        {form.logo_url ? (
                                            <img src={form.logo_url} alt="로고" className="w-full h-full object-contain" />
                                        ) : (
                                            <Upload className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-[12px] font-bold text-gray-700 cursor-pointer transition-colors">
                                            <Upload className="w-3.5 h-3.5" /> 로고 업로드
                                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                        </label>
                                        <p className="text-[10px] text-gray-400 mt-1">PNG/JPG, 5MB 이하</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {form.tier === 'SPECIAL' && (
                        <div className="bg-white rounded-2xl border border-purple-200 p-6 space-y-5">
                            <h3 className="font-black text-[15px] text-gray-800 flex items-center gap-2">
                                <span className="text-[16px]">⭐</span>
                                스페셜 배너 설정
                            </h3>

                            {/* 색상 선택 */}
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-2 block">배너 색상</label>
                                <div className="flex gap-2 flex-wrap">
                                    {COLOR_PALETTE.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => update('color', color)}
                                            className={`w-9 h-9 rounded-full transition-all ${form.color === color ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* 로고 업로드 */}
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-2 block">업체 로고</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                                        {form.logo_url ? (
                                            <img src={form.logo_url} alt="로고" className="w-full h-full object-contain" />
                                        ) : (
                                            <Upload className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-[12px] font-bold text-gray-700 cursor-pointer transition-colors">
                                            <Upload className="w-3.5 h-3.5" /> 로고 업로드
                                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                        </label>
                                        <p className="text-[10px] text-gray-400 mt-1">PNG/JPG, 5MB 이하</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {form.tier === 'GENERAL' && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <div className="text-center py-4">
                                <p className="text-[14px] font-bold text-gray-600">📋 일반 광고는 기본 정보만 표시됩니다.</p>
                                <p className="text-[12px] text-gray-400 mt-1">테마, 로고, 색상 등의 커스텀 기능은 스페셜/프리미엄 등급에서 사용 가능합니다.</p>
                            </div>
                        </div>
                    )}

                    {/* ④ 기본 정보 입력 */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <h3 className="font-black text-[15px] text-gray-800 flex items-center gap-2">
                            <Info className="w-4 h-4 text-primary" />
                            기본 정보
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">업체명 <span className="text-red-500">*</span></label>
                                <input
                                    type="text" value={form.company} onChange={e => update('company', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium outline-none focus:border-primary"
                                    placeholder="예: 강남 스웨디시"
                                />
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">공고 제목 <span className="text-red-500">*</span></label>
                                <input
                                    type="text" value={form.title} onChange={e => update('title', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium outline-none focus:border-primary"
                                    placeholder="예: 경력무관! 즉시출근 가능한분"
                                />
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> 지역 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text" value={form.location} onChange={e => update('location', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium outline-none focus:border-primary"
                                    placeholder="예: 서울 강남구"
                                />
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> 급여 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text" value={form.pay} onChange={e => update('pay', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium outline-none focus:border-primary"
                                    placeholder="예: 일 30~50만원"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">배너 이미지 URL</label>
                            <input
                                type="text" value={form.image} onChange={e => update('image', e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium outline-none focus:border-primary"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ 공고 상세 내용 탭 ═══════ */}
            {activeTab === 'detail' && (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <h3 className="font-black text-[15px] text-gray-800 flex items-center gap-2">
                            <AlignLeft className="w-4 h-4 text-primary" />
                            근무 조건
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">근무 형태</label>
                                <input type="text" value={form.work_type} onChange={e => update('work_type', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                                    placeholder="예: 상주, 출퇴근, 파트타임" />
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">근무 시간</label>
                                <input type="text" value={form.work_hours} onChange={e => update('work_hours', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                                    placeholder="예: 오전 10시 ~ 오후 8시" />
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">문의 연락처</label>
                                <input type="text" value={form.contact_info} onChange={e => update('contact_info', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                                    placeholder="예: 010-0000-0000" />
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">업체 주소</label>
                                <input type="text" value={form.address} onChange={e => update('address', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                                    placeholder="예: 서울시 강남구 역삼동 123-4" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">복리후생 및 혜택</label>
                            <input type="text" value={form.benefits} onChange={e => update('benefits', e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                                placeholder="예: 식사 제공, 주차 가능, 4대보험" />
                        </div>

                        {/* 리치 텍스트 에디터 */}
                        <div>
                            <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">상세 공고 내용</label>
                            <RichTextEditor
                                value={form.detail_content}
                                onChange={(html) => update('detail_content', html)}
                            />
                            <p className="text-[11px] text-gray-400 mt-1.5">배너를 클릭하면 이 내용이 팝업으로 표시됩니다. 글꼴, 색상, 정렬 등을 자유롭게 편집할 수 있습니다.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 저장 버튼 */}
            <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => window.history.back()} className="font-bold h-11 px-6 rounded-xl">
                    취소
                </Button>
                <Button onClick={handleSubmit} disabled={saving} className="font-black h-11 px-8 rounded-xl shadow-md">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    {isNew ? '광고 등록하기' : '광고 저장하기'}
                </Button>
            </div>
        </div>
    );
}
