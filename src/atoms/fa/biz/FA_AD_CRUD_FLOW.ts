import { supabaseAdmin as supabase } from '@/lib/supabase';
import { AdFormData } from '@/components/biz/AdEditorForm';
import { safeIconsArray } from '@/lib/utils';

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
                .select('*')
                .eq('id', jobId)
                .single();
            
            if (checkError || !existingJob) return { success: false, message: '공고를 찾을 수 없습니다.' };
            if (existingJob.user_id !== userId) return { success: false, message: '수정 권한이 없습니다.' };

            // 2. 결제 여부 및 일할 비례(Pro-rata) 계산
            const currentExpiresAt = existingJob.expires_at ? new Date(existingJob.expires_at) : null;
            const isCurrentlyActive = currentExpiresAt && currentExpiresAt.getTime() > Date.now();
            const remainingDays = isCurrentlyActive 
                ? Math.max(1, Math.ceil((currentExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                : 0;

            let totalPoints = 0;
            const isPaymentUpdate = payload._isPayment === true;

            if (isPaymentUpdate) {
                const { GET_POINT_POLICIES } = await import('@/app/actions/pointPolicyActions');
                const policiesRes = await GET_POINT_POLICIES();
                const policies = policiesRes.success && policiesRes.data ? policiesRes.data : [];
                const getPrice = (key: string, def: number = 0) => {
                    const found = policies.find(p => p.config_key === key);
                    return found ? Number(found.config_value) : def;
                };

                const p = Number(payload.exposure_period || 0);
                const totalExposureDays = isCurrentlyActive 
                    ? (remainingDays + p) 
                    : (p > 0 ? p : 30);

                // 1. 노출 기간 연장 패키지 금액
                if (p > 0) {
                    let basePrice = getPrice(`OPTION_PRICE_BASE_PERIOD_${p}`, p === 30 ? 70000 : p === 60 ? 125000 : 189000);
                    if (payload.is_subscription) {
                        basePrice = Math.floor(basePrice * 0.95);
                    }
                    totalPoints += basePrice;
                }

                // 2. 부가 옵션 금액 (프론트엔드와 100% 동일한 정밀 일할 계산)
                const calcOpt = (isOpt: boolean, wasOpt: boolean, key: string, defP: number) => {
                    const baseUnitPrice = getPrice(key, defP);

                    if (isOpt) {
                        if (wasOpt && isCurrentlyActive) {
                            if (p > 0) {
                                totalPoints += Math.floor(baseUnitPrice * (p / 30));
                            }
                        } else {
                            totalPoints += Math.floor(baseUnitPrice * (totalExposureDays / 30));
                        }
                    } else if (wasOpt && isCurrentlyActive) {
                        const remainingValue = Math.floor(baseUnitPrice * (remainingDays / 30));
                        const fee = Math.floor(remainingValue * 0.05);
                        totalPoints -= (remainingValue - fee);
                    }
                };

                calcOpt(!!payload.option_bold, !!existingJob.option_bold, 'OPTION_PRICE_BOLD', 30000);
                calcOpt(!!payload.option_color, !!existingJob.option_color, 'OPTION_PRICE_COLOR', 15000);
                calcOpt(!!payload.option_bg, !!existingJob.option_bg, 'OPTION_PRICE_BG', 15000);
                calcOpt(!!payload.option_highlight, !!existingJob.option_highlight, 'OPTION_PRICE_HIGHLIGHT', 15000);
                calcOpt(!!payload.option_icon, !!existingJob.option_icon, 'OPTION_PRICE_ICON', 15000);

                // 일반 아이콘 정밀 계산
                const safeGenIcons = safeIconsArray(payload.option_general_icons);
                const initGenIcons = safeIconsArray(existingJob.option_general_icons);
                const iconUnitPrice = getPrice('OPTION_PRICE_GENERAL_ICONS', 10000);

                const addedIcons = safeGenIcons.filter(ic => !initGenIcons.includes(ic));
                if (addedIcons.length > 0) {
                    totalPoints += Math.floor(iconUnitPrice * addedIcons.length * (totalExposureDays / 30));
                }

                const removedIcons = initGenIcons.filter(ic => !safeGenIcons.includes(ic));
                if (removedIcons.length > 0 && isCurrentlyActive) {
                    const val = Math.floor(iconUnitPrice * removedIcons.length * (remainingDays / 30));
                    const fee = Math.floor(val * 0.05);
                    totalPoints -= (val - fee);
                }

                const keptIcons = safeGenIcons.filter(ic => initGenIcons.includes(ic));
                if (keptIcons.length > 0 && p > 0) {
                    totalPoints += Math.floor(iconUnitPrice * keptIcons.length * (p / 30));
                }

                calcOpt(!!payload.option_jump, !!existingJob.option_jump, 'OPTION_PRICE_JUMP', 30000);

                if (totalPoints > 0) {
                    const { FA_DEDUCT_POINT_FOR_AD } = await import('@/src/atoms/fa/points/FA_DEDUCT_POINT_FOR_AD');
                    const deductResult = await FA_DEDUCT_POINT_FOR_AD({
                        userId,
                        adPrice: totalPoints,
                        description: p > 0 ? `구인 공고 연장/옵션 (${p}일)` : `구인 공고 옵션 추가/변경`
                    });

                    if (!deductResult.success) {
                        return { success: false, message: deductResult.message || '포인트가 부족합니다.' };
                    }
                } else if (totalPoints < 0) {
                    const refundAmount = Math.abs(totalPoints);
                    const { data: userBefore } = await supabase.from('users').select('paid_points, bonus_points').eq('id', userId).single();
                    const currentPaid = Number(userBefore?.paid_points || 0);
                    const currentBonus = Number(userBefore?.bonus_points || 0);

                    // 유료 포인트로 환불 처리 (수수료 5% 차감 완료된 수량)
                    await supabase.from('users').update({ paid_points: currentPaid + refundAmount }).eq('id', userId);
                    await supabase.from('point_recharge_history').insert({
                        user_id: userId,
                        charge_point: refundAmount,
                        remained_point: refundAmount,
                        payment_method: 'OPTION_REFUND',
                        status: 'COMPLETED',
                        description: '구인 공고 옵션 해제 환불 (수수료 5% 차감 후)'
                    });
                    await supabase.from('point_transactions').insert({
                        user_id: userId,
                        type: 'REFUND',
                        amount: refundAmount,
                        balance_after: currentPaid + currentBonus + refundAmount,
                        description: '구인 공고 옵션 해제 포인트 환급'
                    });
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
                const p = Number(payload.exposure_period || 0);
                
                let expiresAt = existingJob.expires_at ? new Date(existingJob.expires_at) : new Date();
                if (expiresAt < new Date()) expiresAt = new Date();

                if (p > 0) {
                    expiresAt.setDate(expiresAt.getDate() + p);
                    updatePayload.exposure_period = p;
                    updatePayload.expires_at = expiresAt.toISOString();
                } else if (!existingJob.expires_at) {
                    expiresAt.setDate(expiresAt.getDate() + 30);
                    updatePayload.expires_at = expiresAt.toISOString();
                }

                if (payload.is_subscription !== undefined) {
                    updatePayload.is_subscription = !!payload.is_subscription;
                }

                const getOptionExpiresAt = (period: number) => {
                    if (p > 0) {
                        const optDate = new Date();
                        optDate.setDate(optDate.getDate() + period);
                        return optDate.toISOString();
                    }
                    return expiresAt.toISOString();
                };

                if (payload.option_bold !== undefined) {
                    updatePayload.option_bold = !!payload.option_bold;
                    updatePayload.option_bold_expires_at = updatePayload.option_bold ? getOptionExpiresAt(payload.option_bold_period || 30) : null;
                }
                if (payload.option_color !== undefined) {
                    updatePayload.option_color = !!payload.option_color;
                    updatePayload.option_color_value = payload.option_color_value || null;
                    updatePayload.option_color_expires_at = updatePayload.option_color ? getOptionExpiresAt(payload.option_color_period || 30) : null;
                }
                if (payload.option_bg !== undefined) {
                    updatePayload.option_bg = !!payload.option_bg;
                    updatePayload.option_bg_value = payload.option_bg_value || null;
                    updatePayload.option_bg_expires_at = updatePayload.option_bg ? getOptionExpiresAt(payload.option_bg_period || 30) : null;
                }
                if (payload.option_highlight !== undefined) {
                    updatePayload.option_highlight = !!payload.option_highlight;
                    updatePayload.option_highlight_value = payload.option_highlight_value || null;
                    updatePayload.option_highlight_expires_at = updatePayload.option_highlight ? getOptionExpiresAt(payload.option_highlight_period || 30) : null;
                }
                if (payload.option_icon !== undefined) {
                    updatePayload.option_icon = !!payload.option_icon;
                    updatePayload.option_icon_expires_at = updatePayload.option_icon ? getOptionExpiresAt(payload.option_icon_period || 30) : null;
                }
                if (payload.option_general_icons !== undefined) {
                    const safeGeneralIconsUpdate = safeIconsArray(payload.option_general_icons);
                    updatePayload.option_general_icons = safeGeneralIconsUpdate;
                    updatePayload.option_general_icons_expires_at = safeGeneralIconsUpdate.length > 0 ? getOptionExpiresAt(payload.option_general_icons_period || 30) : null;
                }
                if (payload.option_jump !== undefined) {
                    updatePayload.option_jump = !!payload.option_jump;
                    updatePayload.jump_interval = updatePayload.option_jump ? 1 : 4;
                    updatePayload.last_jumped_at = new Date().toISOString();
                    updatePayload.last_exposed_at = new Date().toISOString();
                    updatePayload.option_jump_expires_at = updatePayload.option_jump ? getOptionExpiresAt(payload.option_jump_period || 30) : null;
                }

                updatePayload.total_points = totalPoints;
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
