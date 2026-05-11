'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Loader2, Save, Image, ImageIcon, Eye, Info, DollarSign, MapPin, AlignLeft, Layers, Crown, Upload, RefreshCw, MessageSquare, Bold, Italic, Underline, AlignCenter, AlignLeft as AlignLeftIcon, AlignRight, List, ListOrdered, Palette, Type, Paintbrush, FolderOpen, Briefcase, Tag, Phone, User, MessageCircle, CheckCircle2, Building2, X } from 'lucide-react';
import { Loader2, Save, Image, ImageIcon, Eye, Info, DollarSign, MapPin, AlignLeft, Layers, Crown, Upload, RefreshCw, MessageSquare, Bold, Italic, Underline, AlignCenter, AlignLeft as AlignLeftIcon, AlignRight, List, ListOrdered, Palette, Type, Paintbrush, FolderOpen, Briefcase, Tag, Phone, User, MessageCircle, CheckCircle2, Building2, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PremiumJobCard } from '@/components/home/premium-job-card';
import { QA_GET_COMMON_CODES, CodeItem } from '@/src/atoms/qa/master/QA_GET_COMMON_CODES';
import { userSettingsAction } from '@/lib/actions';
import { compressImageFile } from '@/lib/image-utils';
import { JobPaymentModal } from './JobPaymentModal';
import { LoadMyDataModal } from './LoadMyDataModal';
import dynamic from 'next/dynamic';

// Fabric.js는 브라우저 전용이므로 SSR 비활성화
const AdCanvasEditor = dynamic(() => import('@/components/biz/AdCanvasEditor'), { ssr: false });
const SunEditor = dynamic(() => import('suneditor-react'), { 
    ssr: false, 
    loading: () => <div className="min-h-[400px] flex items-center justify-center bg-gray-50 border rounded-xl"><Loader2 className="w-6 h-6 animate-spin text-gray-400"/></div> 
});
import 'suneditor/dist/css/suneditor.min.css';

export interface AdFormData {
    id?: string;
    company: string;
    title: string;
    location: string;
    pay: string;
    pay_type?: string;
    pay_amount?: string;
    image: string;
    color: string;
    bg_opacity?: string;
    tier: 'PREMIUM_MAIN' | 'PREMIUM' | 'SPECIAL' | 'GENERAL' | 'SIDE' | 'AD_GENERAL';
    auto_renew: boolean;
    theme?: string;
    effect_intensity?: string;
    action_type?: string;
    logo_url?: string;
    // 상세 내용
    work_type: string;
    work_hours: string;
    benefits: string;
    contact_info: string;
    address: string;
    detail_content: string;
    detail_bg_image?: string;
    design_mode?: 'canvas' | 'html';
    ai_prompt?: string;
    
    // 신규 추가 항목 (경쟁사 벤치마킹)
    manager_name?: string;
    contact_phone?: string;
    phone_type?: string;
    kakao_id?: string;
    line_id?: string;
    wechat_id?: string;
    telegram_id?: string;
    category_1?: string;
    category_2?: string;
    amenities?: string[];
    keywords?: string[];
    employment_type?: string;
    business_registration_url?: string;
    is_address_same?: boolean;
    business_name?: string;
    premium_banner_mode?: 'upload' | 'template';
    
    // 결제 및 부가 옵션 (팝업)
    exposure_period?: 30 | 60 | 90;
    
    option_bold?: boolean;
    option_bold_period?: 30 | 60 | 90;
    
    option_color?: boolean;
    option_color_value?: string;
    option_color_period?: 30 | 60 | 90;
    
    option_bg?: boolean;
    option_bg_value?: string;
    option_bg_period?: 30 | 60 | 90;
    
    option_highlight?: boolean;
    option_highlight_value?: string;
    option_highlight_period?: 30 | 60 | 90;
    
    option_icon?: boolean; // 급구 아이콘
    option_icon_period?: 30 | 60 | 90;
    
    option_general_icons?: string[]; // 최대 2개
    option_general_icons_period?: 30 | 60 | 90;
    
    option_jump?: boolean;
    option_jump_period?: 30 | 60 | 90;
    
