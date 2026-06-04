import { supabaseAdmin as supabase } from '@/lib/supabase';
import { AdFormData } from '@/components/biz/AdEditorForm';

interface AdCrudInput {
    actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'GET' | 'GET_ONE';
    userId: string;
    jobId?: string;
    payload?: Partial<AdFormData> & { _isDraft?: boolean; _isPayment?: boolean };
}

// 하드코딩된 JOB_PRICING 상수 제거 (이제 DB에서 동적으로 불러옵니다)

export async function FA_BIZ_AD_CRUD_FLOW({ actionType, userId, jobId, payload }: AdCrudInput) {
    console.log(`⚛️ [FA_BIZ_AD_CRUD_FLOW] ${actionType} 요청 - User: ${userId}, JobId: ${jobId}`);

    try {
        if (actionType === 'CREATE') {
            if (!payload) return { success: false, message: 'payload가 필요합니다.' };

            // 0. 불법 금지어 자체 필터링
            const { checkBadWords } = await import('@/lib/utils/bad-words');
            const titleCheck = await checkBadWords(payload.title || '');
            if (titleCheck.hasBadWord) {
                return { success: false, message: `제목에 불법/유해 금지어 [${titleCheck.word}]가 포함되어 사용할 수 없습니다.` };
            }
            const contentCheck = await checkBadWords(payload.detail_content || '');
            if (contentCheck.hasBadWord) {
                return { success: false, message: `본문에 불법/유해 금지어 [${contentCheck.word}]가 포함되어 사용할 수 없습니다.` };
            }

            // 1. 서버 측에서 최종 결제 포인트 재계산 (보안 검증)
            const isDraft = payload._isDraft === true;
            
            const { GET_POINT_POLICIES } = await import('@/app/actions/pointPolicyActions');
            const policiesRes = await GET_POINT_POLICIES();
            const policies = policiesRes.success && policiesRes.data ? policiesRes.data : [];
            const getPrice = (key: string, def: number = 0) => policies.find(p => p.config_key === key)?.config_value || def;

            const p = (payload.exposure_period || 30) as 30 | 60 | 90;
            const t = payload.tier || 'GENERAL';
            const priceTier = t === 'AD_GENERAL' ? 'GENERAL' : t;
            
            // 티어 기본료 (기간별)
            let totalPoints = getPrice(`TIER_PRICE_${priceTier}_${p}`, 0);
            
            // 더블 슬롯 선택 시 베이스 가격 x 2
            if (payload.option_double_slot) {
                totalPoints *= 2;
            }

            if (payload.option_jump) {
                totalPoints += getPrice(`OPTION_PRICE_BIZ_JUMP_${p}`, 0);
            }

            // 더블 슬롯 시 총액 5% 추가 할인
            if (payload.option_double_slot) {
                totalPoints = Math.floor(totalPoints * 0.95);
            }

            // 2. 포인트 차감 진행 (무조건 자동 차감, 단 isDraft면 생략)
            // + 대행사/관리자 계정이거나 claim_code가 기입된 대행 광고 등록 시 포인트 차감 생략
            const isAgent = userId ? await (async () => {
                const { data: user } = await supabase.from('users').select('role, login_id').eq('id', userId).single();
                return user?.login_id === 'foxmon_ad' || user?.login_id === 'mon_ad' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
            })() : false;

            const skipDeduction = isDraft || isAgent || !!payload.claim_code;

            if (!skipDeduction && totalPoints > 0) {
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
            let expiresAtStr = '';
            if (payload.expires_at) {
                const rawDate = new Date(payload.expires_at);
                rawDate.setHours(23, 59, 59, 999);
                expiresAtStr = rawDate.toISOString();
            } else {
                const expiresAt = new Date();
                if (!isDraft) {
                    expiresAt.setDate(expiresAt.getDate() + p);
                } else {
                    // Draft 모드면 즉시 만료 (노출 안됨)
                    expiresAt.setFullYear(2000);
                }
                expiresAtStr = expiresAt.toISOString();
            }

            const dbPayload = {
                user_id: userId,
                title: payload.title,
                location: payload.location,
                address: payload.address,
                
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
                
                tier: payload.tier || 'GENERAL',
                theme: payload.premium_banner_mode === 'upload' ? 'UPLOAD' : (payload.theme || null),
                effect_intensity: payload.effect_intensity || null,
                color: payload.color || null,
                
                // 결제 및 옵션 추가 컬럼
                exposure_period: p,
                is_subscription: !!payload.is_subscription,
                option_double_slot: !!payload.option_double_slot,
                option_jump: !!payload.option_jump,
                total_points: skipDeduction ? 0 : totalPoints,
                expires_at: expiresAtStr,
                claim_code: payload.claim_code || null
            };

            const { data, error } = await supabase
                .from('biz_ads')
                .insert([dbPayload])
                .select()
                .single();

            if (error) throw error;
            return { success: true, message: '구인 공고가 등록되었습니다.', data };
        }

        if (actionType === 'GET') {
            const { data, error } = await supabase
                .from('biz_ads')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        }

        if (actionType === 'GET_ONE') {
            if (!jobId) return { success: false, message: 'jobId가 필요합니다.' };
            const { data, error } = await supabase
                .from('biz_ads')
                .select('*')
                .eq('id', jobId)
                .single();

            if (error) throw error;
            return { success: true, data };
        }

        if (actionType === 'UPDATE') {
            if (!jobId || !payload) return { success: false, message: 'jobId와 payload가 필요합니다.' };

            // 0. 불법 금지어 자체 필터링
            const { checkBadWords } = await import('@/lib/utils/bad-words');
            const titleCheck = await checkBadWords(payload.title || '');
            if (titleCheck.hasBadWord) {
                return { success: false, message: `제목에 불법/유해 금지어 [${titleCheck.word}]가 포함되어 사용할 수 없습니다.` };
            }
            const contentCheck = await checkBadWords(payload.detail_content || '');
            if (contentCheck.hasBadWord) {
                return { success: false, message: `본문에 불법/유해 금지어 [${contentCheck.word}]가 포함되어 사용할 수 없습니다.` };
            }

            // 1. 기존 공고 확인
            const { data: existingJob, error: checkError } = await supabase
                .from('biz_ads')
                .select('user_id, expires_at')
                .eq('id', jobId)
                .single();
            
            if (checkError || !existingJob) return { success: false, message: '공고를 찾을 수 없습니다.' };
            if (existingJob.user_id !== userId) return { success: false, message: '수정 권한이 없습니다.' };

            // 2. 결제 여부 확인 (pay=true 딥링크 등을 통해 넘어온 유료 옵션 변경인지)
            let totalPoints = 0;
            const isPaymentUpdate = !!payload.exposure_period && payload._isPayment === true;

            if (isPaymentUpdate) {
                // 사업자 검증 상태 조회 (보안 락)
                const { data: userProfile } = await supabase.from('users').select('is_business_verified').eq('id', userId).single();
                if (!userProfile?.is_business_verified) {
                    return { success: false, message: '사업자 검증이 완료되지 않은 업체는 광고 결제 및 노출이 불가능합니다.' };
                }

                const { GET_POINT_POLICIES } = await import('@/app/actions/pointPolicyActions');
                const policiesRes = await GET_POINT_POLICIES();
                const policies = policiesRes.success && policiesRes.data ? policiesRes.data : [];
                const getPrice = (key: string, def: number = 0) => policies.find(p => p.config_key === key)?.config_value || def;

                const p = payload.exposure_period as 30 | 60 | 90;
                const t = payload.tier || 'GENERAL';
                const priceTier = t === 'AD_GENERAL' ? 'GENERAL' : t;
                
                totalPoints = getPrice(`TIER_PRICE_${priceTier}_${p}`, 0);
                
                if (payload.is_subscription) {
                    totalPoints = Math.floor(totalPoints * 0.95);
                }
                
                if (payload.option_double_slot) {
                    totalPoints *= 2;
                }

                if (payload.option_jump) {
                    totalPoints += getPrice(`OPTION_PRICE_BIZ_JUMP_${p}`, 0);
                }

                if (payload.option_double_slot) {
                    totalPoints = Math.floor(totalPoints * 0.95);
                }

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
            const updatePayload: any = {
                title: payload.title,
                location: payload.location,
                address: payload.address,
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
                tier: payload.tier || 'GENERAL',
                theme: payload.premium_banner_mode === 'upload' ? 'UPLOAD' : (payload.theme || null),
                effect_intensity: payload.effect_intensity || null,
                color: payload.color || null,
                claim_code: payload.claim_code !== undefined ? (payload.claim_code || null) : undefined,
                updated_at: new Date().toISOString()
            };

            // 만약 payload.expires_at이 명시적으로 주어졌을 경우 만료일 직접 갱신 처리
            if (payload.expires_at !== undefined) {
                if (payload.expires_at) {
                    const rawDate = new Date(payload.expires_at);
                    rawDate.setHours(23, 59, 59, 999);
                    updatePayload.expires_at = rawDate.toISOString();
                } else {
                    const date2000 = new Date();
                    date2000.setFullYear(2000);
                    updatePayload.expires_at = date2000.toISOString();
                }
            }


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
                if (payload.option_double_slot !== undefined) {
                    updatePayload.option_double_slot = !!payload.option_double_slot;
                    if (updatePayload.option_double_slot) updatePayload.option_double_slot_expires_at = getOptionExpiresAt(p);
                }
                if (payload.option_jump !== undefined) {
                    updatePayload.option_jump = !!payload.option_jump;
                    if (updatePayload.option_jump) updatePayload.option_jump_expires_at = getOptionExpiresAt(p);
                }

                updatePayload.total_points = totalPoints;
                updatePayload.expires_at = expiresAt.toISOString();
            }

            const { data, error } = await supabase
                .from('biz_ads')
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
        console.error(`❌ [FA_BIZ_AD_CRUD_FLOW] ${actionType} 에러:`, error);
        return { success: false, message: error.message || '서버 오류가 발생했습니다.' };
    }
}
