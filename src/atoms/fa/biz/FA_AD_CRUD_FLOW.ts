import { supabaseAdmin as supabase } from '@/lib/supabase';
import { AdFormData } from '@/components/biz/AdEditorForm';
import { safeIconsArray } from '@/lib/ad-service';

interface AdCrudInput {
    actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'GET' | 'GET_ONE';
    userId: string;
    jobId?: string;
    payload?: Partial<AdFormData>;
}

// 하드코딩된 JOB_PRICING 상수 제거 (이제 DB에서 동적으로 불러옵니다)

export async function FA_AD_CRUD_FLOW({ actionType, userId, jobId, payload }: AdCrudInput) {
    console.log(`⚛️ [FA_AD_CRUD_FLOW] ${actionType} 요청 - User: ${userId}, JobId: ${jobId}`);

    try {
        if (actionType === 'CREATE') {
            if (!payload) return { success: false, message: 'payload가 필요합니다.' };

            // 0. 서버 측 유저 인증 상태 검증
            const { data: userProfile, error: profileErr } = await supabase
                .from('users')
                .select('is_cert_verified')
                .eq('id', userId)
                .single();

            if (profileErr || !userProfile || !userProfile.is_cert_verified) {
                return { success: false, message: '프리미엄 광고를 등록하려면 먼저 사업자 2차 인증(등록증 검수)을 완료하셔야 합니다.' };
            }

            // 1. 서버 측에서 최종 결제 포인트 재계산 (보안 검증)
            const { GET_POINT_POLICIES } = await import('@/app/actions/pointPolicyActions');
            const policiesRes = await GET_POINT_POLICIES();
            const policies = policiesRes.success && policiesRes.data ? policiesRes.data : [];
            const getPrice = (key: string, def: number = 0) => policies.find(p => p.config_key === key)?.config_value || def;

            const p = (payload.exposure_period || 30) as 30 | 60 | 90;
            const t = payload.tier || 'GENERAL';
            const priceTier = t === 'AD_GENERAL' ? 'GENERAL' : t;
            
            // _isPayment가 명시적으로 true인 경우에만 실질적 포인트 결제를 수행함
            const isPaymentExecution = payload._isPayment === true;
            
            let totalPoints = 0;
            if (isPaymentExecution) {
                totalPoints = getPrice(`TIER_PRICE_${priceTier}`, 0);
                if (priceTier === 'GENERAL') {
                    totalPoints += getPrice(`OPTION_PRICE_BASE_PERIOD_${p}`, 0);
                }
                if (payload.is_subscription) {
                    totalPoints = Math.floor(totalPoints * 0.95);
                }
                if (payload.option_bold) totalPoints += getPrice(`OPTION_PRICE_BOLD_${p}`, 0);
                if (payload.option_color) totalPoints += getPrice(`OPTION_PRICE_COLOR_${p}`, 0);
                if (payload.option_bg) totalPoints += getPrice(`OPTION_PRICE_BG_${p}`, 0);
                if (payload.option_icon) totalPoints += getPrice(`OPTION_PRICE_ICON_${p}`, 0);
                if (payload.option_jump) totalPoints += getPrice(`OPTION_PRICE_JUMP_${p}`, 0);
            }

            // 2. 포인트 차감 진행 (결제 진행 조건 시에만)
            if (totalPoints > 0) {
                const { FA_DEDUCT_POINT_FOR_AD } = await import('@/src/atoms/fa/points/FA_DEDUCT_POINT_FOR_AD');
                const deductResult = await FA_DEDUCT_POINT_FOR_AD({
                    userId,
                    adPrice: totalPoints,
                    description: `구인 공고 등록 (${p}일 + 옵션)`
                });

                if (!deductResult.success) {
                    return { success: false, message: deductResult.message || '포인트가 부족합니다.' };
                }
            }

            // 3. 만료일 계산
            const expiresAt = new Date();
            if (isPaymentExecution) {
                expiresAt.setDate(expiresAt.getDate() + p);
            } else {
                // 결제를 패스하는 단순 저장의 경우 만료일을 어제로 강제 세팅하여 미결제(OFF)로 유도
                expiresAt.setDate(expiresAt.getDate() - 1);
            }

            const dbPayload = {
                user_id: userId,
                title: payload.title,
                location: payload.location,
                
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
                content: payload.detail_content,
                detail_bg_color: payload.color,
                detail_bg_image: payload.detail_bg_image,
                
                tier: payload.tier || 'GENERAL',
                
                // 결제 및 옵션 추가 컬럼
                exposure_period: p,
                is_subscription: !!payload.is_subscription,
                option_bold: !!payload.option_bold,
                option_color: !!payload.option_color,
                option_color_value: payload.option_color_value || null,
                option_bg: !!payload.option_bg,
                option_bg_value: payload.option_bg_value || null,
                option_icon: !!payload.option_icon,
                option_jump: !!payload.option_jump,
                jump_interval: payload.option_jump ? 1 : 4,
                last_jumped_at: new Date().toISOString(),
                last_exposed_at: new Date().toISOString(),
                total_points: totalPoints,
                expires_at: expiresAt.toISOString(),
                close_date: payload.close_date || '상시채용'
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
            
            const sanitized = (data || []).map(item => ({
                ...item,
                option_general_icons: safeIconsArray(item.option_general_icons)
            }));

            return { success: true, data: sanitized };
        }

        if (actionType === 'GET_ONE') {
            if (!jobId) return { success: false, message: 'jobId가 필요합니다.' };
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (error) throw error;
            if (data) {
                data.option_general_icons = safeIconsArray(data.option_general_icons);
            }
            return { success: true, data };
        }

        if (actionType === 'UPDATE') {
            if (!jobId || !payload) return { success: false, message: 'jobId와 payload가 필요합니다.' };

            // 1. 기존 공고 확인
            const { data: existingJob, error: checkError } = await supabase
                .from('jobs')
                .select('user_id, expires_at')
                .eq('id', jobId)
                .single();
            
            if (checkError || !existingJob) return { success: false, message: '공고를 찾을 수 없습니다.' };
            if (existingJob.user_id !== userId) return { success: false, message: '수정 권한이 없습니다.' };

            // 2. 결제 여부 확인 (pay=true 딥링크 등을 통해 넘어온 유료 옵션 변경인지)
            let totalPoints = 0;
            const isPaymentUpdate = !!payload.exposure_period && payload._isPayment === true;

            if (isPaymentUpdate) {
                const { GET_POINT_POLICIES } = await import('@/app/actions/pointPolicyActions');
                const policiesRes = await GET_POINT_POLICIES();
                const policies = policiesRes.success && policiesRes.data ? policiesRes.data : [];
                const getPrice = (key: string, def: number = 0) => policies.find(p => p.config_key === key)?.config_value || def;

                const p = payload.exposure_period as 30 | 60 | 90;
                totalPoints = getPrice(`OPTION_PRICE_BASE_PERIOD_${p}`, 0);
                
                if (payload.is_subscription) {
                    totalPoints = Math.floor(totalPoints * 0.95);
                }
                
                if (payload.option_bold) totalPoints += getPrice(`OPTION_PRICE_BOLD_${payload.option_bold_period || 30}`, 0);
                if (payload.option_color) totalPoints += getPrice(`OPTION_PRICE_COLOR_${payload.option_color_period || 30}`, 0);
                if (payload.option_bg) totalPoints += getPrice(`OPTION_PRICE_BG_${payload.option_bg_period || 30}`, 0);
                if (payload.option_highlight) totalPoints += getPrice(`OPTION_PRICE_HIGHLIGHT_${payload.option_highlight_period || 30}`, 0);
                if (payload.option_icon) totalPoints += getPrice(`OPTION_PRICE_ICON_${payload.option_icon_period || 30}`, 0);
                const safeGeneralIcons = safeIconsArray(payload.option_general_icons);
                if (safeGeneralIcons.length > 0) {
                    totalPoints += getPrice(`OPTION_PRICE_GENERAL_ICONS_${payload.option_general_icons_period || 30}`, 0) * safeGeneralIcons.length;
                }
                if (payload.option_jump) totalPoints += getPrice(`OPTION_PRICE_JUMP_${payload.option_jump_period || 30}`, 0);

                if (totalPoints > 0) {
                    const { FA_DEDUCT_POINT_FOR_AD } = await import('@/src/atoms/fa/points/FA_DEDUCT_POINT_FOR_AD');
                    const deductResult = await FA_DEDUCT_POINT_FOR_AD({
                        userId,
                        adPrice: totalPoints,
                        description: `구인 공고 연장/옵션 변경 (${p}일)`
                    });

                    if (!deductResult.success) {
                        return { success: false, message: deductResult.message || '포인트가 부족합니다.' };
                    }
                }
            }

            // 3. 업데이트 데이터 구성
            const isStatusOnlyUpdate = payload.status !== undefined && Object.keys(payload).filter(k => k !== 'status' && k !== 'id').length === 0;

            const updatePayload: any = isStatusOnlyUpdate
                ? {
                    status: payload.status,
                    updated_at: new Date().toISOString()
                  }
                : (isPaymentUpdate
                    ? { updated_at: new Date().toISOString() }
                    : {
                        title: payload.title,
                        location: payload.location,
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
                        content: payload.detail_content,
                        detail_bg_color: payload.color,
                        detail_bg_image: payload.detail_bg_image,
                        tier: payload.tier || 'GENERAL',
                        close_date: payload.close_date || '상시채용',
                        status: payload.status || undefined,
                        updated_at: new Date().toISOString()
                    });

            // 결제 연장인 경우 만료일 및 옵션 갱신
            if (isPaymentUpdate) {
                const p = payload.exposure_period as 30 | 60 | 90;
                
                // 베이스 (공고 자체) 만료일 계산 (기존 남은 기간에 연장)
                const expiresAt = existingJob.expires_at ? new Date(existingJob.expires_at) : new Date();
                if (expiresAt < new Date()) expiresAt.setTime(new Date().getTime());
                expiresAt.setDate(expiresAt.getDate() + p);
                
                // 개별 옵션 만료일 계산 헬퍼 함수 (옵션은 현재 결제 시점부터 시작)
                const getOptionExpiresAt = (period: 30 | 60 | 90) => {
                    const optDate = new Date();
                    optDate.setDate(optDate.getDate() + period);
                    return optDate.toISOString();
                };

                updatePayload.exposure_period = p;
                if (payload.is_subscription !== undefined) {
                    updatePayload.is_subscription = !!payload.is_subscription;
                }
                
                if (payload.option_bold !== undefined) {
                    updatePayload.option_bold = !!payload.option_bold;
                    if (updatePayload.option_bold) updatePayload.option_bold_expires_at = getOptionExpiresAt(payload.option_bold_period || 30);
                }
                if (payload.option_color !== undefined) {
                    updatePayload.option_color = !!payload.option_color;
                    updatePayload.option_color_value = payload.option_color_value || null;
                    if (updatePayload.option_color) updatePayload.option_color_expires_at = getOptionExpiresAt(payload.option_color_period || 30);
                }
                if (payload.option_bg !== undefined) {
                    updatePayload.option_bg = !!payload.option_bg;
                    updatePayload.option_bg_value = payload.option_bg_value || null;
                    if (updatePayload.option_bg) updatePayload.option_bg_expires_at = getOptionExpiresAt(payload.option_bg_period || 30);
                }
                if (payload.option_highlight !== undefined) {
                    updatePayload.option_highlight = !!payload.option_highlight;
                    updatePayload.option_highlight_value = payload.option_highlight_value || null;
                    if (updatePayload.option_highlight) updatePayload.option_highlight_expires_at = getOptionExpiresAt(payload.option_highlight_period || 30);
                }
                if (payload.option_icon !== undefined) {
                    updatePayload.option_icon = !!payload.option_icon;
                    if (updatePayload.option_icon) updatePayload.option_icon_expires_at = getOptionExpiresAt(payload.option_icon_period || 30);
                }
                if (payload.option_general_icons !== undefined) {
                    const safeGeneralIconsUpdate = safeIconsArray(payload.option_general_icons);
                    updatePayload.option_general_icons = safeGeneralIconsUpdate;
                    if (safeGeneralIconsUpdate.length > 0) {
                        updatePayload.option_general_icons_expires_at = getOptionExpiresAt(payload.option_general_icons_period || 30);
                    }
                }
                if (payload.option_jump !== undefined) {
                    updatePayload.option_jump = !!payload.option_jump;
                    updatePayload.jump_interval = updatePayload.option_jump ? 1 : 4;
                    updatePayload.last_jumped_at = new Date().toISOString();
                    updatePayload.last_exposed_at = new Date().toISOString();
                    if (updatePayload.option_jump) updatePayload.option_jump_expires_at = getOptionExpiresAt(payload.option_jump_period || 30);
                }

                updatePayload.total_points = totalPoints;
                updatePayload.expires_at = expiresAt.toISOString();
            }

            if (payload.option_jump !== undefined && !isPaymentUpdate) {
                updatePayload.option_jump = !!payload.option_jump;
                updatePayload.jump_interval = updatePayload.option_jump ? 1 : 4;
                updatePayload.last_jumped_at = new Date().toISOString();
                updatePayload.last_exposed_at = new Date().toISOString();
            }

            const { data, error } = await supabase
                .from('jobs')
                .update(updatePayload)
                .eq('id', jobId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, message: '구인 공고가 수정되었습니다.', data };
        }

        // TODO: DELETE 구현
        return { success: false, message: '지원하지 않는 액션입니다.' };

    } catch (error: any) {
        console.error(`❌ [FA_AD_CRUD_FLOW] ${actionType} 에러:`, error);
        return { success: false, message: error.message || '서버 오류가 발생했습니다.' };
    }
}
