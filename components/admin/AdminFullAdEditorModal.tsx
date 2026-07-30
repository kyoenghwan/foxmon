'use client';

import React, { useState } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { AdEditorForm, AdFormData } from '@/components/biz/AdEditorForm';
import { adminUpdateAdAction } from '@/lib/actions/admin-ad-actions';

interface AdminFullAdEditorModalProps {
    ad: any;
    onClose: () => void;
    onSuccess: () => void;
}

export function AdminFullAdEditorModal({ ad, onClose, onSuccess }: AdminFullAdEditorModalProps) {
    const [isSaving, setIsSaving] = useState(false);

    // DB 데이터를 AdFormData 인터페이스 형태로 매핑
    const initialFormData: Partial<AdFormData> = {
        id: ad.id,
        title: ad.title || '',
        company: ad.company_name || ad.company || '',
        business_name: ad.company_name || ad.company || '',
        location: ad.location || '',
        address: ad.address || '',
        pay_type: ad.salary_type || '시급',
        pay_amount: ad.salary_amount || ad.pay || '',
        pay: ad.pay || '',
        manager_name: ad.contact_name || '',
        contact_phone: ad.contact_phone || '',
        kakao_id: ad.kakao_id || '',
        line_id: ad.line_id || '',
        telegram_id: ad.telegram_id || '',
        wechat_id: ad.wechat_id || '',
        employment_type: ad.employment_type || '',
        category_1: ad.category1 || ad.category_1 || '',
        category_2: ad.category2 || ad.category_2 || '',
        work_hours: ad.work_time || ad.work_hours || '',
        amenities: ad.amenities || [],
        keywords: ad.keywords || [],
        tier: ad.tier || 'GENERAL',
        theme: ad.theme || '',
        color: ad.detail_bg_color || ad.color || '',
        detail_bg_image: ad.detail_bg_image || '',
        detail_content: ad.detail_content || ad.content || '',
        image: ad.image_url || ad.image || ad.logo_url || '',
        logo_url: ad.logo_url || '',
        design_mode: ad.design_mode || 'template',
        status: ad.status || 'ACTIVE',
        exposure_period: ad.exposure_period || 30,
        option_double_slot: !!ad.option_double_slot,
        option_jump: !!ad.option_jump,
        close_date: ad.close_date || '',
        expires_at: ad.expires_at || ''
    };

    const handleFormSubmit = async (formData: AdFormData) => {
        setIsSaving(true);
        try {
            const isJob = ad.is_job || ad.tier === 'GENERAL';
            
            const updatePayload: any = {
                title: formData.title,
                company_name: formData.company || formData.business_name,
                location: formData.location,
                address: formData.address,
                salary_type: formData.pay_type,
                salary_amount: formData.pay_amount,
                pay: `[${formData.pay_type || '급여'}] ${formData.pay_amount || ''}`,
                contact_name: formData.manager_name,
                contact_phone: formData.contact_phone,
                kakao_id: formData.kakao_id,
                line_id: formData.line_id,
                telegram_id: formData.telegram_id,
                wechat_id: formData.wechat_id,
                employment_type: formData.employment_type,
                category1: formData.category_1,
                category2: formData.category_2,
                work_time: formData.work_hours,
                amenities: formData.amenities || [],
                keywords: formData.keywords || [],
                design_mode: formData.design_mode,
                detail_content: formData.detail_content,
                detail_bg_color: formData.color,
                detail_bg_image: formData.detail_bg_image,
                tier: formData.tier,
                theme: formData.theme,
                image_url: formData.image,
                logo_url: formData.logo_url || formData.image,
                option_double_slot: !!formData.option_double_slot,
                option_jump: !!formData.option_jump,
            };

            const res = await adminUpdateAdAction(ad.id, updatePayload, isJob);

            if (res.success) {
                alert('🎉 관리자 권한으로 사용자 등록 내용이 완전 수정 및 저장되었습니다!');
                onSuccess();
                onClose();
            } else {
                alert(res.message || '저장 도중 오류가 발생했습니다.');
            }
        } catch (err: any) {
            alert('오류 발생: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 my-auto animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-900 text-white shrink-0">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        <div>
                            <h3 className="text-base font-black tracking-tight">관리자 권한 - 사용자 공고 원본 전체 편집기</h3>
                            <p className="text-xs text-gray-400">사용자가 등록한 캔버스 디자인, 본문 에디터, 키워드, 카테고리, 상세 옵션을 그대로 수정합니다.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body / AdEditorForm Container */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50">
                    <AdEditorForm
                        initialData={initialFormData}
                        onSubmit={handleFormSubmit}
                        isNew={false}
                        mode={ad.tier === 'GENERAL' ? 'JOB' : 'AD'}
                    />
                </div>
            </div>
        </div>
    );
}