    // 결제 업데이트 플래그
    _isPayment?: boolean;
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

interface TierOption {
    value: 'PREMIUM_MAIN' | 'SIDE' | 'PREMIUM' | 'SPECIAL' | 'GENERAL' | 'AD_GENERAL';
    label: string;
    price: number;
    priceLabel: string;
    desc: string;
    emoji: string;
}

const TIER_GROUPS: { title: string; options: TierOption[] }[] = [
    {
        title: '상단 고정 배너 (플랫폼 메인)',
        options: [
            { value: 'PREMIUM_MAIN' as const, label: '프리미엄 메인', price: 500000, priceLabel: '500,000P', desc: '최상단 롤링 배너 (AI 배경 생성 제공)', emoji: '👑' },
            { value: 'SIDE' as const, label: '사이드', price: 200000, priceLabel: '200,000P', desc: '우측 사이드 세로 배너', emoji: '🚀' },
        ]
    },
    {
        title: '본문 리스트 광고 (시선 강탈용)',
        options: [
            { value: 'PREMIUM' as const, label: '프리미엄', price: 300000, priceLabel: '300,000P', desc: '본문 최상단 테마 강조 노출', emoji: '💎' },
            { value: 'SPECIAL' as const, label: '스페셜', price: 150000, priceLabel: '150,000P', desc: '프리미엄 하단 우선 노출', emoji: '⭐' },
            { value: 'AD_GENERAL' as const, label: '일반 광고', price: 50000, priceLabel: '50,000P', desc: '기본 리스트 노출', emoji: '📋' },
        ]
    }
];

const TIER_OPTIONS: TierOption[] = TIER_GROUPS.flatMap(g => g.options);

const COLOR_PALETTE = [
    '#FF6B35', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
    '#EC4899', '#14B8A6', '#EF4444', '#6366F1', '#1F2937',
];

const ACTION_OPTIONS = [
    { value: 'shimmer', label: '✨ 반짝임', desc: '빛이 지나감' },
    { value: 'pulse', label: '🫀 숨쉬기', desc: '전체적으로 깜빡임' },
    { value: 'neon', label: '⚛️ 네온 펄스', desc: '네온사인 깜빡임' },
    { value: 'flicker', label: '🌃 플리커', desc: '불안정하게 깜빡임' },
    { value: 'fire', label: '🔥 이글거림', desc: '불타는 듯한 효과' },
    { value: 'ice', label: '❄️ 얼음 떨림', desc: '차갑게 떨리는 효과' },
    { value: 'emerald', label: '💎 에메랄드', desc: '고급스러운 빛 흐름' },
    { value: 'glitch', label: '⚡ 글리치', desc: '사이버펑크 흔들림' },
    { value: 'forest', label: '🍃 숲의 일렁임', desc: '바람에 흔들리는 느낌' },
    { value: 'ocean', label: '🌊 파도 흐름', desc: '부드러운 물결 흐름' },
    { value: 'sakura', label: '🌸 벚꽃 흩날림', desc: '꽃잎 떨어지는 느낌' },
    { value: 'galaxy', label: '🌌 은하수', desc: '별빛 반짝임' },
    { value: 'sun', label: '☀️ 태양 눈부심', desc: '강렬한 빛 번짐' },
    { value: 'lava', label: '🌋 마그마', desc: '용암이 끓는 느낌' },
    { value: 'matrix', label: '⌨️ 매트릭스', desc: '디지털 코드 흐름' },
    { value: 'retro', label: '🕺 레트로 펄스', desc: '복고풍 반짝임' },
    { value: 'diamond', label: '💎 다이아몬드', desc: '날카로운 빛 반사' },
    { value: 'platinum', label: '✨ 플래티넘', desc: '백금빛 흐름' },
    { value: 'aura', label: '🔮 신비한 오라', desc: '주변이 일렁이는 기운' },
    { value: 'candy', label: '🍬 캔디 팝', desc: '톡톡 튀는 젤리 느낌' },
    { value: 'royal', label: '👑 로얄 럭셔리', desc: '고급스러운 보라빛 심연' },
    { value: 'autumn', label: '🍂 가을빛', desc: '따스한 빛의 번짐' },
    { value: 'toxic', label: '👾 맹독 슬라임', desc: '녹아내리는 끈적임' },
    { value: 'storm', label: '🌩️ 뇌우 번개', desc: '강렬한 번개 번쩍임' },
    { value: 'ghost', label: '👻 유령의 떨림', desc: '음산한 투명도 변화' },
    { value: 'rainbow-border', label: '🌈 무지개', desc: '화려한 테두리 회전' },
    { value: 'none', label: '⛔ 없음', desc: '애니메이션 끄기' },
];

const EFFECT_OPTIONS = [
    { value: 'high', label: '강', desc: '최대 애니메이션' },
    { value: 'medium', label: '중', desc: '적당한 효과' },
    { value: 'low', label: '약', desc: '은은한 효과' },
];

const BG_OPACITY_OPTIONS = [
    { value: '0', label: '0% (투명)' },
    { value: '5', label: '5% (아주 연하게)' },
    { value: '10', label: '10% (연하게)' },
    { value: '20', label: '20% (조금 진하게)' },
    { value: '40', label: '40% (진하게)' },
];

interface AdEditorFormProps {
    initialData?: Partial<AdFormData>;
    onSubmit: (data: AdFormData) => Promise<void>;
    isNew?: boolean;
    mode?: 'JOB' | 'AD';
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
export function AdEditorForm({ initialData, onSubmit, isNew = false, mode = 'AD' }: AdEditorFormProps) {
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'banner' | 'detail'>('banner');
    const [activeModal, setActiveModal] = useState<'basic' | 'theme' | 'animation' | 'color' | 'mainDesign' | null>(null);
    
    // HTML 모드 전용 상태
    const [htmlEditorHeight, setHtmlEditorHeight] = useState(450);
    const [previewHtml, setPreviewHtml] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    
    // 사업자 인증 상태
    const [isBizVerified, setIsBizVerified] = useState(false);
    const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
    const [manualBizNumber, setManualBizNumber] = useState('');
    const [manualCeoName, setManualCeoName] = useState('');
    const [manualBizName, setManualBizName] = useState('');
    
    // 모드 전환 시 이전 데이터를 임시 저장하기 위한 ref
    const canvasContentRef = useRef<string>(initialData?.detail_content?.startsWith('{"version":') ? initialData.detail_content : '');
    const htmlContentRef = useRef<string>(!initialData?.detail_content?.startsWith('{"version":') ? (initialData?.detail_content || '') : '');
    
    // 초기 모드 결정
    const initialDesignMode = initialData?.detail_content 
        ? (initialData.detail_content.startsWith('{"version":') ? 'canvas' : 'html') 
        : 'canvas';

    // effect_intensity 복합 데이터 파싱 ('강도::액션' 형식)
    const initialIntensityData = initialData?.effect_intensity || 'medium';
    let initIntensity = 'medium';
    let initAction = 'shimmer';
    if (initialIntensityData.includes('::')) {
        const parts = initialIntensityData.split('::');
        initIntensity = parts[0] || 'medium';
        initAction = parts[1] || 'shimmer';
    } else if (['high', 'medium', 'low', 'none'].includes(initialIntensityData)) {
        initIntensity = initialIntensityData;
        initAction = 'shimmer';
    } else {
        initIntensity = 'medium';
        initAction = initialIntensityData;
    }

    // color 및 bg_opacity 파싱 ('#FF6B35::10' 형식)
    const initialColorData = initialData?.color || '#FF6B35';
    let initColor = '#FF6B35';
    let initBgOpacity = '10'; // 기본값 10%
    if (initialColorData.includes('::')) {
        const parts = initialColorData.split('::');
        initColor = parts[0] || '#FF6B35';
        initBgOpacity = parts[1] || '10';
    } else {
        initColor = initialColorData;
        initBgOpacity = '10';
    }

    const { effect_intensity: _ignore, color: _ignoreColor, ...restInitialData } = initialData || {};

    const [form, setForm] = useState<AdFormData>({
        company: '',
        title: '',
        location: '',
        pay: '',
        pay_type: '월급',
        pay_amount: '',
        image: '',
        color: initColor,
        bg_opacity: initBgOpacity,
        tier: 'AD_GENERAL',
        auto_renew: false,
        theme: 'gold',
        effect_intensity: initIntensity,
        action_type: initAction,
        logo_url: '',
        work_type: '',
        work_hours: '',
        benefits: '',
        contact_info: '',
        address: '',
        detail_content: '',
        design_mode: initialDesignMode,
        amenities: [],
        keywords: [],
        ...restInitialData,
    });

    const [regions, setRegions] = useState<CodeItem[]>([]);
    const [categories1, setCategories1] = useState<CodeItem[]>([]);
    const [categories2, setCategories2] = useState<CodeItem[]>([]);
    const [amenitiesList, setAmenitiesList] = useState<CodeItem[]>([]);
    const [keywordsList, setKeywordsList] = useState<CodeItem[]>([]);
    const [employmentTypes, setEmploymentTypes] = useState<CodeItem[]>([]);

    const [selectedSido, setSelectedSido] = useState<string>('');
    const [selectedSigungus, setSelectedSigungus] = useState<string[]>([]);
    const [isLoadDataModalOpen, setIsLoadDataModalOpen] = useState(false);
    
    // DB에서 동적으로 불러온 등급 가격 상태
    const [tierGroups, setTierGroups] = useState(TIER_GROUPS);
    const [tierOptions, setTierOptions] = useState(TIER_OPTIONS);

    // 초기 데이터 로딩 시 마스터 데이터 전체 로딩
    useEffect(() => {
        const fetchMasterData = async () => {
            const res = await QA_GET_COMMON_CODES(undefined, true);
            if (res.success && res.data) {
                setRegions(res.data.filter(c => c.list_type === 'JOB_REGION_1' || c.list_type === 'JOB_REGION_2'));
                setCategories1(res.data.filter(c => c.list_type === 'CATEGORY_1'));
                setCategories2(res.data.filter(c => c.list_type === 'CATEGORY_2'));
                setAmenitiesList(res.data.filter(c => c.list_type === 'AMENITY'));
                setKeywordsList(res.data.filter(c => c.list_type === 'KEYWORD'));
                setEmploymentTypes(res.data.filter(c => c.list_type === 'EMPLOYMENT_TYPE'));
            }
        };
        const fetchUserProfile = async () => {
            if (isNew) {
                const res = await userSettingsAction('GET_PROFILE');
                if (res.success && res.data) {
                    const profile = res.data;
                    if (profile.is_business_verified) {
                        setIsBizVerified(true);
                        setForm(prev => ({
                            ...prev,
                            business_name: profile.verified_business_name,
                            company: profile.verified_business_name, // 하위 호환성
                        }));
                    }
                }
            }
        };

        const fetchTierPrices = async () => {
            const { GET_POINT_POLICIES } = await import('@/app/actions/pointPolicyActions');
            const res = await GET_POINT_POLICIES();
            if (res.success && res.data) {
                const getPrice = (key: string, def: number) => res.data.find(p => p.config_key === key)?.config_value ?? def;
                
                const updatedGroups = TIER_GROUPS.map(group => ({
                    ...group,
                    options: group.options.map(opt => {
                        const price = getPrice(`TIER_PRICE_${opt.value}`, opt.price);
                        return {
                            ...opt,
                            price,
                            priceLabel: price.toLocaleString() + 'P'
                        };
                    })
                }));
                setTierGroups(updatedGroups);
                setTierOptions(updatedGroups.flatMap(g => g.options));
            }
        };

        fetchMasterData();
        fetchUserProfile();
        fetchTierPrices();
    }, [isNew]);

    useEffect(() => {
        // location이 "서울 강남구,서초구" 형태일 때 분리
        if (form.location) {
            const parts = form.location.split(' ');
            if (parts.length >= 2) {
                setSelectedSido(parts[0]);
                setSelectedSigungus(parts.slice(1).join(' ').split(',').filter(Boolean));
            } else {
                setSelectedSido(parts[0]);
                setSelectedSigungus([]);
            }
        }
    }, [initialData?.location]);

    const update = (key: keyof AdFormData, value: any) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // 지역 선택 핸들러
    const handleSidoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const sido = e.target.value;
        setSelectedSido(sido);
        setSelectedSigungus([]);
        update('location', sido);
    };

    const handleSigunguChange = (sigungu: string) => {
        let newSigungus = [...selectedSigungus];
        if (newSigungus.includes(sigungu)) {
            newSigungus = newSigungus.filter(s => s !== sigungu);
        } else {
            newSigungus.push(sigungu);
        }
        setSelectedSigungus(newSigungus);
        update('location', `${selectedSido} ${newSigungus.join(',')}`.trim());
    };

    const handleDesignModeSwitch = (mode: 'canvas' | 'html') => {
        // 기존 작성 내용 백업
        if (form.design_mode === 'canvas') {
            canvasContentRef.current = form.detail_content;
        } else {
            htmlContentRef.current = form.detail_content;
        }
        
        // 상태 변경
        update('design_mode', mode);
        
        // 백업된 내용 불러오기
        update('detail_content', mode === 'canvas' ? canvasContentRef.current : htmlContentRef.current);
    };

