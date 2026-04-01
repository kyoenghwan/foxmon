'use client';

import React, { useState } from 'react';
import { Loader2, Save, Image, Info, DollarSign, MapPin, Phone, AlignLeft, Layers } from 'lucide-react';
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
    is_big: boolean;
    // 상세 내용
    work_type: string;
    work_hours: string;
    benefits: string;
    contact_info: string;
    address: string;
    detail_content: string;
}

const TIER_OPTIONS = [
    {
        value: 'GENERAL',
        label: '일반 광고',
        desc: '기본 노출',
        price: '50,000P',
        color: 'border-gray-200 bg-gray-50',
        active: 'border-gray-600 bg-gray-100 ring-2 ring-gray-400',
    },
    {
        value: 'SPECIAL',
        label: '스페셜 광고',
        desc: '상단 우선 노출',
        price: '150,000P',
        color: 'border-purple-200 bg-purple-50',
        active: 'border-purple-600 bg-purple-50 ring-2 ring-purple-400',
    },
    {
        value: 'PREMIUM',
        label: '프리미엄 광고',
        desc: '최상단 강조 대형 노출',
        price: '300,000P',
        color: 'border-yellow-200 bg-yellow-50',
        active: 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-400',
    },
] as const;

const COLOR_PALETTE = [
    '#FF6B35', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
    '#EC4899', '#14B8A6', '#EF4444', '#6366F1', '#1F2937',
];

interface AdEditorFormProps {
    initialData?: Partial<AdFormData>;
    onSubmit: (data: AdFormData) => Promise<void>;
    isNew?: boolean;
}

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
        is_big: false,
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

            {/* 배너 정보 탭 */}
            {activeTab === 'banner' && (
                <div className="space-y-6">
                    {/* 광고 미리보기 */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h3 className="font-black text-[15px] text-gray-800 mb-4 flex items-center gap-2">
                            <Image className="w-4 h-4 text-primary" />
                            배너 미리보기
                        </h3>
                        <div 
                            className="relative w-full max-w-sm h-28 rounded-xl overflow-hidden flex flex-col justify-end p-4 shadow-md"
                            style={{ backgroundColor: form.color || '#FF6B35' }}
                        >
                            {form.image && (
                                <img src={form.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                            )}
                            <div className="relative z-10 text-white">
                                <p className="font-black text-[16px] leading-tight truncate">{form.title || '공고 제목'}</p>
                                <p className="text-[12px] font-bold opacity-90 mt-0.5">{form.company || '업체명'} · {form.location || '지역'}</p>
                                <p className="text-[12px] font-black mt-1 text-yellow-200">{form.pay || '급여 정보'}</p>
                            </div>
                        </div>
                    </div>

                    {/* 기본 정보 입력 */}
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
                        <div>
                            <label className="text-[12px] font-bold text-gray-600 mb-2 block">배너 테마 색상</label>
                            <div className="flex gap-2 flex-wrap">
                                {COLOR_PALETTE.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => update('color', color)}
                                        className={`w-8 h-8 rounded-full transition-all ${form.color === color ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 광고 등급 선택 */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h3 className="font-black text-[15px] text-gray-800 mb-4 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-primary" />
                            광고 등급 선택
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {TIER_OPTIONS.map(t => (
                                <button
                                    key={t.value}
                                    onClick={() => update('tier', t.value)}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${form.tier === t.value ? t.active : t.color + ' hover:border-gray-300'}`}
                                >
                                    <p className="font-black text-[14px] text-gray-900">{t.label}</p>
                                    <p className="text-[12px] text-gray-600 mt-1">{t.desc}</p>
                                    <p className="text-[13px] font-black text-primary mt-2">{t.price} / 30일</p>
                                </button>
                            ))}
                        </div>
                        <label className="flex items-center gap-2 mt-4 cursor-pointer">
                            <input
                                type="checkbox" checked={form.is_big} onChange={e => update('is_big', e.target.checked)}
                                className="w-4 h-4 accent-primary"
                            />
                            <span className="text-[13px] font-bold text-gray-700">대형 카드로 표시 (추가 50,000P)</span>
                        </label>
                    </div>
                </div>
            )}

            {/* 공고 상세 내용 탭 */}
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
                                <input
                                    type="text" value={form.work_type} onChange={e => update('work_type', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                                    placeholder="예: 상주, 출퇴근, 파트타임"
                                />
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">근무 시간</label>
                                <input
                                    type="text" value={form.work_hours} onChange={e => update('work_hours', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                                    placeholder="예: 오전 10시 ~ 오후 8시"
                                />
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">문의 연락처</label>
                                <input
                                    type="text" value={form.contact_info} onChange={e => update('contact_info', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                                    placeholder="예: 010-0000-0000"
                                />
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">업체 주소</label>
                                <input
                                    type="text" value={form.address} onChange={e => update('address', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                                    placeholder="예: 서울시 강남구 역삼동 123-4"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">복리후생 및 혜택</label>
                            <input
                                type="text" value={form.benefits} onChange={e => update('benefits', e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                                placeholder="예: 식사 제공, 주차 가능, 4대보험"
                            />
                        </div>
                        <div>
                            <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">상세 공고 내용</label>
                            <textarea
                                value={form.detail_content}
                                onChange={e => update('detail_content', e.target.value)}
                                rows={8}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary resize-none leading-relaxed"
                                placeholder="구직자에게 전달할 상세한 공고 내용을 작성해주세요.&#10;예: 업체 소개, 구체적인 업무 내용, 지원 자격, 우대 사항 등"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">배너를 클릭하면 이 내용이 팝업으로 표시됩니다.</p>
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
