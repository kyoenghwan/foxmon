import { supabaseAdmin as supabase } from '@/lib/supabase';
import { AdFormData } from '@/components/biz/AdEditorForm';

interface AdCrudInput {
    actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'GET';
    userId: string;
    jobId?: string;
    payload?: Partial<AdFormData>;
}

export async function FA_AD_CRUD_FLOW({ actionType, userId, jobId, payload }: AdCrudInput) {
    console.log(`⚛️ [FA_AD_CRUD_FLOW] ${actionType} 요청 - User: ${userId}, JobId: ${jobId}`);

    try {
        if (actionType === 'CREATE') {
            if (!payload) return { success: false, message: 'payload가 필요합니다.' };

            // 기본 ad-service.ts의 jobs 스키마 호환성을 위한 매핑
            const payString = `[${payload.pay_type || ''}] ${payload.pay_amount || ''}원`;

            const dbPayload = {
                user_id: userId,
                // 호환성 컬럼
                company: payload.company || payload.business_name,
                title: payload.title,
                location: payload.location,
                pay: payString,
                image: payload.logo_url || payload.image,
                color: payload.color || 'orange',
                time: payload.work_hours,
                is_big: false,
                tier: payload.tier || 'GENERAL',
                weight: 1,
                exposure_count: 0,
                last_exposed_at: new Date().toISOString(),
                
                // 상세 컬럼 (DB 스키마에 추가된 컬럼들)
                company_name: payload.company || payload.business_name,
                salary_type: payload.pay_type,
                salary_amount: payload.pay_amount,
                logo_url: payload.logo_url || payload.image,
                contact_name: payload.manager_name,
                contact_phone: payload.contact_phone,
                kakao_id: payload.kakao_id,
                line_id: payload.line_id,
                telegram_id: payload.telegram_id,
                wechat_id: payload.wechat_id,
                employment_type: payload.employment_type,
                category1: payload.category_1,
                category2: payload.category_2,
                work_time: payload.work_hours,
                amenities: payload.amenities || [],
                keywords: payload.keywords || [],
                design_mode: payload.design_mode,
                detail_content: payload.detail_content,
                detail_bg_color: payload.color,
                detail_bg_image: payload.detail_bg_image,
            };

            const { data, error } = await supabase
                .from('jobs')
                .insert([dbPayload])
                .select()
                .single();

            if (error) throw error;
            return { success: true, message: '구인 공고가 등록되었습니다.', data };
        }

        if (actionType === 'GET') {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        }

        // TODO: UPDATE, DELETE 구현
        return { success: false, message: '지원하지 않는 액션입니다.' };

    } catch (error: any) {
        console.error(`❌ [FA_AD_CRUD_FLOW] ${actionType} 에러:`, error);
        return { success: false, message: error.message || '서버 오류가 발생했습니다.' };
    }
}