    // 급여 업데이트 핸들러
    const handlePayChange = (type: string, amount: string) => {
        update('pay_type', type);
        if (type === '협의') {
            update('pay_amount', '');
            update('pay', '추후협의');
        } else {
            const rawValue = amount.replace(/[^0-9]/g, '');
            const formattedAmount = rawValue ? parseInt(rawValue, 10).toLocaleString() : '';
            update('pay_amount', formattedAmount);
            update('pay', formattedAmount ? `${type} ${formattedAmount}` : '');
        }
    };

    const handleSubmit = async () => {
        if (!form.company || !form.title || !form.location || !form.pay) {
            alert('업체명, 공고 제목, 위치, 급여는 필수 입력 항목입니다.');
            return;
        }
        const isPremiumMainUpload = form.tier === 'PREMIUM_MAIN' && form.premium_banner_mode === 'upload';
        
        if (isPremiumMainUpload) {
            if (!form.image) {
                alert('배너 이미지를 등록해주세요. (배너 정보 탭)');
                return;
            }
        } else if (form.tier !== 'GENERAL') {
            if (!form.logo_url && !form.image) {
                alert('업체 로고를 등록해주세요. (배너 정보 탭)');
                return;
            }
        }

        if (!form.detail_content || form.detail_content === '<p><br></p>') {
            alert('광고 상세 내용을 작성하거나 이미지를 첨부해주세요.');
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form };
            if (payload.action_type && payload.effect_intensity) {
                payload.effect_intensity = `${payload.effect_intensity}::${payload.action_type}`;
            } else if (payload.action_type) {
                payload.effect_intensity = `medium::${payload.action_type}`;
            }
            
            // color 필드에 투명도 결합
            if (payload.color && payload.bg_opacity) {
                payload.color = `${payload.color}::${payload.bg_opacity}`;
            }
            
            await onSubmit(payload);
        } finally {
            setSaving(false);
        }
    };

    const currentTier = tierOptions.find(t => t.value === form.tier) || tierOptions[0];
    const discountedPrice = Math.floor(currentTier.price * 0.95);

    const sidoOptions = regions.filter(r => !r.parent_code_value);
    const sidoCode = regions.find(r => r.code_name === selectedSido)?.code_value;
    const sigunguOptions = sidoCode ? regions.filter(r => r.parent_code_value === sidoCode) : [];

    const handleLogoRequest = () => {
        alert('로고 제작 대행 문의는 카카오톡 고객센터(@foxmon)로 상호명과 함께 연락해 주세요.\n전문 디자이너가 원장님만의 맞춤형 타이포그래피 로고를 제작해 드립니다!');
    };

