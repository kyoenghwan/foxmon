'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Loader2, Save, Image, ImageIcon, Eye, Info, DollarSign, MapPin, AlignLeft, Layers, Crown, Upload, RefreshCw, MessageSquare, Bold, Italic, Underline, AlignCenter, AlignLeft as AlignLeftIcon, AlignRight, List, ListOrdered, Palette, Type, Paintbrush, FolderOpen, Briefcase, Tag, Phone, User, MessageCircle, CheckCircle2, X, Megaphone, Building2, Trash2, Instagram, Send, Link2, Clock, Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PremiumJobCard } from '@/components/home/premium-job-card';
import { QA_GET_COMMON_CODES, CodeItem } from '@/src/atoms/qa/master/QA_GET_COMMON_CODES';
import {
    buildUnifiedTagOptions,
    isTagSelected,
    mergeSelectedTagCodes,
} from '@/lib/tag-options';
import { userSettingsAction } from '@/lib/actions';
import { getUserPointsAction } from '@/app/actions/pointActions';
import { useSearchParams } from 'next/navigation';
import NaverMap from '@/components/maps/NaverMap';
import { compressImageFile } from '@/lib/image-utils';
import dynamic from 'next/dynamic';
import { JobPaymentModal } from './JobPaymentModal';

// Fabric.js는 브라우저 전용이므로 SSR 비활성화
const AdCanvasEditor = dynamic(() => import('@/components/biz/AdCanvasEditor'), { ssr: false });
const SunEditor = dynamic(() => import('suneditor-react'), { 
    ssr: false, 
    loading: () => <div className="min-h-[400px] flex items-center justify-center bg-gray-50 border rounded-xl"><Loader2 className="w-6 h-6 animate-spin text-gray-400"/></div> 
});
import 'suneditor/dist/css/suneditor.min.css';
import { LoadMyDataModal } from './LoadMyDataModal';

export interface AdFormData {
    id?: string;
    status?: string;
    company: string;
    title: string;
    location: string;
    pay: string;
    pay_type?: string;
    pay_amount?: string;
    image: string;
    color: string;
    bg_opacity?: string;
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
    detail_bg_image?: string;
    design_mode?: 'canvas' | 'html';
    _isDraft?: boolean;
    
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
    close_date?: string;
    
