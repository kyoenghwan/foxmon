import React from 'react';
import { JobEditorForm } from '@/components/biz/JobEditorForm';
import { manageAdAction } from '@/lib/actions';
import { notFound } from 'next/navigation';

export default async function BizJobEditPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const res = await manageAdAction('GET_ONE', undefined, resolvedParams.id);
    
    if (!res.success || !res.data) {
        notFound();
    }

    const job = res.data;
    
    // DB 데이터를 AdFormData 인터페이스에 맞게 매핑
    const initialData = {
        id: job.id,
        title: job.title,
        location: job.location,
        company: job.company_name,
        business_name: job.company_name,
        pay_type: job.salary_type,
        pay_amount: job.salary_amount,
        pay: `${job.salary_type || ''} ${job.salary_amount || ''}`.trim(),
        image: job.logo_url || '',
        logo_url: job.logo_url || '',
        manager_name: job.contact_name,
        contact_phone: job.contact_phone,
        kakao_id: job.kakao_id,
        line_id: job.line_id,
        telegram_id: job.telegram_id,
        wechat_id: job.wechat_id,
        employment_type: job.employment_type,
        category_1: job.category1,
        category_2: job.category2,
        work_hours: job.work_time,
        amenities: job.amenities || [],
        keywords: job.keywords || [],
        design_mode: job.design_mode,
        detail_content: job.detail_content,
        color: job.detail_bg_color || '#F97316',
        detail_bg_image: job.detail_bg_image,
        
        // 결제 옵션 정보 렌더링 (참고용)
        exposure_period: job.exposure_period,
        option_bold: job.option_bold,
        option_color: job.option_color,
        option_bg: job.option_bg,
        option_icon: job.option_icon,
        option_jump: job.option_jump,
        
        // 필수 값 더미 (JobEditorForm에서 사용하지 않거나 추후 연결)
        tier: 'GENERAL' as any,
        auto_renew: false,
        work_type: '',
        benefits: '',
        contact_info: '',
        address: job.address || ''
    };

    return (
        <div className="max-w-7xl mx-auto py-8">
            <div className="mb-8">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">구인 공고 수정</h2>
                <p className="text-sm text-gray-500 font-medium mt-1">
                    등록하신 공고의 내용을 수정하거나 프리미엄 옵션을 연장할 수 있습니다.
                </p>
            </div>
            
            <JobEditorForm 
                initialData={initialData} 
                isNew={false}
                onSubmit={async (data) => {
                    'use server';
                    // 업데이트 액션 호출
                    const updateRes = await manageAdAction('UPDATE', data, resolvedParams.id);
                    if (!updateRes.success) {
                        throw new Error(updateRes.message);
                    }
                    // 성공 시 반환
                }} 
            />
        </div>
    );
}