    const handleLoadJobData = (jobData: any) => {
        setForm(prev => ({
            ...prev,
            title: jobData.title || prev.title,
            company: jobData.company_name || prev.company,
            detail_content: jobData.detail_content || prev.detail_content,
            design_mode: jobData.design_mode || prev.design_mode,
            logo_url: jobData.logo_url || prev.logo_url,
        }));
        setIsLoadDataModalOpen(false);
        if (jobData.design_mode) {
            handleDesignModeSwitch(jobData.design_mode as any);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        try {
            // 로고는 최대 300px 크기로 충분하며 PNG 포맷 유지(투명도 지원)
            const compressedBase64 = await compressImageFile(file, { maxWidthOrHeight: 300, quality: 0.9, format: 'image/png' });
            update('logo_url', compressedBase64);
        } catch (error) {
            console.error('로고 이미지 압축 실패:', error);
            alert('이미지 처리 중 오류가 발생했습니다.');
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        try {
            // 풀사이즈 배너 이미지는 가로 800px 정도 권장, JPEG 포맷으로 용량 최적화
            const compressedBase64 = await compressImageFile(file, { maxWidthOrHeight: 800, quality: 0.85, format: 'image/jpeg' });
            // image 필드를 풀사이즈 배너 이미지 용도로 사용
            update('image', compressedBase64);
        } catch (error) {
            console.error('배너 이미지 압축 실패:', error);
            alert('이미지 처리 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="space-y-6">
            <LoadMyDataModal
                isOpen={isLoadDataModalOpen}
                onClose={() => setIsLoadDataModalOpen(false)}
                onSelect={handleLoadJobData}
                sourceType="JOB"
            />
            
            {/* 탭 메뉴 */}
            {mode === 'AD' && (
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
                        📋 광고 상세 내용
                    </button>
                </div>
            )}

            {/* ═══════ 배너 정보 탭 ═══════ */}
            {(mode === 'JOB' || activeTab === 'banner') && (
                <div className="space-y-6">

                    {/* ① 광고 등급 선택 (UI 간소화 및 그룹 분리) */}
                    {mode === 'AD' && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                            <h3 className="font-black text-[15px] text-gray-800 mb-1 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary" />
                                광고 등급 선택
                            </h3>

                            <div className="space-y-4">
                                {tierGroups.map((group, gIdx) => (
                                    <div key={gIdx} className="space-y-2">
                                        <h4 className="text-[12px] font-bold text-gray-500 bg-gray-50 inline-block px-2 py-0.5 rounded-md">
                                            {group.title}
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {group.options.map(t => (
                                                <button
                                                    key={t.value}
                                                    onClick={() => update('tier', t.value)}
                                                    className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                                                        form.tier === t.value
                                                            ? t.value.includes('PREMIUM') ? 'border-yellow-500 bg-yellow-50 ring-1 ring-yellow-200'
                                                            : t.value === 'SPECIAL' ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-200'
                                                            : 'border-gray-500 bg-gray-50 ring-1 ring-gray-200'
                                                            : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[16px] leading-none">{t.emoji}</span>
                                                        <span className={`font-black text-[14px] ${form.tier === t.value ? 'text-gray-900' : 'text-gray-600'}`}>
                                                            {t.label} 
                                                        </span>
                                                    </div>
                                                    <div className={`text-[12px] font-bold ${form.tier === t.value ? 'text-primary' : 'text-gray-400'}`}>
                                                        {t.priceLabel}
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 font-medium mt-1 w-full text-center truncate px-1">
                                                        {t.desc}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ② 배너 미리보기 & 로고 (상단) / 기본정보 (하단) */}
                    <div className="flex flex-col gap-6">
                        
                        {/* 상단: 미리보기 + 로고 (mode === 'AD'일 때만) */}
                        {mode === 'AD' && (
                            <>
                                {/* PREMIUM_MAIN 전용: 배너 제작 방식 선택 토글 */}
                                {form.tier === 'PREMIUM_MAIN' && (
                                    <div className="bg-gray-50 rounded-xl p-2 flex gap-1 w-full sm:w-fit mb-2 border border-gray-100 shadow-sm mx-auto">
                                        <button
                                            type="button"
                                            onClick={() => update('premium_banner_mode', 'template')}
                                            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                                                form.premium_banner_mode !== 'upload' ? 'bg-white text-primary shadow-sm ring-1 ring-primary/20' : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            ✨ 템플릿으로 만들기
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => update('premium_banner_mode', 'upload')}
                                            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                                                form.premium_banner_mode === 'upload' ? 'bg-white text-primary shadow-sm ring-1 ring-primary/20' : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            🖼️ 배너 직접 업로드
                                        </button>
                                    </div>
                                )}

                                <div className="flex flex-wrap justify-center gap-6">
                                    
                                    {/* 배너 미리보기 영역 */}
                                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                                    <h3 className="font-black text-[15px] text-gray-800 mb-4 flex items-center gap-2 justify-center">
                                        <Image className="w-4 h-4 text-primary" />
                                        배너 미리보기
                                    </h3>

                                    <div className="w-full flex justify-center pointer-events-none">
                                        {(() => {
                                            const isPremium = form.tier === 'PREMIUM' || form.tier === 'PREMIUM_MAIN';
                                            const isSide = form.tier === 'SIDE';
                                            const isSpecial = form.tier === 'SPECIAL';
                                            const isGeneral = form.tier === 'GENERAL';
                                            
                                            // PREMIUM_MAIN 이면서 직접 업로드 모드일 때
                                            if (form.tier === 'PREMIUM_MAIN' && form.premium_banner_mode === 'upload') {
                                                return (
                                                    <label className="w-[800px] max-w-full aspect-[2/1] rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary hover:bg-blue-50/50 transition-all pointer-events-auto">
                                                        {form.image ? (
                                                            <img src={form.image} alt="배너 이미지" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-2 p-6 text-center">
                                                                <Upload className="w-10 h-10 text-gray-400 group-hover:text-primary transition-colors" />
                                                                <span className="text-gray-500 font-bold">여기를 클릭하여 메인 배너를 업로드하세요</span>
                                                                <span className="text-[12px] text-gray-400">권장 사이즈: 가로 800px, 세로 400px (2:1 비율)</span>
                                                            </div>
                                                        )}
                                                        <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                                                    </label>
                                                );
                                            }

                                            // 기존 템플릿 모드 및 다른 등급 배너
                                            if (form.tier === 'PREMIUM_MAIN') {
                                                const hasLogo = !!form.logo_url;
                                                const logoUrl = form.logo_url;
                                                
                                                let payType = '';
                                                let payAmount = form.pay || '급여 정보';
                                                if (payAmount.includes(']') && payAmount.startsWith('[')) {
                                                    const splitIndex = payAmount.indexOf(']');
                                                    payType = payAmount.substring(1, splitIndex).trim();
                                                    payAmount = payAmount.substring(splitIndex + 1).trim();
                                                } else if (payAmount === '추후협의') {
                                                    payType = '협의';
                                                    payAmount = '추후협의';
                                                } else {
                                                    const parts = payAmount.split(' ');
                                                    if (parts.length > 1 && ['시급', '일급', '주급', '월급', '건당', '협의', '기타'].includes(parts[0])) {
                                                        payType = parts[0];
                                                        payAmount = parts.slice(1).join(' ');
                                                    }
                                                }

                                                // fallback 그라데이션 대신 선택한 테마에 맞춰 매핑 (선택되지 않으면 기본 인디고)
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
                                                    <div className="flex justify-center">
                                                        <div className={`flex-shrink-0 w-[400px] max-w-full h-[180px] rounded-2xl ${bgGradient} p-6 shadow-md relative overflow-hidden group`}>
                                                            {/* 템플릿 모드 배경 이미지 */}
                                                            {form.image && (
                                                                <div 
                                                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 mix-blend-overlay opacity-60"
                                                                    style={{ backgroundImage: `url(${form.image})` }}
                                                                />
                                                            )}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
                                                            <div className="relative z-20 h-full flex flex-col justify-between pointer-events-auto">
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-3 mb-1">
                                                                        {hasLogo && (
                                                                            <div className="w-[60px] h-[40px] bg-white rounded-md p-1 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
                                                                                <div className="w-full h-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${logoUrl})` }} />
                                                                            </div>
                                                                        )}
                                                                        <h3 className="text-white font-black text-2xl line-clamp-1 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                                                            {form.company || '업체명'}
                                                                        </h3>
                                                                    </div>
                                                                    <p className="text-white/95 text-base font-bold line-clamp-2 max-w-[90%] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-snug">
                                                                        {form.title || '광고 제목을 입력하세요'}
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-col gap-1.5 mt-auto">
                                                                    <p className="text-white/70 text-[11px] font-bold tracking-wider">{form.location || '전지역'}</p>
                                                                    <div className="flex items-center gap-2">
                                                                        {payType && (
                                                                            <span className="px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-white text-[11px] font-black tracking-wide border border-white/10 shadow-sm">
                                                                                {payType}
                                                                            </span>
                                                                        )}
                                                                        <span className="text-white font-black text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                                                                            {payAmount}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="w-full flex justify-center">
                                                    <div style={{ width: (isSide ? '150px' : '200px'), maxWidth: '100%' }}>
                                                    <PremiumJobCard
                                                        id="preview"
                                                        company={form.company || '업체명'}
                                                        title={form.title || '광고 제목을 입력하세요'}
                                                        location={form.location || '전지역'}
                                                        category={form.category_1}
                                                        pay={form.pay || '급여 정보'}
                                                        image={form.logo_url || form.image}
                                                        impactType={isGeneral ? 'none' : ((form.theme as any) || 'gold')}
                                                        effectIntensity={isSpecial || isGeneral || form.action_type === 'none' ? 'none' : `${form.effect_intensity || 'medium'}::${form.action_type || 'shimmer'}`}
                                                        isSide={isSide}
                                                        hideLogo={isGeneral}
                                                        tier={form.tier}
                                                        customColor={form.color}
                                                        bgOpacity={form.bg_opacity}
                                                    />
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* 로고 업로드 (PREMIUM_MAIN 이고 upload 모드일 때는 로고 업로드 숨김) */}
                                {form.tier !== 'GENERAL' && !(form.tier === 'PREMIUM_MAIN' && form.premium_banner_mode === 'upload') && (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center mx-auto sm:mx-0 h-full">
                                        <h3 className="font-black text-[15px] text-gray-800 mb-4 flex items-center gap-2 justify-center w-full">
                                            <Image className="w-4 h-4 text-primary" />
                                            업체 로고
                                        </h3>
                                        
                                        <label className="relative group cursor-pointer w-full flex justify-center mt-auto">
                                            <div className="w-[100px] h-[100px] rounded-2xl border-2 border-dashed overflow-hidden bg-gray-50 flex items-center justify-center transition-all border-gray-300 group-hover:border-primary group-hover:bg-blue-50/50">
                                                {form.logo_url ? (
                                                    <img src={form.logo_url} alt="로고" className="w-full h-full object-contain" />
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <Upload className="w-7 h-7 text-gray-300 group-hover:text-primary transition-colors mb-1" />
                                                        <span className="text-[11px] font-bold text-gray-400 group-hover:text-primary">
                                                            직접 업로드
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                        </label>

                                        <p className="text-[10px] text-gray-400 mt-2 text-center leading-relaxed mb-auto">
                                            PNG/JPG 지원<br/>
                                            가로 형태(1.5:1 비율) 권장
                                        </p>

                                        <button 
                                            type="button"
                                            onClick={handleLogoRequest}
                                            className="mt-3 w-full py-2 rounded-lg bg-gray-900 hover:bg-black text-white text-[12px] flex items-center justify-center gap-1.5 shadow-sm transition-all"
                                        >
                                            <Paintbrush className="w-4 h-4 text-blue-200" />
                                            <span className="font-bold">제작문의</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            </>
                        )}

                        {/* 설정 버튼 그룹 및 아코디언 (PREMIUM_MAIN 업로드 모드에서는 숨김) */}
                        {!(form.tier === 'PREMIUM_MAIN' && form.premium_banner_mode === 'upload') && (
                            <>
                                {/* 설정 버튼 그룹 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button 
                                type="button" 
                                onClick={() => setActiveModal(activeModal === 'basic' ? null : 'basic')} 
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all group ${activeModal === 'basic' ? 'border-primary bg-orange-50' : 'border-gray-100 bg-white hover:border-primary hover:bg-orange-50'}`}
                            >
                                <Info className={`w-6 h-6 transition-colors ${activeModal === 'basic' ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
                                <span className={`text-[13px] font-bold ${activeModal === 'basic' ? 'text-primary' : 'text-gray-700 group-hover:text-primary'}`}>
                                    {mode === 'JOB' ? '기본 정보 입력' : '기본 정보 설정'}
                                </span>
                            </button>
                            
                            {mode === 'AD' && !(form.tier === 'PREMIUM_MAIN' && form.premium_banner_mode === 'upload') && (
                                <>
                                    {(form.tier === 'PREMIUM' || form.tier === 'SPECIAL' || form.tier === 'PREMIUM_MAIN') && (
                                        <button type="button" onClick={() => setActiveModal(activeModal === 'theme' ? null : 'theme')} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all group ${activeModal === 'theme' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-100 bg-white hover:border-yellow-500 hover:bg-yellow-50'}`}>
                                            <Crown className={`w-6 h-6 transition-colors ${activeModal === 'theme' ? 'text-yellow-500' : 'text-gray-400 group-hover:text-yellow-500'}`} />
                                            <span className={`text-[13px] font-bold ${activeModal === 'theme' ? 'text-yellow-600' : 'text-gray-700 group-hover:text-yellow-600'}`}>테마 설정</span>
                                        </button>
                                    )}
                                    {(form.tier === 'PREMIUM' || form.tier === 'PREMIUM_MAIN') && (
                                        <button type="button" onClick={() => setActiveModal(activeModal === 'animation' ? null : 'animation')} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all group ${activeModal === 'animation' ? 'border-purple-500 bg-purple-50' : 'border-gray-100 bg-white hover:border-purple-500 hover:bg-purple-50'}`}>
                                            <span className="text-[24px]">✨</span>
                                            <span className={`text-[13px] font-bold ${activeModal === 'animation' ? 'text-purple-600' : 'text-gray-700 group-hover:text-purple-600'}`}>애니메이션 설정</span>
                                        </button>
                                    )}
                                    {mode === 'AD' && form.tier === 'PREMIUM_MAIN' && form.premium_banner_mode !== 'upload' && (
                                        <button type="button" onClick={() => setActiveModal(activeModal === 'mainDesign' ? null : 'mainDesign')} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all group ${activeModal === 'mainDesign' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 bg-white hover:border-indigo-500 hover:bg-indigo-50'}`}>
                                            <Crown className={`w-6 h-6 transition-colors ${activeModal === 'mainDesign' ? 'text-indigo-500' : 'text-gray-400 group-hover:text-indigo-500'}`} />
                                            <span className={`text-[13px] font-bold ${activeModal === 'mainDesign' ? 'text-indigo-600' : 'text-gray-700 group-hover:text-indigo-600'}`}>메인 디자인 설정</span>
                                        </button>
                                    )}
                                    {/* PREMIUM_MAIN 은 배경색 설정 대신 테마를 사용 (기존 로직 유지) */}
                                    {form.tier !== 'PREMIUM_MAIN' && (
                                        <button type="button" onClick={() => setActiveModal(activeModal === 'color' ? null : 'color')} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all group ${activeModal === 'color' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-blue-500 hover:bg-blue-50'}`}>
                                            <Palette className={`w-6 h-6 transition-colors ${activeModal === 'color' ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-500'}`} />
                                            <span className={`text-[13px] font-bold ${activeModal === 'color' ? 'text-blue-600' : 'text-gray-700 group-hover:text-blue-600'}`}>배경색 설정</span>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>


                        {/* 기본 정보 입력 폼 (인라인 아코디언) */}
                        {activeModal === 'basic' && (
                            <div className="bg-white rounded-2xl border border-primary/50 p-6 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-black text-[15px] text-gray-800 flex items-center gap-2">
                                        <Info className="w-4 h-4 text-primary" />
                                        {mode === 'JOB' ? '공고 기본 정보' : '기본 정보 입력 (배너용)'}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsLoadDataModalOpen(true)}
                                            className="text-[12px] font-bold text-white bg-primary px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1.5 shadow-sm"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            기존 구인 공고 불러오기
                                        </button>
                                        <button type="button" onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="md:col-span-1">
                                    <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">닉네임 (업체명) <span className="text-red-500">*</span></label>
                                    <input
                                        type="text" value={form.company} onChange={e => update('company', e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium outline-none focus:border-primary"
                                        placeholder="예: 강남 스웨디시"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="text-[12px] font-bold text-gray-600 mb-1.5 block flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> 지역 <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex flex-col gap-2 relative">
                                        <div className="flex gap-2">
                                            <select
                                                value={selectedSido}
                                                onChange={handleSidoChange}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium outline-none focus:border-primary"
                                            >
                                                <option value="">시/도 선택</option>
                                                {regions.filter(r => r.list_type === 'JOB_REGION_1').map(sido => (
                                                    <option key={sido.code_value} value={sido.code_name}>{sido.code_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {selectedSido === '해외' ? (
                                            <input
                                                type="text"
                                                value={selectedSigungus[0] || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setSelectedSigungus(val ? [val] : []);
                                                    update('location', `${selectedSido} ${val}`.trim());
                                                }}
                                                placeholder="국가 및 지역 입력 (예: 미국)"
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium outline-none focus:border-primary mt-2"
                                            />
                                        ) : selectedSido ? (
                                            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-[160px] overflow-y-auto grid grid-cols-2 gap-2">
                                                {regions.filter(r => {
                                                    const sido = regions.find(s => s.code_name === selectedSido && s.list_type === 'JOB_REGION_1');
                                                    return r.list_type === 'JOB_REGION_2' && r.parent_code_value === sido?.code_value;
                                                }).map(sigungu => (
                                                    <label key={sigungu.code_value} className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-700 hover:text-primary">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSigungus.includes(sigungu.code_name)}
                                                            onChange={() => handleSigunguChange(sigungu.code_name)}
                                                            className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                                                        />
                                                        <span className="truncate">{sigungu.code_name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="text-[12px] font-bold text-gray-600 mb-1.5 block flex items-center gap-1">
                                        <Briefcase className="w-3 h-3" /> 업종 (선택)
                                    </label>
                                    <select
                                        value={form.category_1 || ''}
                                        onChange={e => update('category_1', e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium outline-none focus:border-primary"
                                    >
                                        <option value="">선택 안함</option>
                                        {categories1.map(cat => (
                                            <option key={cat.code_value} value={cat.code_name}>{cat.code_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-[12px] font-bold text-gray-600 mb-1.5 block flex items-center gap-1">
                                        <Type className="w-3 h-3" /> 채용(공고) 제목 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text" value={form.title} onChange={e => update('title', e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium outline-none focus:border-primary"
                                        placeholder="예: 최고 대우 보장! 초보 환영합니다 (40자 제한)"
                                        maxLength={40}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-[12px] font-bold text-gray-600 mb-1.5 block flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" /> 급여조건 <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={form.pay_type}
                                            onChange={e => handlePayChange(e.target.value, form.pay_amount || '')}
                                            className="w-[120px] px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium outline-none focus:border-primary"
                                        >
                                            <option value="시급">시급</option>
                                            <option value="일급">일급</option>
                                            <option value="주급">주급</option>
                                            <option value="월급">월급</option>
                                            <option value="건당">건당</option>
                                            <option value="협의">협의</option>
                                            <option value="기타">기타</option>
                                        </select>
                                        <div className="flex-1 relative">
                                            <input
                                                type="text" value={form.pay_amount || ''} 
                                                onChange={e => handlePayChange(form.pay_type || '월급', e.target.value)}
                                                disabled={form.pay_type === '협의'}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium outline-none focus:border-primary pr-8 disabled:bg-gray-100 disabled:text-gray-400"
                                                placeholder={form.pay_type === '협의' ? "입력 불필요" : "금액 또는 조건 입력"}
                                            />
                                            {form.pay_type !== '협의' && (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-gray-500 font-medium">원</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </div>
                        )}
                        </>
                    )}
                    </div>

                    {/* ③ 등급별 배너 디자인 설정 */}
                    {activeModal === 'mainDesign' && mode === 'AD' && form.tier === 'PREMIUM_MAIN' && form.premium_banner_mode !== 'upload' && (
                        <div className="bg-white rounded-2xl border border-indigo-500/50 p-6 space-y-5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black text-[15px] text-gray-800 flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-indigo-500" />
                                    프리미엄 메인 디자인 설정
                                </h3>
                                <button type="button" onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* AI 배경 생성기 */}
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                                <h4 className="font-bold text-[13px] text-purple-900 mb-2 flex items-center gap-1.5">
                                    <span className="text-base">✨</span> AI 퀄리티 배경 생성 (베타)
                                </h4>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="text"
                                        value={form.ai_prompt || ''}
                                        onChange={(e) => update('ai_prompt', e.target.value)}
                                        className="flex-1 px-3 py-2.5 rounded-lg border border-purple-200 text-[13px] outline-none focus:border-purple-500 bg-white placeholder-purple-300"
                                        placeholder="예) 화려한 네온사인, 고급스러운 블랙 앤 골드, 시원한 바다"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!form.ai_prompt) return alert('원하시는 배경의 느낌을 입력해주세요!');
                                            
                                            const btn = document.getElementById('ai-gen-btn');
                                            if (btn) btn.innerHTML = '<span class="animate-spin mr-1">⏳</span> 생성 중...';
                                            
                                            // 임시 모킹
                                            setTimeout(() => {
                                                const keywords = encodeURIComponent(form.ai_prompt || 'neon');
                                                const mockUrl = `https://source.unsplash.com/random/800x600/?${keywords}`;
                                                update('image', mockUrl);
                                                
                                                if (btn) btn.innerHTML = '✨ 배경 적용하기';
                                                alert('AI 배경 생성이 완료되었습니다! 우측 미리보기에서 확인하세요.');
                                            }, 2000);
                                        }}
                                        id="ai-gen-btn"
                                        className="px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[13px] rounded-lg transition-all shadow-sm shrink-0 whitespace-nowrap"
                                    >
                                        ✨ 배경 적용하기
                                    </button>
                                </div>
                                <p className="text-[11px] text-purple-600/70 mt-2 font-medium">
                                    * 입력하신 텍스트를 바탕으로 AI가 최적의 고품질 배경 이미지를 즉시 그려줍니다. (현재는 데모용 샘플 이미지로 대체됩니다)
                                </p>
                            </div>

                            {/* 배경 직접 업로드 */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <h4 className="font-bold text-[13px] text-gray-800 mb-2 flex items-center gap-1.5">
                                    <span className="text-base">🖼️</span> 배경 이미지 직접 업로드
                                </h4>
                                <div className="flex items-center gap-3">
                                    <label className="cursor-pointer px-4 py-2.5 bg-white border border-gray-300 hover:border-primary text-gray-700 hover:text-primary font-bold text-[13px] rounded-lg transition-all shadow-sm">
                                        내 PC에서 파일 선택
                                        <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                                    </label>
                                    <p className="text-[11px] text-gray-500">권장 사이즈: 가로 800px, 세로 400px (JPG/PNG)</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 테마 설정 인라인 아코디언 */}
                    {activeModal === 'theme' && (
                        <div className="bg-white rounded-2xl border border-yellow-500/50 p-6 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-[18px] text-gray-800 flex items-center gap-2">
                                    <Crown className={`w-5 h-5 ${form.tier === 'PREMIUM' ? 'text-yellow-500' : 'text-purple-500'}`} />
                                    {form.tier === 'PREMIUM' ? '프리미엄' : '스페셜'} 테마 설정
                                </h3>
                                <button type="button" onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div>
                                <label className="text-[13px] font-bold text-gray-600 mb-3 block">테마 선택</label>
                                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                    {PREMIUM_THEMES.map(theme => (
                                        <button
                                            key={theme.key}
                                            type="button"
                                            onClick={() => update('theme', theme.key)}
                                            className={`flex flex-col items-center gap-2 py-3 px-1 rounded-xl border-2 transition-all text-center ${
                                                form.theme === theme.key ? 'border-gray-900 bg-gray-100 ring-2 ring-gray-400' : 'border-gray-100 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.color }} />
                                            <span className="text-[10px] font-black text-gray-600 leading-none">{theme.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 애니메이션 설정 인라인 아코디언 */}
                    {activeModal === 'animation' && (
                        <div className="bg-white rounded-2xl border border-purple-500/50 p-6 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-[18px] text-gray-800 flex items-center gap-2">
                                    <span className="text-[20px]">✨</span> 애니메이션 설정
                                </h3>
                                <button type="button" onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[13px] font-bold text-gray-600 mb-3 block">액션(애니메이션) 선택</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {ACTION_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => update('action_type', opt.value)}
                                            className={`py-3 px-2 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center ${
                                                form.action_type === opt.value
                                                    ? 'border-primary bg-orange-50 text-primary ring-1 ring-primary/30'
                                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}
                                        >
                                            <p className="font-black text-[13px] whitespace-nowrap">{opt.label}</p>
                                            <p className="text-[10px] mt-1 text-gray-400 leading-tight">{opt.desc}</p>
                                        </button>
                                    ))}
                                    </div>
                                </div>

                                {form.action_type !== 'none' && (
                                    <div>
                                        <label className="text-[13px] font-bold text-gray-600 mb-3 block">액션 강도</label>
                                        <div className="flex gap-3">
                                        {EFFECT_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => update('effect_intensity', opt.value)}
                                                className={`flex-1 py-3 rounded-xl border-2 text-center transition-all ${
                                                    form.effect_intensity === opt.value
                                                        ? 'border-primary bg-orange-50 text-primary ring-1 ring-primary/30'
                                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                }`}
                                            >
                                                <p className="font-black text-[14px]">{opt.label}</p>
                                                <p className="text-[11px] mt-1 text-gray-400">{opt.desc}</p>
                                            </button>
                                        ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 배경색 설정 인라인 아코디언 */}
                    {activeModal === 'color' && (
                        <div className="bg-white rounded-2xl border border-blue-500/50 p-6 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-[18px] text-gray-800 flex items-center gap-2">
                                    <span className="text-[20px]">🎨</span> 배너 내부 배경색 설정
                                </h3>
                                <button type="button" onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[13px] font-bold text-gray-600 mb-3 block">색상 선택</label>
                                    <div className="flex gap-3 flex-wrap">
                                        {COLOR_PALETTE.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => update('color', color)}
                                                className={`w-12 h-12 rounded-full transition-all ${form.color === color ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <label className="text-[13px] font-bold text-gray-600 mb-3 flex justify-between">
                                        <span>배경 투명도 (적용 농도)</span>
                                        <span className="text-blue-600 font-black text-[15px]">{form.bg_opacity || '10'}%</span>
                                    </label>
                                    <div className="flex items-center gap-4 py-2 px-1">
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="100" 
                                            step="1"
                                            value={form.bg_opacity || '10'} 
                                            onChange={(e) => update('bg_opacity', e.target.value)}
                                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                    </div>
                                    <div className="flex justify-between text-[11px] text-gray-400 font-medium px-1 mt-2">
                                        <span>투명함 (0%)</span>
                                        <span>진하게 (100%)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* ═══════ 공고 상세 내용 탭 ═══════ */}
            {activeTab === 'detail' && (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                        <h3 className="font-black text-[15px] text-gray-800 flex items-center gap-2">
                            <Info className="w-4 h-4 text-primary" />
                            상세 업소 정보
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1.5 flex items-center gap-2">
                                    상호명
                                    {isBizVerified && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-green-100 text-green-700">
                                            <CheckCircle2 className="w-3 h-3 stroke-[3]" /> 인증된 업체
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text" value={form.business_name || ''} 
                                    className={`w-full px-3 py-2.5 border rounded-lg text-[14px] font-medium outline-none bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed`}
                                    placeholder={isBizVerified ? "인증된 상호명" : "하단의 '직접 입력하기'를 이용해주세요"}
                                    readOnly={true}
                                />
                                {!isBizVerified && (
                                    <p className="text-[11px] font-medium text-gray-400 mt-1.5 flex items-center justify-between">
                                        <span>사업자 등록이 아직 안 되어있다면?</span> 
                                        <button type="button" className="text-primary hover:underline font-bold" onClick={() => setIsManualEntryOpen(true)}>직접 입력하기</button>
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block flex items-center gap-1">
                                    <User className="w-3 h-3" /> 담당자 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text" value={form.manager_name || ''} onChange={e => update('manager_name', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium outline-none focus:border-primary"
                                    placeholder="예: 김실장"
                                />
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> 담당자 연락처 <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={form.phone_type || 'mobile'}
                                        onChange={e => update('phone_type', e.target.value)}
                                        className="w-1/3 px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-primary"
                                    >
                                        <option value="mobile">핸드폰</option>
                                        <option value="landline">일반전화</option>
                                    </select>
                                    <input
                                        type="text" value={form.contact_phone || ''} onChange={e => update('contact_phone', e.target.value)}
                                        className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium outline-none focus:border-primary"
                                        placeholder="010-0000-0000"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">상세 주소 (선택)</label>
                                <input type="text" value={form.address} onChange={e => update('address', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                                    placeholder="예: 서울시 강남구 역삼동 123-4" />
                            </div>
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[12px] font-bold text-gray-600 block flex items-center gap-1">
                                    <MessageCircle className="w-3 h-3" /> 메신저 ID
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <input type="text" value={form.kakao_id || ''} onChange={e => update('kakao_id', e.target.value)}
                                        className="w-full px-3 py-2 border border-yellow-200 bg-yellow-50/30 rounded-lg text-[13px] font-medium outline-none focus:border-yellow-400 placeholder:text-yellow-700/50" placeholder="카카오톡 ID" />
                                    <input type="text" value={form.line_id || ''} onChange={e => update('line_id', e.target.value)}
                                        className="w-full px-3 py-2 border border-green-200 bg-green-50/30 rounded-lg text-[13px] font-medium outline-none focus:border-green-400 placeholder:text-green-700/50" placeholder="라인 ID" />
                                    <input type="text" value={form.telegram_id || ''} onChange={e => update('telegram_id', e.target.value)}
                                        className="w-full px-3 py-2 border border-blue-200 bg-blue-50/30 rounded-lg text-[13px] font-medium outline-none focus:border-blue-400 placeholder:text-blue-700/50" placeholder="텔레그램 ID" />
                                    <input type="text" value={form.wechat_id || ''} onChange={e => update('wechat_id', e.target.value)}
                                        className="w-full px-3 py-2 border border-green-200 bg-green-50/30 rounded-lg text-[13px] font-medium outline-none focus:border-green-500 placeholder:text-green-800/50" placeholder="위챗 ID" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <h3 className="font-black text-[15px] text-gray-800 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-primary" />
                            채용 조건
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <label className="text-[12px] font-bold text-gray-600 mb-2 block">고용 형태 <span className="text-red-500">*</span></label>
                                <div className="flex flex-wrap gap-3">
                                    {employmentTypes.map(emp => (
                                        <label key={emp.code_value} className="flex items-center gap-1.5 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="employment_type" 
                                                value={emp.code_value}
                                                checked={form.employment_type === emp.code_value}
                                                onChange={e => update('employment_type', e.target.value)}
                                                className="w-4 h-4 text-primary focus:ring-primary"
                                            />
                                            <span className="text-[14px] font-medium text-gray-700">{emp.code_name}</span>
                                        </label>
                                    ))}
                                    {!employmentTypes.length && <span className="text-[13px] text-gray-400">데이터 로딩 중...</span>}
                                </div>
                            </div>
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-[12px] font-bold text-gray-600 mb-1.5 block flex items-center gap-1">
                                        <Briefcase className="w-3 h-3" /> 직종 <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={form.category_1 || ''}
                                            onChange={e => { update('category_1', e.target.value); update('category_2', ''); }}
                                            className="w-1/2 px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium outline-none focus:border-primary"
                                        >
                                            <option value="">1차 직종</option>
                                            {categories1.map(c1 => (
                                                <option key={c1.code_value} value={c1.code_value}>{c1.code_name}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={form.category_2 || ''}
                                            onChange={e => update('category_2', e.target.value)}
                                            disabled={!form.category_1}
                                            className="w-1/2 px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium outline-none focus:border-primary disabled:bg-gray-50"
                                        >
                                            <option value="">2차 직종</option>
                                            {categories2.filter(c2 => c2.parent_code_value === form.category_1).map(c2 => (
                                                <option key={c2.code_value} value={c2.code_value}>{c2.code_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">근무 시간</label>
                                    <input type="text" value={form.work_hours} onChange={e => update('work_hours', e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                                        placeholder="예: 오전 10시 ~ 오후 8시" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <h3 className="font-black text-[15px] text-gray-800 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    편의사항 <span className="text-red-500">*</span>
                                </h3>
                                <span className="text-[11px] text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full">2개 이상 선택 권장</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {amenitiesList.map(item => {
                                    const isSelected = form.amenities?.includes(item.code_value);
                                    return (
                                        <button
                                            key={item.code_value}
                                            type="button"
                                            onClick={() => {
                                                const current = form.amenities || [];
                                                const next = isSelected 
                                                    ? current.filter(v => v !== item.code_value) 
                                                    : [...current, item.code_value];
                                                update('amenities', next);
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-[13px] font-bold transition-all border ${
                                                isSelected 
                                                    ? 'border-primary bg-primary text-white shadow-sm' 
                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            {item.code_name}
                                        </button>
                                    );
                                })}
                                {!amenitiesList.length && <span className="text-[13px] text-gray-400">데이터 로딩 중...</span>}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <h3 className="font-black text-[15px] text-gray-800 flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-primary" />
                                    키워드
                                </h3>
                                <span className="text-[11px] text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full">검색에 유리합니다</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {keywordsList.map(item => {
                                    const isSelected = form.keywords?.includes(item.code_value);
                                    return (
                                        <button
                                            key={item.code_value}
                                            type="button"
                                            onClick={() => {
                                                const current = form.keywords || [];
                                                const next = isSelected 
                                                    ? current.filter(v => v !== item.code_value) 
                                                    : [...current, item.code_value];
                                                update('keywords', next);
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-[13px] font-bold transition-all border ${
                                                isSelected 
                                                    ? 'border-gray-800 bg-gray-800 text-white shadow-sm' 
                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            # {item.code_name}
                                        </button>
                                    );
                                })}
                                {!keywordsList.length && <span className="text-[13px] text-gray-400">데이터 로딩 중...</span>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        {/* ─── 광고 모드: 상세 디자인 / 에디터 ─── */}
                        {mode === 'AD' && (
                            <div>
                                <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">
                                    <label className="text-[13px] font-bold text-gray-800 flex items-center gap-2">
                                        <Paintbrush className="w-4 h-4 text-primary" /> 광고 본문 작성 방식
                                    </label>
                                    
                                    {/* 디자인 방식 선택 라디오 버튼 */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                                            <label className={`cursor-pointer px-4 py-1.5 rounded-md text-[12px] font-bold transition-all flex items-center gap-1.5 ${form.design_mode === 'canvas' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                                                <input type="radio" name="design_mode" className="hidden" checked={form.design_mode === 'canvas'} onChange={() => handleDesignModeSwitch('canvas')} />
                                                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${form.design_mode === 'canvas' ? 'border-primary' : 'border-gray-400'}`}>
                                                    {form.design_mode === 'canvas' && <div className="w-1.5 h-1.5 bg-primary rounded-full" />}
                                                </div>
                                                테마 템플릿 제작 (기본)
                                            </label>
                                            <label className={`cursor-pointer px-4 py-1.5 rounded-md text-[12px] font-bold transition-all flex items-center gap-1.5 ${form.design_mode === 'html' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                                                <input type="radio" name="design_mode" className="hidden" checked={form.design_mode === 'html'} onChange={() => handleDesignModeSwitch('html')} />
                                                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${form.design_mode === 'html' ? 'border-primary' : 'border-gray-400'}`}>
                                                    {form.design_mode === 'html' && <div className="w-1.5 h-1.5 bg-primary rounded-full" />}
                                                </div>
                                                직접 작성 (이미지/GIF 첨부)
                                            </label>
                                        </div>
                                        <button 
                                            onClick={() => setShowLoadModal(true)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[12px] font-bold transition-all shadow-sm ml-auto"
                                        >
                                            <FolderOpen className="w-3.5 h-3.5" /> 기존 작성글 불러오기
                                        </button>
                                    </div>
                                </div>
                                
                                {/* ─── 공통 배경 이미지 설정 ─── */}
                                {form.design_mode === 'canvas' && (
                                <div className="flex flex-col gap-1.5 mb-4 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                                    <label className="text-[12px] font-bold text-gray-700 flex items-center gap-1.5">
                                        <ImageIcon className="w-3.5 h-3.5 text-indigo-500" /> 공통 배경 이미지 (포스터/전단지 배경 깔기)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            value={form.detail_bg_image || ''} 
                                            onChange={e => update('detail_bg_image', e.target.value)}
                                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-indigo-500 bg-white" 
                                            placeholder="배경 이미지 URL을 입력하거나 우측 버튼으로 내 PC에서 직접 불러오세요"
                                        />
                                        <label className="cursor-pointer bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-300 text-[12px] font-bold text-gray-700 transition-all flex items-center gap-1.5 shadow-sm">
                                            <Upload className="w-3.5 h-3.5" /> 내 PC에서 사진 첨부
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if(file) {
                                                        try {
                                                            const currentIsPattern = form.detail_bg_image?.startsWith('PATTERN|');
                                                            // 상세 배경 이미지는 최대 1200px, WEBP 형식으로 압축하여 용량 대폭 절감
                                                            const compressedBase64 = await compressImageFile(file, { maxWidthOrHeight: 1200, quality: 0.8, format: 'image/webp' });
                                                            update('detail_bg_image', currentIsPattern ? 'PATTERN|' + compressedBase64 : compressedBase64);
                                                        } catch (error) {
                                                            console.error('배경 이미지 압축 실패:', error);
                                                            alert('이미지 처리 중 오류가 발생했습니다.');
                                                        }
                                                    }
                                                }}
                                            />
                                        </label>
                                        {form.detail_bg_image && (
                                            <>
                                                <label className="flex items-center gap-1.5 cursor-pointer text-[12px] text-gray-700 font-bold bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={form.detail_bg_image.startsWith('PATTERN|')} 
                                                        onChange={e => {
                                                            const isChecked = e.target.checked;
                                                            const isCurrentlyPattern = form.detail_bg_image!.startsWith('PATTERN|');
                                                            if (isChecked && !isCurrentlyPattern) {
                                                                update('detail_bg_image', 'PATTERN|' + form.detail_bg_image);
                                                            } else if (!isChecked && isCurrentlyPattern) {
                                                                update('detail_bg_image', form.detail_bg_image!.replace('PATTERN|', ''));
                                                            }
                                                        }} 
                                                        className="rounded border-gray-300 text-indigo-500 w-3.5 h-3.5" 
                                                    />
                                                    바둑판식 패턴(반복)
                                                </label>
                                                <button 
                                                    onClick={() => update('detail_bg_image', '')}
                                                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[12px] font-bold transition-all border border-red-200"
                                                >
                                                    배경 지우기
                                                </button>
                                            </>
                                        )}
                                    </div>
                                        <p className="text-[11px] text-gray-500 ml-5">
                                            💡 템플릿(캔버스) 모드 배경 이미지가 밑바탕으로 깔리게 됩니다.
                                        </p>
                                    </div>
                                )}
                                
                                {form.design_mode === 'canvas' ? (
                                    <div className="animate-in fade-in zoom-in-95 duration-300">
                                        <AdCanvasEditor
                                            value={form.detail_content}
                                            onChange={(json) => update('detail_content', json)}
                                            bgImage={form.detail_bg_image}
                                            onBgImageChange={(url) => update('detail_bg_image', url)}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* 📸 전단지 간편 삽입 버튼 */}
                                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
                                            <p className="text-[14px] font-bold text-orange-800">전단지나 포스터(통이미지)를 본문에 삽입하시려면 아래 버튼을 눌러주세요!</p>
                                            <label className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-xl font-black transition-all flex items-center gap-2 shadow-md">
                                                <ImageIcon className="w-5 h-5" /> 📸 전단지 / 사진 간편 삽입 (여러장 가능)
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    multiple
                                                    className="hidden" 
                                                    onChange={async (e) => {
                                                        const files = Array.from(e.target.files || []);
                                                        if(files.length > 0) {
                                                            try {
                                                                let currentContent = form.detail_content || '';
                                                                if (currentContent === '<p><br></p>') currentContent = '';
                                                                
                                                                let addedHtml = '';
                                                                for (const file of files) {
                                                                    const compressedBase64 = await compressImageFile(file, { maxWidthOrHeight: 1200, quality: 0.85, format: 'image/webp' });
                                                                    addedHtml += `<img src="${compressedBase64}" style="width: 100%; height: auto !important; display: block; margin: 0 auto;" /><br/>`;
                                                                }
                                                                update('detail_content', currentContent + addedHtml);
                                                                alert(`${files.length}장의 이미지가 에디터 본문에 삽입되었습니다.`);
                                                            } catch (error) {
                                                                console.error('이미지 압축 실패:', error);
                                                                alert('이미지 처리 중 오류가 발생했습니다.');
                                                            }
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded-t-xl border border-gray-200">
                                            <span className="text-[12px] font-bold text-gray-600">본문 텍스트 에디터</span>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setPreviewHtml(true)} title="미리보기"
                                                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm">
                                                    <Eye className="w-3.5 h-3.5" /> 미리보기
                                                </button>
                                            </div>
                                        </div>
                                        <div 
                                        className="animate-in fade-in zoom-in-95 duration-300 border border-gray-200 rounded-xl overflow-hidden relative"
                                        style={{ backgroundColor: '#fff' }}
                                    >
                                        <SunEditor
                                            setContents={form.detail_content}
                                            onChange={(val) => update('detail_content', val)}
                                            setOptions={{
                                                height: `${htmlEditorHeight}px`,
                                                font: ['Pretendard', 'Noto Sans KR', '맑은 고딕', '돋움', 'Arial'],
                                                buttonList: [
                                                    ['fontSize', 'bold', 'underline', 'fontColor', 'align', 'image']
                                                ],
                                                placeholder: "전단지 외에 추가 텍스트 설명을 적으시려면 여기에 자유롭게 작성해 주세요."
                                            }}
                                        />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

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

            {/* ─── HTML 모드 미리보기 모달 ─── */}
            {previewHtml && (
                <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center justify-center p-4" onClick={() => setPreviewHtml(false)}>
                    <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-3xl flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
                        <div className="w-full flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 shrink-0">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Eye className="w-5 h-5 text-indigo-500" /> 직접 작성 (HTML) 미리보기</h3>
                            <button onClick={() => setPreviewHtml(false)} className="px-4 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 rounded-lg text-sm font-bold transition-all shadow-sm">닫기</button>
                        </div>
                        <div className="w-full overflow-y-auto bg-gray-200 p-4 flex justify-center">
                            <div 
                                className="w-full max-w-[600px] min-h-[450px] bg-white shadow-md relative"
                                style={{
                                    backgroundImage: form.detail_bg_image ? `url(${form.detail_bg_image.replace('PATTERN|', '')})` : 'none',
                                    backgroundSize: form.detail_bg_image?.startsWith('PATTERN|') ? 'auto' : 'cover',
                                    backgroundRepeat: form.detail_bg_image?.startsWith('PATTERN|') ? 'repeat' : 'no-repeat',
                                    backgroundPosition: 'top center',
                                    height: htmlEditorHeight > 450 ? htmlEditorHeight : 'auto'
                                }}
                            >
                                <div className="p-4 prose prose-sm max-w-none break-words" dangerouslySetInnerHTML={{ __html: form.detail_content || '<p class="text-gray-400 text-center mt-10">내용이 없습니다.</p>' }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* ─── 기존 디자인 불러오기 모달 (Mock) ─── */}
            {showLoadModal && (
                <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center justify-center p-4" onClick={() => setShowLoadModal(false)}>
                    <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="w-full flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 shrink-0">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FolderOpen className="w-5 h-5 text-indigo-500" /> 기존에 작성했던 디자인 불러오기
                            </h3>
                            <button onClick={() => setShowLoadModal(false)} className="px-4 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 rounded-lg text-sm font-bold transition-all shadow-sm">닫기</button>
                        </div>
                        <div className="p-5 flex flex-col gap-3 max-h-[60vh] overflow-y-auto bg-gray-100">
                            <p className="text-[13px] text-gray-500 mb-2">
                                과거에 등록했던 광고나 구인글의 '배경 이미지'와 '본문 디자인'을 그대로 복사해 옵니다. (백엔드 연동 전 임시 데이터입니다)
                            </p>
                            {[
                                {
                                    id: 'mock1',
                                    title: '여름 시즌 신메뉴 홍보 (HTML 모드)',
                                    type: '광고',
                                    date: '2026-04-20',
                                    design_mode: 'html',
                                    detail_bg_image: 'PATTERN|https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=400',
                                    detail_content: '<h2 style="text-align: center;"><span style="color: rgb(255, 255, 255); background-color: rgb(255, 0, 0);">여름 신메뉴 출시!</span></h2><p style="text-align: center;"><br></p><p style="text-align: center;"><strong><span style="color: rgb(255, 255, 255);">지금 방문하시면 10% 할인</span></strong></p>'
                                },
                                {
                                    id: 'mock2',
                                    title: '주말 알바 긴급 구인 (템플릿 모드)',
                                    type: '구인',
                                    date: '2026-04-15',
                                    design_mode: 'canvas',
                                    detail_bg_image: '',
                                    detail_content: '{"version":"6.0.0","objects":[{"type":"textbox","version":"6.0.0","originX":"center","originY":"center","left":300,"top":200,"width":400,"height":60,"fill":"#000000","text":"급구! 주말 알바 구합니다","fontSize":40,"fontWeight":"bold","fontFamily":"Noto Sans KR","textAlign":"center"}]}'
                                }
                            ].map(post => (
                                <div key={post.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => {
                                        if (post.design_mode === 'canvas') {
                                            canvasContentRef.current = post.detail_content;
                                        } else {
                                            htmlContentRef.current = post.detail_content;
                                        }
                                        update('design_mode', post.design_mode);
                                        update('detail_bg_image', post.detail_bg_image);
                                        update('detail_content', post.detail_content);
                                        setShowLoadModal(false);
                                        alert(`[${post.title}] 디자인을 불러왔습니다!`);
                                    }}
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${post.type === '광고' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{post.type}</span>
                                            <span className="text-[12px] text-gray-400">{post.date}</span>
                                        </div>
                                        <h4 className="text-[14px] font-bold text-gray-800">{post.title}</h4>
                                    </div>
                                    <button className="px-4 py-2 bg-gray-50 hover:bg-indigo-50 text-indigo-600 border border-gray-200 hover:border-indigo-200 rounded-lg text-[12px] font-bold transition-all">
                                        이 디자인 쓰기
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {/* 직접 입력 팝업 */}
            <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
                <DialogContent className="max-w-md bg-white p-6 border-0 shadow-2xl rounded-2xl">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col items-center justify-center text-center py-2">
                            <Building2 className="w-10 h-10 text-primary mb-2" />
                            <h2 className="text-[18px] font-black text-gray-900 tracking-tight">사업자 정보 직접 입력</h2>
                            <p className="text-[13px] text-gray-500 font-medium mt-1">
                                사업자 등록 전이거나 인증을 나중에 하시려면<br/>아래 필수 정보를 기입해 주세요.
                            </p>
                        </div>
                        <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div>
                                <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">상호명</label>
                                <input 
                                    type="text" value={manualBizName} onChange={e => setManualBizName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-primary" 
                                    placeholder="예: 폭스 엔터테인먼트"
                                />
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">대표자 성명</label>
                                <input 
                                    type="text" value={manualCeoName} onChange={e => setManualCeoName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-primary" 
                                    placeholder="대표자 이름"
                                />
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">사업자등록번호 (선택)</label>
                                <input 
                                    type="text" value={manualBizNumber} onChange={e => setManualBizNumber(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-primary" 
                                    placeholder="숫자 10자리"
                                    maxLength={10}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsManualEntryOpen(false)}
                                className="flex-1 h-11 text-[14px] font-bold"
                            >
                                취소
                            </Button>
                            <Button 
                                type="button" 
                                onClick={() => {
                                    if (!manualBizName || !manualCeoName) {
                                        return alert('상호명과 대표자 성명은 필수 입력입니다.');
                                    }
                                    // 폼에 상호명 적용
                                    update('business_name', manualBizName);
                                    update('company', manualBizName);
                                    setIsManualEntryOpen(false);
                                    alert('직접 입력 정보가 적용되었습니다. 노출 랭킹에 제한이 있을 수 있습니다.');
                                }}
                                className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-bold text-[14px]"
                            >
                                적용하기
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