    // 결제 및 부가 옵션 (팝업)
    exposure_period?: 30 | 60 | 90;
    option_bold?: boolean;
    option_color?: boolean;
    option_bg?: boolean;
    option_icon?: boolean;
    option_jump?: boolean;
    
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

// ─── 결제 및 옵션 가격 정책 ───
const JOB_PRICING = {
    period: {
        30: 70000,
        60: 125000,
        90: 170000
    },
    options: {
        bold: { 30: 30000, 60: 55000, 90: 70000 },
        color: { 30: 15000, 60: 25000, 90: 35000 },
        bg: { 30: 15000, 60: 25000, 90: 35000 },
        icon: { 30: 15000, 60: 25000, 90: 35000 },
        jump: { 30: 30000, 60: 55000, 90: 70000 },
    }
};

// ─── 메인 폼 컴포넌트 ───
export function JobEditorForm({ initialData, onSubmit, isNew = false }: AdEditorFormProps) {
    const canvasRef = useRef<any>(null);
    const mode = 'JOB' as string;
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'job' | 'detail'>('job');
    const [isManualAddress, setIsManualAddress] = useState(false);
    const [activeModal, setActiveModal] = useState<'basic' | 'theme' | 'animation' | 'color' | null>('basic');
    
    // 동적 SNS 계정 연결 상태 (업체 프로필과 연동)
    const [snsLinks, setSnsLinks] = useState<{type: string; value: string}[]>([]);
    const [newSnsType, setNewSnsType] = useState('kakao');
    const [newSnsValue, setNewSnsValue] = useState('');

    // SNS 아이콘 헬퍼
    const getSnsIcon = (type: string) => {
        switch (type) {
            case 'kakao': return <span className="bg-[#FBE54D] text-black text-[9px] px-1 rounded font-black">TALK</span>;
            case 'instagram': return <Instagram className="w-3.5 h-3.5 text-pink-500" />;
            case 'telegram': return <Send className="w-3.5 h-3.5 text-blue-500" />;
            case 'line': return <span className="bg-[#00B900] text-white text-[9px] px-1 rounded font-black">LINE</span>;
            case 'wechat': return <span className="bg-[#00B900] text-white text-[9px] px-1 rounded font-black">위챗</span>;
            default: return <Link2 className="w-3.5 h-3.5 text-gray-500" />;
        }
    };

    const snsOptions = [
        { value: 'kakao', label: '카카오톡' },
        { value: 'line', label: '라인' },
        { value: 'telegram', label: '텔레그램' },
        { value: 'wechat', label: '위챗' }
    ];

    // snsLinks 데이터가 변동될 때 form 상태와 동기화
    const syncSnsToForm = (links: {type: string; value: string}[]) => {
        setForm(prev => {
            const fields = {
                kakao_id: '',
                line_id: '',
                telegram_id: '',
                wechat_id: ''
            };
            links.forEach(link => {
                if (link.type === 'kakao') fields.kakao_id = link.value;
                if (link.type === 'line') fields.line_id = link.value;
                if (link.type === 'telegram') fields.telegram_id = link.value;
                if (link.type === 'wechat') fields.wechat_id = link.value;
            });
            return {
                ...prev,
                ...fields
            };
        });
    };
    
    const [htmlEditorHeight, setHtmlEditorHeight] = useState(450);
    const [previewHtml, setPreviewHtml] = useState(false);
    const [isLoadDesignModalOpen, setIsLoadDesignModalOpen] = useState(false);
    const [isLoadDataModalOpen, setIsLoadDataModalOpen] = useState(false);
    
    // 사업자 인증 상태
    const [isBizVerified, setIsBizVerified] = useState(false);
    
    // detail_content의 캔버스 데이터 여부 검증 헬퍼
    const isCanvasData = (content?: string) => {
        if (!content) return false;
        return content.startsWith('{"version":') || content.startsWith('{"isCanvas":') || content.includes('"isCanvas":true');
    };

    // 캔버스 복합 JSON에서 이미지 HTML 추출 또는 텍스트 폴백
    const renderDetailContent = (content?: string) => {
        if (!content) return '';
        
        // 신규 복합 JSON인 경우
        if (content.startsWith('{"isCanvas":') || content.includes('"isCanvas":true')) {
            try {
                const parsed = JSON.parse(content);
                return parsed.imageHtml || '';
            } catch (e) {
                return content;
            }
        }
        
        // 구식 Fabric.js JSON인 경우 (생 JSON 노출 방지 및 텍스트 폴백)
        if (content.startsWith('{"version":') || content.includes('"objects":')) {
            try {
                const parsed = JSON.parse(content);
                const objects = parsed.objects || [];
                // 텍스트 계열 객체들만 추출하여 줄바꿈으로 연결
                const texts = objects
                    .filter((obj: any) => ['textbox', 'text', 'i-text'].includes(obj.type))
                    .map((obj: any) => obj.text)
                    .filter(Boolean);
                
                if (texts.length > 0) {
                    return `<div class="p-6 bg-yellow-50/50 border border-yellow-200 rounded-xl space-y-4 text-center">
                        <div class="bg-yellow-100 text-yellow-800 text-[12px] font-bold px-3 py-1 rounded-md inline-block mb-4">
                            ⚠️ 구버전으로 저장된 공고 배너입니다. 수정 후 다시 저장하시면 고화질 이미지 배너로 변경됩니다.
                        </div>
                        <div class="text-gray-800 font-bold leading-relaxed whitespace-pre-wrap">${texts.join('\n\n')}</div>
                    </div>`;
                }
            } catch (e) {
                return content;
            }
        }
        
        return content;
    };

    // 모드 전환 시 이전 데이터를 임시 저장하기 위한 ref
    const canvasContentRef = useRef<string>(isCanvasData(initialData?.detail_content) ? initialData.detail_content : '');
    const htmlContentRef = useRef<string>(!isCanvasData(initialData?.detail_content) ? (initialData?.detail_content || '') : '');
    
    // 결제 팝업 모달 상태 및 포인트
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [userPoints, setUserPoints] = useState<number>(0);
    const [loadingPoints, setLoadingPoints] = useState(false);

    const searchParams = useSearchParams();
    const isPayMode = searchParams.get('pay') === 'true';

    useEffect(() => {
        if (!isNew && isPayMode && initialData) {
            // 폼 데이터가 세팅된 후 약간의 딜레이를 주어 모달 오픈
            const timer = setTimeout(() => {
                handleSubmit(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isNew, isPayMode]);
    
    // 초기 모드 결정
    const initialDesignMode = initialData?.detail_content 
        ? (isCanvasData(initialData.detail_content) ? 'canvas' : 'html') 
        : 'canvas';

    const [form, setForm] = useState<AdFormData>({
        company: '',
        title: '',
        location: '',
        pay: '',
        pay_type: '월급',
        pay_amount: '',
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
        design_mode: initialDesignMode,
        amenities: [],
        keywords: [],
        exposure_period: 30,
        option_bold: false,
        option_color: false,
        option_bg: false,
        option_icon: false,
        option_jump: false,
        close_date: '상시채용',
        ...initialData,
    });
    
    // DB 조회 데이터에 close_date 값이 없는 경우에도 디폴트 세팅
    useEffect(() => {
        if (initialData && !initialData.close_date) {
            setForm(prev => ({ ...prev, close_date: '상시채용' }));
        }
    }, [initialData]);

    const [regions, setRegions] = useState<CodeItem[]>([]);
    const [categories1, setCategories1] = useState<CodeItem[]>([]);
    const [categories2, setCategories2] = useState<CodeItem[]>([]);
    const [tagsList, setTagsList] = useState<CodeItem[]>([]);
    const [employmentTypes, setEmploymentTypes] = useState<CodeItem[]>([]);

    const [selectedSido, setSelectedSido] = useState<string>('');
    const [selectedSigungus, setSelectedSigungus] = useState<string[]>([]);
    const [isSigunguOpen, setIsSigunguOpen] = useState(false);

    // 초기 데이터 로딩 시 마스터 데이터 전체 로딩
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const res = await QA_GET_COMMON_CODES(undefined, true);
                if (res.success && res.data) {
                    setRegions(res.data.filter(c => c.list_type === 'JOB_REGION_1' || c.list_type === 'JOB_REGION_2'));
                    setCategories1(res.data.filter(c => c.list_type === 'CATEGORY_1'));
                    setCategories2(res.data.filter(c => c.list_type === 'CATEGORY_2'));
                    setTagsList(buildUnifiedTagOptions(res.data));
                    setEmploymentTypes(res.data.filter(c => c.list_type === 'EMPLOYMENT_TYPE'));
                } else {
                    console.error("❌ [JobEditorForm] fetchMasterData failed:", res.error);
                }
            } catch (err) {
                console.error("❌ [JobEditorForm] fetchMasterData exception:", err);
            }
        };
        const fetchUserProfile = async () => {
            try {
                if (isNew) {
                    const res = await userSettingsAction('GET_PROFILE');
                    if (res.success && res.data) {
                        const profile = res.data;
                        
                        // 연락처 파싱 (010 시작 시 핸드폰, 그 외 일반전화)
                        const phone = profile.phone_number || '';
                        const isMobile = phone.startsWith('010');

                        // 메신저 정보 변환 및 로컬 snsLinks 주입
                        const fetchedSns = [];
                        if (profile.sns_kakao) fetchedSns.push({ type: 'kakao', value: profile.sns_kakao });
                        if (profile.sns_instagram) fetchedSns.push({ type: 'instagram', value: profile.sns_instagram });
                        if (profile.sns_telegram) fetchedSns.push({ type: 'telegram', value: profile.sns_telegram });
                        
                        if (fetchedSns.length > 0) {
                            setSnsLinks(fetchedSns);
                        }

                        if (profile.is_business_verified) {
                            setIsBizVerified(true);
                            setForm(prev => ({
                                ...prev,
                                business_name: profile.verified_business_name,
                                company: profile.verified_business_name, // 하위 호환성
                                phone_type: isMobile ? 'mobile' : 'landline',
                                contact_phone: phone,
                                kakao_id: profile.sns_kakao || '',
                                telegram_id: profile.sns_telegram || '',
                            }));
                        } else {
                            setForm(prev => ({
                                ...prev,
                                phone_type: isMobile ? 'mobile' : 'landline',
                                contact_phone: phone,
                                kakao_id: profile.sns_kakao || '',
                                telegram_id: profile.sns_telegram || '',
                            }));
                        }
                    } else {
                        console.error("❌ [JobEditorForm] fetchUserProfile failed:", res.message);
                    }
                }
            } catch (err) {
                console.error("❌ [JobEditorForm] fetchUserProfile exception:", err);
            }
        };

        fetchMasterData();
        fetchUserProfile();
    }, [isNew]);

    // 초기 데이터 로드 시 기존 form에 있는 SNS 정보를 snsLinks 배열로 변환
    useEffect(() => {
        const initialSns = [];
        if (initialData?.kakao_id) initialSns.push({ type: 'kakao', value: initialData.kakao_id });
        if (initialData?.line_id) initialSns.push({ type: 'line', value: initialData.line_id });
        if (initialData?.telegram_id) initialSns.push({ type: 'telegram', value: initialData.telegram_id });
        if (initialData?.wechat_id) initialSns.push({ type: 'wechat', value: initialData.wechat_id });
        setSnsLinks(initialSns);
    }, [initialData]);

    useEffect(() => {
        if (!tagsList.length) return;
        if ((form.amenities?.length ?? 0) > 0) {
            setForm((prev) => ({
                ...prev,
                keywords: mergeSelectedTagCodes(prev.keywords, prev.amenities),
                amenities: [],
            }));
        }
    }, [tagsList.length, initialData?.id]);

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
        if (newSigungus?.includes(sigungu)) {
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

    const handleLoadAdData = (adData: any) => {
        setForm(prev => ({
            ...prev,
            title: adData.title || prev.title,
            company: adData.company_name || prev.company,
            detail_content: adData.detail_content || prev.detail_content,
            design_mode: adData.design_mode || prev.design_mode,
            logo_url: adData.logo_url || prev.logo_url,
            image: adData.image_url || prev.image,
            theme: adData.theme || prev.theme,
            color: adData.detail_bg_color || adData.color || prev.color,
            bg_opacity: adData.bg_opacity || prev.bg_opacity,
        }));
        setIsLoadDataModalOpen(false);
        if (adData.design_mode) {
            handleDesignModeSwitch(adData.design_mode as any);
        }
    };

    const handleLoadDesignData = (jobData: any) => {
        const designMode = jobData.design_mode || 'canvas';
        const detailBgImage = jobData.detail_bg_image || '';
        const detailContent = jobData.detail_content || '';

        if (designMode === 'canvas') {
            canvasContentRef.current = detailContent;
        } else {
            htmlContentRef.current = detailContent;
        }

        setForm(prev => ({
            ...prev,
            design_mode: designMode,
            detail_bg_image: detailBgImage,
            detail_content: detailContent,
        }));

        setIsLoadDesignModalOpen(false);
        if (designMode) {
            handleDesignModeSwitch(designMode as any);
        }
        alert(`[${jobData.title}]의 본문 디자인을 불러왔습니다!`);
    };

    // 급여 업데이트 핸들러
    const handlePayChange = (type: string, amount: string) => {
        update('pay_type', type);
        update('pay_amount', amount);
        update('pay', amount ? `${type} ${amount}` : '');
    };

    const handleSubmit = async (autoOpenModal?: boolean) => {
        if (!form.company && !form.business_name) {
            alert('상호명은 필수 입력 항목입니다.');
            return;
        }
        if (!form.title || !form.location || (!form.pay_amount && !form.pay)) {
            alert('공고 제목, 위치, 급여는 필수 입력 항목입니다.');
            return;
        }
        if (form.tier !== 'GENERAL') {
            if (!form.logo_url && !form.image) {
                alert('업체 로고를 등록해주세요. (배너 정보 탭)');
                return;
            }
        }
        
        let finalDetailContent = form.detail_content;
        if (form.design_mode === 'canvas' && canvasRef.current) {
            const latestData = canvasRef.current.saveLatest?.();
            if (latestData) {
                finalDetailContent = latestData;
                // form 상태도 업데이트하여 JobPaymentModal에 전달되도록 함
                update('detail_content', latestData);
            }
        }

        if (!finalDetailContent || finalDetailContent === '<p><br></p>') {
            alert('광고 상세 내용을 작성하거나 이미지를 첨부해주세요.');
            return;
        }
        
        // 폼 검증 후 포인트 로드 및 모달 띄우기
        setLoadingPoints(true);
        setShowPaymentModal(true);
        try {
            const pointRes = await getUserPointsAction();
            if (pointRes.success && pointRes.points !== undefined) {
                setUserPoints(pointRes.points);
            }
        } catch (err) {
            console.error("포인트 로드 실패", err);
        } finally {
            setLoadingPoints(false);
        }
    };

    const handleFinalSubmit = async (isPayment: boolean = false) => {
        let finalDetailContent = form.detail_content;
        if (form.design_mode === 'canvas' && canvasRef.current) {
            const latestData = canvasRef.current.saveLatest?.();
            if (latestData) {
                finalDetailContent = latestData;
            }
        }

        setSaving(true);
        try {
            await onSubmit({
                ...form,
                detail_content: finalDetailContent,
                keywords: mergeSelectedTagCodes(form.keywords, form.amenities),
                amenities: [],
                _isPayment: isPayment,
            });
            setShowPaymentModal(false);
        } finally {
            setSaving(false);
        }
    };

    const currentTier = TIER_OPTIONS.find(t => t.value === form.tier)!;
    const discountedPrice = Math.floor(currentTier.price * 0.95);

    // 총 결제 금액(포인트) 계산 함수
    const calculateTotalPoints = () => {
        const p = form.exposure_period || 30;
        let total = JOB_PRICING.period[p] || 0;
        
        if (form.option_bold) total += JOB_PRICING.options.bold[p] || 0;
        if (form.option_color) total += JOB_PRICING.options.color[p] || 0;
        if (form.option_bg) total += JOB_PRICING.options.bg[p] || 0;
        if (form.option_icon) total += JOB_PRICING.options.icon[p] || 0;
        if (form.option_jump) total += JOB_PRICING.options.jump[p] || 0;
        
        return total;
    };

    const sidoOptions = regions.filter(r => !r.parent_code_value);
    const sidoCode = regions.find(r => r.code_name === selectedSido)?.code_value;
    const sigunguOptions = sidoCode ? regions.filter(r => r.parent_code_value === sidoCode) : [];

    const handleLogoRequest = () => {
        alert('로고 제작 대행 문의는 카카오톡 고객센터(@foxmon)로 상호명과 함께 연락해 주세요.\n전문 디자이너가 원장님만의 맞춤형 타이포그래피 로고를 제작해 드립니다!');
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        try {
            // 로고는 최대 300px 크기로 충분하며 PNG 포맷 유지(투명도 지원)
            const compressedBase64 = await compressImageFile(file, { maxWidthOrHeight: 300, quality: 0.9, format: 'image/png' });
            update('logo_url', compressedBase64);
            update('image', compressedBase64); // JobEditorForm에서는 image 필드도 업데이트
        } catch (error) {
            console.error('로고 이미지 압축 실패:', error);
            alert('이미지 처리 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="space-y-6">
            <LoadMyDataModal
                isOpen={isLoadDataModalOpen}
                onClose={() => setIsLoadDataModalOpen(false)}
                onSelect={handleLoadAdData}
                sourceType="AD"
            />

            <LoadMyDataModal
                isOpen={isLoadDesignModalOpen}
                onClose={() => setIsLoadDesignModalOpen(false)}
                onSelect={handleLoadDesignData}
                sourceType="JOB"
            />


            {/* ═══════ 배너 정보 탭 ═══════ */}
            {(mode === 'JOB' || activeTab === 'job') && (
                <div className="space-y-6">

                    {/* ① 광고 등급 선택 (UI 간소화) */}
                    {mode === 'AD' && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-5">
                            <h3 className="font-black text-[15px] text-gray-800 mb-3 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary" />
                                광고 등급 선택
                            </h3>

                        <div className="flex gap-2">
                            {TIER_OPTIONS.map(t => (
                                <button
                                    key={t.value}
                                    onClick={() => update('tier', t.value)}
                                    className={`flex-1 py-2 px-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                                        form.tier === t.value
                                            ? t.value === 'PREMIUM' ? 'border-yellow-500 bg-yellow-50 ring-1 ring-yellow-200'
                                            : t.value === 'SPECIAL' ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-200'
                                            : 'border-gray-500 bg-gray-50 ring-1 ring-gray-200'
                                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="text-[16px]">{t.emoji}</span>
                                    <span className={`font-black text-[14px] ${form.tier === t.value ? 'text-gray-900' : 'text-gray-600'}`}>
                                        {t.label} 
                                        <span className={`ml-1 text-[12px] font-bold ${form.tier === t.value ? 'text-primary' : 'text-gray-400'}`}>
                                            ({t.priceLabel})
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* 사이드/상단 배너 안내 */}
                        <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <div className="text-[12px] text-blue-700 leading-relaxed">
                                <p className="font-bold">📢 사이드 배너 · 상단 메인 배너 광고</p>
                                <p className="mt-0.5">별도 협의가 필요합니다. <span className="font-black text-blue-900">관리자에게 문의</span>해 주세요. (카카오톡: <span className="font-black">@foxmon</span>)</p>
                            </div>
                        </div>

                        {/* 자동 연장 */}
                        <div className="mt-3 bg-gray-50 rounded-xl p-3 flex items-center gap-3">
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
                    )}

                    {/* ② 왼쪽(미리보기+로고) & 오른쪽(기본정보) 그리드 */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        
                        {/* 왼쪽 컬럼 */}
                        {mode === 'AD' && (
                            <div className="w-full lg:w-[240px] shrink-0 space-y-4">
                                
                                {/* 배너 미리보기 */}
                                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                                    <h3 className="font-black text-[15px] text-gray-800 mb-4 flex items-center gap-2">
                                        <Image className="w-4 h-4 text-primary" />
                                        배너 미리보기
                                    </h3>

                                    <div className="w-[200px] mx-auto pointer-events-none">
                                        {(() => {
                                            const isPremium = form.tier === 'PREMIUM';
                                            const isSpecial = form.tier === 'SPECIAL';
                                            const isGeneral = form.tier === 'GENERAL';
                                            const themeColor = isSpecial ? (form.color || '#FF6B35') : '#6B7280';

                                            if (isPremium) {
                                                return (
                                                    <div className="w-full">
                                                        <PremiumJobCard
                                                            id="preview"
                                                            company={form.company || '업체명'}
                                                            title={form.title || '광고 제목을 입력하세요'}
                                                            location={form.location || '전지역'}
                                                            pay={form.pay || '급여 정보'}
                                                            image={form.logo_url || form.image}
                                                            impactType={(form.theme as any) || 'gold'}
                                                            effectIntensity={(form.effect_intensity as any) || 'medium'}
                                                        />
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="w-full">
                                                    <div className="relative aspect-[2/1] p-[3px] group" style={{ width: '200px' }}>
                                                        {/* 스페셜 배경 글로우 */}
                                                    {isSpecial && (
                                                        <div className="absolute inset-0 overflow-hidden rounded-xl z-0"
                                                            style={{ backgroundColor: themeColor, opacity: 0.5 }} />
                                                    )}

                                                    <div className="relative h-full w-full rounded-[calc(0.75rem-3px)] overflow-hidden shadow-sm p-1.5 sm:p-2 lg:p-2.5 flex flex-col justify-between z-10 bg-white transition-all duration-300"
                                                        style={{ borderWidth: 2, borderColor: isSpecial ? themeColor + '80' : '#e5e7eb' }}>
                                                        
                                                        {isSpecial && (
                                                            <div className="absolute inset-0 pointer-events-none z-0"
                                                                style={{ background: `linear-gradient(135deg, ${themeColor}08 0%, transparent 60%)` }} />
                                                        )}

                                                        <div className="flex gap-1.5 sm:gap-2 mb-1 relative z-10 w-full">
                                                            <div className="w-[70px] h-[35px] sm:w-[85px] sm:h-[42px] lg:w-[110px] lg:h-[55px] shrink-0 overflow-hidden bg-gray-50 flex items-center justify-center rounded-sm transition-all"
                                                                style={{ borderWidth: 1, borderColor: isSpecial ? themeColor + '30' : '#f3f4f6' }}>
                                                                {(form.logo_url || form.image) && !isGeneral ? (
                                                                    <div className="w-full h-full bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${form.logo_url || form.image})` }} />
                                                                ) : (
                                                                    <div className="text-gray-300 font-black text-[10px] bg-gray-100 w-full h-full flex items-center justify-center">NO LOGO</div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5 overflow-hidden">
                                                                <div className="relative w-full overflow-hidden whitespace-nowrap">
                                                                    <h3 className="font-black text-[12px] sm:text-[13px] lg:text-[15px] tracking-tight inline-block hover:animate-pulse transition-colors"
                                                                        style={{ color: isSpecial ? themeColor : '#111827' }}>
                                                                        {form.company || '업체명'}
                                                                    </h3>
                                                                </div>
                                                                <div className="flex items-center text-[10px] sm:text-[11px] lg:text-[12px] text-gray-500 truncate tracking-tight mt-0.5">
                                                                    <span className="shrink-0 px-1 py-[1px] leading-none mr-1 sm:mr-1.5 font-bold rounded-[2px]"
                                                                        style={{
                                                                            color: isSpecial ? themeColor : '#2b6cb0',
                                                                            borderWidth: 1,
                                                                            borderColor: isSpecial ? themeColor + '50' : '#2b6cb0',
                                                                            backgroundColor: isSpecial ? themeColor + '10' : '#ebf8ff'
                                                                        }}>
                                                                        {(form.location || '지역').split(' ')[0]}
                                                                    </span>
                                                                    <span className="truncate font-medium">
                                                                        {(form.location || '전지역').split(' ').slice(1).join(' ') || '전지역'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mb-1 flex-1 flex flex-col justify-center relative z-10 w-full overflow-hidden">
                                                            <div className="relative w-full overflow-hidden whitespace-nowrap">
                                                                <p className="text-[11px] sm:text-[12px] lg:text-[13px] leading-[1.3] font-bold tracking-tight inline-block px-1 rounded-[2px] hover:animate-pulse"
                                                                    style={{
                                                                        color: '#1f2937',
                                                                        backgroundColor: isSpecial ? themeColor + '15' : '#bbf7d050'
                                                                    }}>
                                                                    {form.title || '광고 제목을 입력하세요'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-end justify-between mt-auto relative z-10">
                                                            <div className="flex items-center text-[12px] sm:text-[13px] lg:text-[15px] font-bold text-gray-900 truncate tracking-tight gap-1 sm:gap-1.5">
                                                                <span className="shrink-0 text-white text-[9px] sm:text-[10px] lg:text-[11px] px-1 sm:px-1.5 py-[1px] sm:py-0.5 rounded-sm shadow-sm"
                                                                    style={{ backgroundColor: isSpecial ? themeColor : '#805ad5' }}>
                                                                    TC
                                                                </span>
                                                                <span className="text-gray-800">{form.pay || '급여 정보'}</span>
                                                            </div>
                                                            <div className="shrink-0 flex items-center px-1 sm:px-1.5 py-[1px] sm:py-0.5 rounded-sm text-[9px] sm:text-[10px] lg:text-[11px] font-black shadow-sm bg-gray-100 text-gray-700 border border-gray-300">
                                                                <Crown className="w-[10px] h-[10px] sm:w-3 sm:h-3 justify-center mr-0.5 sm:mr-1 text-gray-500" /> 일반업체
                                                            </div>
                                                        </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {form.tier !== 'GENERAL' && (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center">
                                        <div className="flex flex-col gap-2 w-full mb-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-black text-[14px] text-gray-800">업체 로고</h3>
                                                <button 
                                                    onClick={handleLogoRequest}
                                                    className="px-2 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-[10px] items-center gap-1 flex shadow-sm transition-all"
                                                >
                                                    <Paintbrush className="w-3.5 h-3.5 text-blue-200" />
                                                    <span className="font-bold">로고 제작 문의</span>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <label className="relative group cursor-pointer w-full flex justify-center">
                                            <div className="w-[120px] h-[80px] rounded-2xl border-2 border-dashed overflow-hidden bg-gray-50 flex items-center justify-center transition-all border-gray-300 group-hover:border-primary group-hover:bg-blue-50/50">
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

                                        <p className="text-[10px] text-gray-400 mt-2 text-center leading-relaxed">PNG/JPG 지원<br/>가로 형태(1.5:1 비율) 권장</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 오른쪽 컬럼 (기본 정보) */}
                        <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                            <h3 className="text-[14px] font-black text-gray-900 pb-3 border-b mb-5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                구인 공고 기본 정보
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsLoadDataModalOpen(true)}
                                className="text-[12px] font-bold text-white bg-primary px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                                <Megaphone className="w-3.5 h-3.5" />
                                내 광고 본문 불러오기
                            </button>
                        </h3>
                            <div className="flex flex-col md:flex-row gap-5 items-start mt-4">
                                {/* 왼쪽 로고 이미지 입력 영역 */}
                                <div className="w-[120px] shrink-0 flex flex-col items-center">
                                    <label className="relative group cursor-pointer w-full flex flex-col items-center">
                                        <div className="w-[120px] h-[120px] rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex flex-col items-center justify-center transition-all group-hover:border-primary group-hover:bg-blue-50/50">
                                            {form.logo_url || form.image ? (
                                                <img src={form.logo_url || form.image} alt="로고" className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="flex flex-col items-center text-center p-2">
                                                    <Upload className="w-6 h-6 text-gray-300 group-hover:text-primary transition-colors mb-1.5" />
                                                    <span className="text-[11px] font-bold text-gray-400 group-hover:text-primary leading-tight">
                                                        로고 이미지<br/>등록
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                    </label>
                                    {(form.logo_url || form.image) && (
                                        <label className="mt-2 cursor-pointer bg-white hover:bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 text-[11px] font-bold text-gray-600 transition-all shadow-sm">
                                            이미지 변경
                                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                        </label>
                                    )}
                                </div>

                                {/* 오른쪽 기본 정보 입력 영역 */}
                                <div className="flex-1 w-full flex flex-col gap-1">
                                    {/* 채용(공고) 제목 */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-1.5">
                                        <label className="w-full sm:w-[140px] text-[13px] font-extrabold text-gray-700 shrink-0 flex items-center gap-1.5">
                                            <Type className="w-4 h-4 text-gray-400" />
                                            <span>채용(공고) 제목</span>
                                            <span className="text-red-500">*</span>
                                            <span className="hidden sm:inline text-gray-300 ml-auto">-</span>
                                        </label>
                                        <div className="flex-1 w-full">
                                            <input
                                                type="text" value={form.title} onChange={e => update('title', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-primary"
                                                placeholder="예: 최고 대우 보장! 초보 환영합니다 (40자 제한)"
                                                maxLength={40}
                                            />
                                        </div>
                                    </div>

                                    {/* 닉네임 (업체명) */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-1.5">
                                        <label className="w-full sm:w-[140px] text-[13px] font-extrabold text-gray-700 shrink-0 flex items-center gap-1.5">
                                            <Building2 className="w-4 h-4 text-gray-400" />
                                            <span>닉네임 (업체명)</span>
                                            <span className="text-red-500">*</span>
                                            <span className="hidden sm:inline text-gray-300 ml-auto">-</span>
                                        </label>
                                        <div className="flex-1 w-full">
                                            <input
                                                type="text" value={form.company} onChange={e => {
                                                    const val = e.target.value;
                                                    update('company', val);
                                                    update('business_name', val);
                                                }}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-primary"
                                                placeholder="예: 강남 스웨디시"
                                            />
                                        </div>
                                    </div>

                                    {/* 지역 */}
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 py-1.5">
                                        <label className="w-full sm:w-[140px] text-[13px] font-extrabold text-gray-700 shrink-0 flex items-center gap-1.5 sm:mt-2.5">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span>지역</span>
                                            <span className="text-red-500">*</span>
                                            <span className="hidden sm:inline text-gray-300 ml-auto">-</span>
                                        </label>
                                        <div className="flex-1 w-full flex flex-col gap-2 relative">
                                            <div className="flex gap-2">
                                                <select
                                                    value={selectedSido}
                                                    onChange={handleSidoChange}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-primary bg-white"
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
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-primary"
                                                />
                                            ) : selectedSido ? (
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsSigunguOpen(!isSigunguOpen)}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-medium outline-none text-left bg-white focus:border-primary flex justify-between items-center"
                                                    >
                                                        <span className={selectedSigungus.length > 0 ? "text-gray-900" : "text-gray-400"}>
                                                            {selectedSigungus.length > 0 ? selectedSigungus.join(', ') : '시/군/구 선택 (여러 개 가능)'}
                                                        </span>
                                                        <span className="text-gray-400 text-[10px]">▼</span>
                                                    </button>
                                                    
                                                    {isSigunguOpen && (
                                                        <div className="absolute z-10 w-full mt-1 p-3 bg-white border border-gray-200 shadow-xl rounded-lg max-h-[220px] overflow-y-auto grid grid-cols-2 gap-2">
                                                            {regions.filter(r => {
                                                                const sido = regions.find(s => s.code_name === selectedSido && s.list_type === 'JOB_REGION_1');
                                                                return r.list_type === 'JOB_REGION_2' && r.parent_code_value === sido?.code_value;
                                                            }).map(sigungu => (
                                                                <label key={sigungu.code_value} className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-700 hover:text-primary">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedSigungus?.includes(sigungu.code_name)}
                                                                        onChange={() => handleSigunguChange(sigungu.code_name)}
                                                                        className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                                                                    />
                                                                    <span className="truncate">{sigungu.code_name}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* 급여조건 */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-1.5">
                                        <label className="w-full sm:w-[140px] text-[13px] font-extrabold text-gray-700 shrink-0 flex items-center gap-1.5">
                                            <DollarSign className="w-4 h-4 text-gray-400" />
                                            <span>급여조건</span>
                                            <span className="text-red-500">*</span>
                                            <span className="hidden sm:inline text-gray-300 ml-auto">-</span>
                                        </label>
                                        <div className="flex-1 w-full flex gap-2">
                                            <select
                                                value={form.pay_type}
                                                onChange={e => handlePayChange(e.target.value, form.pay_amount || '')}
                                                className="w-[100px] sm:w-[120px] px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-primary bg-white"
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
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-primary pr-8"
                                                    placeholder="금액 또는 조건 입력"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-500 font-medium">원</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 마감일 */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-1.5">
                                        <label className="w-full sm:w-[140px] text-[13px] font-extrabold text-gray-700 shrink-0 flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span>마감일</span>
                                            <span className="text-red-500">*</span>
                                            <span className="hidden sm:inline text-gray-300 ml-auto">-</span>
                                        </label>
                                        <div className="flex-1 w-full flex items-center gap-4">
                                            <label className="inline-flex items-center gap-1.5 cursor-pointer text-[13px] font-extrabold text-gray-700 select-none bg-gray-50 border border-gray-200 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={!form.close_date || form.close_date === '상시채용'}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            update('close_date', '상시채용');
                                                        } else {
                                                            const todayStr = new Date().toISOString().split('T')[0];
                                                            update('close_date', todayStr);
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 cursor-pointer"
                                                />
                                                <span>상시채용</span>
                                            </label>

                                            <input
                                                type="date"
                                                value={(!form.close_date || form.close_date === '상시채용') ? '' : form.close_date}
                                                disabled={!form.close_date || form.close_date === '상시채용'}
                                                onChange={e => update('close_date', e.target.value)}
                                                className="px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-primary bg-white cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ③ 등급별 배너 테마 설정 */}
                    {mode === 'AD' && form.tier === 'PREMIUM' && (
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
                        </div>
                    )}

                    {mode === 'AD' && form.tier === 'SPECIAL' && (
                        <div className="bg-white rounded-2xl border border-purple-200 p-6 space-y-5">
                            <h3 className="font-black text-[15px] text-gray-800 flex items-center gap-2">
                                <span className="text-[16px]">⭐</span>
                                스페셜 색상 설정
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
                        </div>
                    )}

                    {form.tier === 'GENERAL' && mode === 'AD' && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <div className="text-center py-4">
                                <p className="text-[14px] font-bold text-gray-600">📋 일반 광고는 기본 정보만 표시됩니다.</p>
                                <p className="text-[12px] text-gray-400 mt-1">테마, 로고, 색상 등의 배너 꾸미기 기능은 스페셜/프리미엄 등급에서 사용 가능합니다.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════ 공고 상세 내용 탭 ═══════ */}
            {(mode === 'JOB' || activeTab === 'detail') && (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                        <h3 className="font-black text-[15px] text-gray-800 flex items-center gap-2">
                            <Info className="w-4 h-4 text-primary" />
                            상세 업소 정보
                        </h3>
                        <div className="flex flex-col gap-1 max-w-3xl">
                            {/* 상호명 */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-1.5">
                                <label className="w-full sm:w-[140px] text-[13px] font-extrabold text-gray-700 shrink-0 flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4 text-gray-400" />
                                    <span>상호명</span>
                                    {isBizVerified && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-green-100 text-green-700 whitespace-nowrap">
                                            <CheckCircle2 className="w-2.5 h-2.5 stroke-[3]" /> 인증
                                        </span>
                                    )}
                                    <span className="hidden sm:inline text-gray-300 ml-auto">-</span>
                                </label>
                                <div className="flex-1 w-full">
                                    <input
                                        type="text" value={form.business_name || ''} 
                                        onChange={e => {
                                            update('business_name', e.target.value);
                                            update('company', e.target.value);
                                        }}
                                        className={`w-full px-3 py-2 border rounded-lg text-[13px] font-medium outline-none border-gray-200 focus:border-primary bg-white`}
                                        placeholder="상호명을 입력해주세요"
                                    />
                                </div>
                            </div>

                            {/* 직종 */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-1.5">
                                <label className="w-full sm:w-[140px] text-[13px] font-extrabold text-gray-700 shrink-0 flex items-center gap-1.5">
                                    <Briefcase className="w-4 h-4 text-gray-400" />
                                    <span>직종</span>
                                    <span className="text-red-500">*</span>
                                    <span className="hidden sm:inline text-gray-300 ml-auto">-</span>
                                </label>
                                <div className="flex-1 w-full">
                                    <select
                                        value={form.category_1 || ''}
                                        onChange={e => {
                                            const val = e.target.value;
                                            update('category_1', val);
                                            update('category_2', '');
                                        }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-primary bg-white"
                                    >
                                        <option value="">직종 선택</option>
                                        {categories1.map(c1 => (
                                            <option key={c1.code_value} value={c1.code_name}>{c1.code_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* 담당자 */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-1.5">
                                <label className="w-full sm:w-[140px] text-[13px] font-extrabold text-gray-700 shrink-0 flex items-center gap-1.5">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span>담당자</span>
                                    <span className="text-red-500">*</span>
                                    <span className="hidden sm:inline text-gray-300 ml-auto">-</span>
                                </label>
                                <div className="flex-1 w-full">
                                    <input
                                        type="text" value={form.manager_name || ''} onChange={e => update('manager_name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-primary"
                                        placeholder="예: 김실장"
                                    />
                                </div>
                            </div>

                            {/* 담당자 연락처 */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-1.5">
                                <label className="w-full sm:w-[140px] text-[13px] font-extrabold text-gray-700 shrink-0 flex items-center gap-1.5">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>담당자 연락처</span>
                                    <span className="text-red-500">*</span>
                                    <span className="hidden sm:inline text-gray-300 ml-auto">-</span>
                                </label>
                                <div className="flex-1 w-full flex gap-2">
                                    <select
                                        value={form.phone_type || 'mobile'}
                                        onChange={e => update('phone_type', e.target.value)}
                                        className="w-[100px] sm:w-[120px] px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-primary bg-white"
                                    >
                                        <option value="mobile">핸드폰</option>
                                        <option value="landline">일반전화</option>
                                    </select>
                                    <input
                                        type="text" value={form.contact_phone || ''} onChange={e => update('contact_phone', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-primary"
                                        placeholder="010-0000-0000"
                                    />
                                </div>
                            </div>

                            {/* 상세 주소 */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-1.5">
                                <label className="w-full sm:w-[140px] text-[13px] font-extrabold text-gray-700 shrink-0 flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span>상세 주소</span>
                                    <span className="hidden sm:inline text-gray-300 ml-auto">-</span>
                                </label>
                                <div className="flex-1 w-full flex gap-2">
                                    <input type="text" value={form.address || ''} readOnly={!isManualAddress}
                                        onChange={isManualAddress ? (e) => update('address', e.target.value) : undefined}
                                        className={`flex-1 px-3 py-2 border rounded-lg text-[13px] outline-none font-medium transition-colors ${
                                            isManualAddress 
                                                ? 'bg-white text-gray-900 border-purple-500 focus:ring-1 focus:ring-purple-500/20 cursor-text' 
                                                : 'bg-gray-50 text-gray-700 border-gray-200 cursor-default'
                                        }`}
                                        placeholder={isManualAddress ? "주소를 직접 입력하세요 (해외 주소 등)" : "주소 검색 버튼을 클릭하세요"} />
                                    <button
                                        type="button"
                                        onClick={() => setIsManualAddress(!isManualAddress)}
                                        className={`shrink-0 px-3 py-2 text-[12px] font-bold rounded-lg transition-all active:scale-95 border ${
                                            isManualAddress 
                                                ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700' 
                                                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                                        }`}
                                    >
                                        직접 입력
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsManualAddress(false);
                                            const script = document.createElement('script');
                                            script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
                                            script.onload = () => {
                                                new (window as any).daum.Postcode({
                                                    oncomplete: (data: any) => {
                                                        const fullAddr = data.roadAddress || data.jibunAddress || data.address;
                                                        update('address', fullAddr);
                                                    }
                                                }).open();
                                            };
                                            if ((window as any).daum?.Postcode) {
                                                new (window as any).daum.Postcode({
                                                    oncomplete: (data: any) => {
                                                        const fullAddr = data.roadAddress || data.jibunAddress || data.address;
                                                        update('address', fullAddr);
                                                    }
                                                }).open();
                                            } else {
                                                document.head.appendChild(script);
                                            }
                                        }}
                                        className="shrink-0 px-4 py-2 bg-gray-900 hover:bg-black text-white text-[12px] font-bold rounded-lg transition-colors shadow-sm active:scale-95"
                                    >
                                        주소 검색
                                    </button>
                                </div>
                            </div>

                            {/* 메신저 ID (동적 연동) */}
                            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 py-1.5">
                                <div className="w-full sm:w-[140px] text-[13px] font-extrabold text-gray-700 shrink-0 flex items-center gap-1.5 sm:mt-2">
                                    <MessageCircle className="w-4 h-4 text-gray-400" />
                                    <span>메신저 ID</span>
                                    <span className="hidden sm:inline text-gray-300 ml-auto">-</span>
                                </div>
                                <div className="flex-1 w-full space-y-3">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                                        {snsLinks.map((sns, index) => (
                                            <div key={index} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
                                                <div className="w-[85px] flex items-center gap-1.5 shrink-0 pl-1">
                                                    {getSnsIcon(sns.type)}
                                                    <span className="text-[11px] font-bold text-gray-600">
                                                        {snsOptions.find(o => o.value === sns.type)?.label || '기타'}
                                                    </span>
                                                </div>
                                                <input 
                                                    type="text" 
                                                    value={sns.value} 
                                                    onChange={e => {
                                                        const newLinks = [...snsLinks];
                                                        newLinks[index].value = e.target.value;
                                                        setSnsLinks(newLinks);
                                                        syncSnsToForm(newLinks);
                                                    }}
                                                    className="flex-1 bg-transparent border-none outline-none text-[13px] font-medium text-gray-800"
                                                    placeholder="아이디"
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = snsLinks.filter((_, i) => i !== index);
                                                        setSnsLinks(updated);
                                                        syncSnsToForm(updated);
                                                    }} 
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        
                                        <div className="flex items-center gap-2">
                                            <select 
                                                value={newSnsType} 
                                                onChange={e => setNewSnsType(e.target.value)}
                                                className="w-[95px] px-2 py-2 border border-gray-200 rounded-lg text-[12px] font-bold outline-none bg-white"
                                            >
                                                {snsOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                            <input 
                                                type="text" 
                                                value={newSnsValue} 
                                                onChange={e => setNewSnsValue(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (!newSnsValue.trim()) return alert('아이디를 입력해주세요.');
                                                        const updated = [...snsLinks, { type: newSnsType, value: newSnsValue.trim() }];
                                                        setSnsLinks(updated);
                                                        syncSnsToForm(updated);
                                                        setNewSnsValue('');
                                                    }
                                                }}
                                                placeholder="아이디 입력"
                                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none bg-white"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    if (!newSnsValue.trim()) return alert('아이디를 입력해주세요.');
                                                    const updated = [...snsLinks, { type: newSnsType, value: newSnsValue.trim() }];
                                                    setSnsLinks(updated);
                                                    syncSnsToForm(updated);
                                                    setNewSnsValue('');
                                                }} 
                                                className="h-9 w-9 flex items-center justify-center bg-primary hover:bg-orange-600 text-white rounded-lg font-bold shadow-sm transition-colors active:scale-95 cursor-pointer shrink-0" 
                                                title="SNS 계정 추가"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 위치 지도 미리보기 */}
                    {form.address && !isManualAddress && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
                            <h3 className="text-[14px] font-black text-gray-900 pb-3 border-b flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                📍 업체 위치
                            </h3>
                            <p className="text-[12px] text-gray-500 font-medium">{form.address}</p>
                            <NaverMap address={form.address} />
                        </div>
                    )}



                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <h3 className="font-black text-[15px] text-gray-800 flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-primary" />
                                    키워드·혜택 <span className="text-red-500">*</span>
                                </h3>
                                <span className="text-[11px] text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full">2개 이상 선택 권장 · 검색에 유리합니다</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {tagsList.map((item) => {
                                    const isSelected = isTagSelected(form.keywords, item);
                                    return (
                                        <button
                                            key={item.code_value}
                                            type="button"
                                            onClick={() => {
                                                const current = form.keywords || [];
                                                const next = isSelected
                                                    ? current.filter(
                                                          (v) =>
                                                              v !== item.code_value && v !== item.code_name
                                                      )
                                                    : [...current, item.code_value];
                                                update('keywords', next);
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
                                {!tagsList.length && <span className="text-[13px] text-gray-400">데이터 로딩 중...</span>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        {/* ─── 상세 디자인 / 에디터 ─── */}
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
                                            type="button"
                                            onClick={() => setIsLoadDesignModalOpen(true)}
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
                                            placeholder="배경 이미지를 입력하거나 우측 버튼으로 내 PC에서 직접 불러오세요"
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
                                    <div className="animate-in fade-in zoom-in-95 duration-300 w-full overflow-x-auto pb-4">
                                        <AdCanvasEditor
                                            ref={canvasRef}
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
                    </div>
                </div>
            )}

            {/* 저장 버튼 */}
            <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => window.history.back()} className="font-bold h-11 px-6 rounded-xl">
                    취소
                </Button>
                {isNew ? (
                    <Button onClick={() => handleSubmit()} disabled={saving} className="font-black h-11 px-8 rounded-xl shadow-md">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {mode === 'JOB' ? '구인 공고 등록하기' : '광고 등록하기'}
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button onClick={() => handleFinalSubmit(false)} disabled={saving} className="font-black h-11 px-6 rounded-xl shadow-md bg-primary hover:bg-orange-600 text-white border-0">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            저장하기
                        </Button>
                    </div>
                )}
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
                                className="w-full max-w-[600px] min-h-[450px] bg-white shadow-md relative flex justify-center"
                                style={isCanvasData(form.detail_content) ? {} : {
                                    backgroundImage: form.detail_bg_image ? `url(${form.detail_bg_image.replace('PATTERN|', '')})` : 'none',
                                    backgroundSize: form.detail_bg_image?.startsWith('PATTERN|') ? 'auto' : 'cover',
                                    backgroundRepeat: form.detail_bg_image?.startsWith('PATTERN|') ? 'repeat' : 'no-repeat',
                                    backgroundPosition: 'top center',
                                    height: htmlEditorHeight > 450 ? htmlEditorHeight : 'auto'
                                }}
                            >
                                <div className={`${isCanvasData(form.detail_content) ? 'w-full' : 'p-4 prose prose-sm max-w-none break-words'}`} dangerouslySetInnerHTML={{ __html: renderDetailContent(form.detail_content) || '<p class="text-gray-400 text-center mt-10">내용이 없습니다.</p>' }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── 구인 공고 등록 결제 팝업 (독립 컴포넌트로 분리) ─── */}
            {showPaymentModal && (
                <JobPaymentModal
                    initialData={form}
                    jobId={form.id || ''}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={() => {
                        setShowPaymentModal(false);
                        window.location.href = '/biz/jobs';
                    }}
                />
            )}
        </div>
    );
}
