import { supabaseAdmin as supabase } from '@/lib/supabase';
import { AdFormData } from '@/components/biz/AdEditorForm';

interface AdCrudInput {
    actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'GET' | 'GET_ONE';
    userId: string;
    jobId?: string;
    payload?: Partial<AdFormData> & { _isDraft?: boolean; _isPayment?: boolean; is_extension?: boolean };
}

// 한국 표준시(KST, UTC+9) 기준 expires_at 생성 헬퍼 함수
const getKSTExpiresAt = (period: number, baseDate?: Date) => {
    const base = baseDate ? new Date(baseDate.getTime()) : new Date();
    // KST 날짜 객체 연산을 위해 기준 시각 밀리초에 9시간 추가
    const kstTime = base.getTime() + (9 * 60 * 60 * 1000);
    const kstDate = new Date(kstTime);
    
    kstDate.setUTCDate(kstDate.getUTCDate() + period);
    
    const year = kstDate.getUTCFullYear();
    const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(kstDate.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}T23:59:59.999+09:00`;
};

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
            const priceTier = t;
            
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
            // 생성 시에는 무조건 결제 전(임시저장) 상태이므로 즉시 만료 연도 2000년으로 지정 (노출 차단)
            const expiresAtStr = '2000-01-01T00:00:00.000+09:00';

            const isUploadMode = payload.premium_banner_mode === 'upload' || payload.theme === 'UPLOAD';
            const dbPayload = {
                user_id: userId,
                title: payload.title,
                location: payload.location,
                address: payload.address,
                image_url: payload.image || null,
                
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
                theme: isUploadMode ? 'UPLOAD' : (payload.theme || null),
                effect_intensity: payload.effect_intensity || null,
                color: payload.color || null,
                
                // 결제 및 옵션 추가 컬럼
                exposure_period: p,
                is_subscription: !!payload.is_subscription,
                option_double_slot: !!payload.option_double_slot,
                option_jump: !!payload.option_jump,
                jump_interval: payload.option_jump ? 1 : 4,
                last_jumped_at: new Date().toISOString(),
                last_exposed_at: new Date().toISOString(),
                total_points: skipDeduction ? 0 : totalPoints,
                expires_at: expiresAtStr,
                claim_code: payload.claim_code || null,
                status: 'PAUSED'
            };

            const { data, error } = await supabase
                .from('biz_ads')
                .insert([dbPayload])
                .select()
                .single();

            if (error) throw error;
            await syncLinkedJob(data);
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
            const { data: rawJob, error: checkError } = await supabase
                .from('biz_ads')
                .select('user_id, expires_at, option_double_slot, option_highlight')
                .eq('id', jobId)
                .single();
            
            const existingJob = rawJob as any;
            
            if (checkError || !existingJob) return { success: false, message: '공고를 찾을 수 없습니다.' };
            if (existingJob.user_id !== userId) return { success: false, message: '수정 권한이 없습니다.' };

            // 2. 결제 여부 확인 (pay=true 딥링크 등을 통해 넘어온 유료 옵션 변경인지)
            let totalPoints = 0;
            const isPaymentUpdate = !!payload.exposure_period && payload._isPayment === true;

            if (isPaymentUpdate) {
                // 사업자 검증 상태 조회 (보안 락)
                const { data: userProfile } = await supabase.from('users').select('is_cert_verified').eq('id', userId).single();
                if (!userProfile?.is_cert_verified) {
                    return { success: false, message: '사업자 2차 검증(등록증)이 완료되지 않은 업체는 광고 결제 및 노출이 불가능합니다.' };
                }

                const { GET_POINT_POLICIES } = await import('@/app/actions/pointPolicyActions');
                const policiesRes = await GET_POINT_POLICIES();
                const policies = policiesRes.success && policiesRes.data ? policiesRes.data : [];
                const getPrice = (key: string, def: number = 0) => policies.find(p => p.config_key === key)?.config_value || def;

                const p = payload.exposure_period as 30 | 60 | 90;
                const t = payload.tier || 'GENERAL';
                const priceTier = t;

                const basePrice = getPrice(`TIER_PRICE_${priceTier}_${p}`, 0);
                const themeEffectPrice = getPrice(`OPTION_PRICE_BIZ_THEME_EFFECT_${p}`, 30000);
                const fixedPrice = getPrice(`OPTION_PRICE_SIDE_FIXED_${p}`, basePrice * 3);

                // 이미 결제 완료된 유효한 광고가 게재 중인 상태인지 판별
                const isAlreadyPaid = existingJob.expires_at && new Date(existingJob.expires_at).getFullYear() !== 2000 && new Date(existingJob.expires_at) > new Date();
                const isExtension = payload.is_extension === true; // 클라이언트로부터 기간 연장 요청 여부
                let refundPoints = 0;

                if (isAlreadyPaid && !isExtension) {
                    // ─── [도중 옵션 추가 결제: 일할 계산 모드] ───
                    const now = new Date();
                    const expiresAt = new Date(existingJob.expires_at!);
                    const remainingDays = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                    const prorationRatio = Math.min(1, Math.max(0, remainingDays / p));

                    let additionalCost = 0;

                    // 1. 연속 노출 옵션 추가 구매 (기존 미구매였는데 새로 선택된 경우)
                    if (payload.option_double_slot && !existingJob.option_double_slot) {
                        const optionBase = payload.option_fixed ? fixedPrice : basePrice;
                        const doubleCost = Math.floor(optionBase * 0.95); // 더블 슬롯 할인 적용
                        additionalCost += Math.floor(doubleCost * prorationRatio);
                    }

                    // 1-2. 연속 노출 옵션 중도 해지/취소 (기존 구매 상태였는데 체크 해제한 경우)
                    if (payload.option_double_slot === false && existingJob.option_double_slot) {
                        const optionBase = existingJob.is_fixed ? fixedPrice : basePrice;
                        // 5% 할인되기 전 금액인 optionBase 에 대해 남은 일수만큼 포인트를 환급
                        const doubleRefund = Math.floor(optionBase * prorationRatio);
                        additionalCost -= doubleRefund;
                    }

                    // 2. 스페셜 테마 이펙트 옵션 추가 구매 (기존 미구매였는데 새로 선택된 경우)
                    if (payload.option_highlight && !existingJob.option_highlight) {
                        additionalCost += Math.floor(themeEffectPrice * prorationRatio);
                    }

                    // 3. 고정 노출 옵션 추가 구매 (기존 미구매였는데 새로 선택된 경우)
                    if (payload.option_fixed && !existingJob.is_fixed) {
                        const upgradeDiff = Math.max(0, fixedPrice - basePrice);
                        additionalCost += Math.floor(upgradeDiff * prorationRatio);
                    }

                    if (additionalCost < 0) {
                        refundPoints = Math.abs(additionalCost);
                        totalPoints = 0;
                    } else {
                        totalPoints = additionalCost;
                    }
                } else if (isAlreadyPaid && isExtension) {
                    // ─── [이미 결제된 광고의 기간 연장 모드: 추가 연장 기간 비례 계산] ───
                    const prevDays = existingJob.exposure_period || 30;
                    const extDays = payload.exposure_period as 30 | 60 | 90;

                    if (extDays > prevDays) {
                        const deltaDays = extDays - prevDays;
                        const unitBase = (payload.option_fixed ? fixedPrice : basePrice) / extDays;
                        let unitTotal = unitBase;

                        if (payload.is_subscription) {
                            unitTotal = unitTotal * 0.95;
                        }

                        if (payload.option_double_slot) {
                            unitTotal = unitTotal * 2 * 0.95; // 더블 슬롯 5% 할인 적용
                        }

                        totalPoints = Math.floor(unitTotal * deltaDays);
                    } else {
                        totalPoints = 0;
                    }
                } else {
                    // ─── [미결제 상태 광고의 순수 신규 결제 모드] ───
                    let base = payload.option_fixed ? fixedPrice : basePrice;
                    totalPoints = base;
                    
                    if (payload.is_subscription) {
                        totalPoints = Math.floor(totalPoints * 0.95);
                    }

                    if (payload.option_double_slot) {
                        totalPoints *= 2;
                    }

                    if (payload.option_highlight) {
                        totalPoints += themeEffectPrice;
                    }

                    if (payload.option_double_slot) {
                        totalPoints = Math.floor(totalPoints * 0.95); // 5% 할인
                    }
                }

                // 환불할 포인트가 있는 경우 사용자 paid_points 즉시 복구 업데이트
                if (refundPoints > 0) {
                    const { data: userPointsCurrent, error: userFetchError } = await supabase
                        .from('users')
                        .select('paid_points, bonus_points')
                        .eq('id', userId)
                        .single();

                    if (userFetchError || !userPointsCurrent) {
                        throw new Error(`사용자 포인트 정보를 조회할 수 없습니다: ${userFetchError?.message || ''}`);
                    }

                    const newPaid = Number(userPointsCurrent.paid_points || 0) + refundPoints;
                    const { error: userPointsUpdateError } = await supabase
                        .from('users')
                        .update({ paid_points: newPaid })
                        .eq('id', userId);

                    if (userPointsUpdateError) {
                        throw new Error(`사용자 환불 포인트 적립 실패: ${userPointsUpdateError.message}`);
                    }

                    // 포인트 거래 트랜잭션 기록 적재
                    const balanceAfter = newPaid + Number(userPointsCurrent.bonus_points || 0);
                    await supabase
                        .from('point_transactions')
                        .insert({
                            user_id: userId,
                            type: 'CHARGE',
                            amount: refundPoints,
                            balance_after: balanceAfter,
                            description: `[구인광고 옵션 철회 환불] ${existingJob.title} 연속 노출 해지 반환`
                        });
                }

                if (totalPoints > 0) {
                    const { FA_DEDUCT_POINT_FOR_AD } = await import('@/src/atoms/fa/points/FA_DEDUCT_POINT_FOR_AD');
                    const deductResult = await FA_DEDUCT_POINT_FOR_AD({
                        userId,
                        adPrice: totalPoints,
                        description: isAlreadyPaid && !isExtension 
                            ? `구인 광고 옵션 도중 추가 (남은 ${Math.max(0, Math.ceil((new Date(existingJob.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}일 일할 계산)`
                            : `구인 공고 연장/결제 (${p}일)`
                    });

                    if (!deductResult.success) {
                        return { success: false, message: deductResult.message || '포인트가 부족합니다.' };
                    }
                }
            }

            // 3. 업데이트 데이터 구성
            const isUploadMode = payload.premium_banner_mode === 'upload' || payload.theme === 'UPLOAD';
            const updatePayload: any = {
                title: payload.title,
                location: payload.location,
                address: payload.address,
                image_url: payload.image !== undefined ? payload.image : undefined,
                company_name: payload.company || payload.business_name,
                salary_type: payload.pay_type,
                salary_amount: payload.pay_amount,
                logo_url: payload.logo_url !== undefined ? payload.logo_url : undefined,
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
                theme: isUploadMode ? 'UPLOAD' : (payload.theme || null),
                effect_intensity: payload.effect_intensity || null,
                color: payload.color || null,
                claim_code: payload.claim_code !== undefined ? (payload.claim_code || null) : undefined,
                updated_at: new Date().toISOString(),
                status: (existingJob.expires_at && new Date(existingJob.expires_at).getFullYear() !== 2000) ? 'ACTIVE' : 'PAUSED'
            };

            // 만약 payload.expires_at이 명시적으로 주어졌을 경우 만료일 직접 갱신 처리
            if (payload.expires_at !== undefined) {
                const existingExpiresYear = existingJob.expires_at ? new Date(existingJob.expires_at).getFullYear() : 2000;
                const isAlreadyPaid = existingJob.expires_at && existingExpiresYear !== 2000;

                if (!isAlreadyPaid) {
                    // 결제되지 않은 광고라면 수동 지정을 무시하고 2000년 강제 고정
                    updatePayload.expires_at = '2000-01-01T00:00:00.000+09:00';
                } else if (payload.expires_at) {
                    // 이미 결제되어 게재 중인 광고의 관리자 수동 날짜 조절 허용
                    const rawDate = new Date(payload.expires_at);
                    const year = rawDate.getFullYear();
                    const month = String(rawDate.getMonth() + 1).padStart(2, '0');
                    const day = String(rawDate.getDate()).padStart(2, '0');
                    updatePayload.expires_at = `${year}-${month}-${day}T23:59:59.999+09:00`;
                } else {
                    updatePayload.expires_at = '2000-01-01T00:00:00.000+09:00';
                }
            }


            // 결제 연장인 경우 만료일 및 옵션 갱신
            if (isPaymentUpdate) {
                const p = payload.exposure_period as 30 | 60 | 90;
                const isAlreadyPaid = existingJob.expires_at && new Date(existingJob.expires_at).getFullYear() !== 2000 && new Date(existingJob.expires_at) > new Date();
                const isExtension = payload.is_extension === true;

                // 개별 옵션 만료일 계산 헬퍼 함수 (KST 헬퍼 사용)
                const getOptionExpiresAt = (period: 30 | 60 | 90, baseDate?: Date) => {
                    return getKSTExpiresAt(period, baseDate);
                };

                updatePayload.exposure_period = p;

                if (payload.is_subscription !== undefined) {
                    updatePayload.is_subscription = !!payload.is_subscription;
                }
                
                updatePayload.total_points = totalPoints;
                updatePayload.status = 'ACTIVE';

                // 연속 노출 옵션
                if (payload.option_double_slot !== undefined) {
                    updatePayload.option_double_slot = !!payload.option_double_slot;
                    if (updatePayload.option_double_slot) {
                        updatePayload.option_double_slot_expires_at = isAlreadyPaid && !isExtension
                            ? existingJob.expires_at
                            : getOptionExpiresAt(p);
                    }
                }
                
                // 고정 노출 옵션 (DB schema cache 에러 방지 임시 주석 처리)
                // TODO: Supabase SQL Editor에서 ALTER TABLE public.biz_ads ADD COLUMN IF NOT EXISTS is_fixed... 실행 후 재활성화 필요
                /*
                if (payload.option_fixed !== undefined) {
                    updatePayload.is_fixed = !!payload.option_fixed;
                    if (updatePayload.is_fixed && !existingJob.is_fixed) {
                        updatePayload.option_fixed_expires_at = isAlreadyPaid && !isExtension
                            ? existingJob.expires_at
                            : getOptionExpiresAt(p);
                    }
                }
                */

                // 테마 이펙트 옵션
                if (payload.option_highlight !== undefined) {
                    updatePayload.option_highlight = !!payload.option_highlight;
                    if (updatePayload.option_highlight && !existingJob.option_highlight) {
                        updatePayload.option_highlight_expires_at = isAlreadyPaid && !isExtension
                            ? existingJob.expires_at
                            : getOptionExpiresAt(p);
                    }
                }

                // 점프 옵션
                if (payload.option_jump !== undefined) {
                    updatePayload.option_jump = !!payload.option_jump;
                    updatePayload.jump_interval = updatePayload.option_jump ? 1 : 4;
                    updatePayload.last_jumped_at = new Date().toISOString();
                    updatePayload.last_exposed_at = new Date().toISOString();
                    if (updatePayload.option_jump) {
                        updatePayload.option_jump_expires_at = isAlreadyPaid && !isExtension
                            ? existingJob.expires_at
                            : getOptionExpiresAt(p);
                    }
                }



                // 만료일 설정 (KST 헬퍼를 이용해 결제 시점 기준으로 엄격하게 계산)
                if (isAlreadyPaid && !isExtension) {
                    // 1. 이미 결제되어 게재 중이며, 단순 옵션 추가 결제인 경우 -> 기존 만료일 유지
                    updatePayload.expires_at = existingJob.expires_at;
                } else if (isAlreadyPaid && isExtension) {
                    // 2. 이미 결제되어 게재 중이며, 기간 연장 결제인 경우 -> 기존 만료일 기준으로 KST 기간 더하기
                    updatePayload.expires_at = getKSTExpiresAt(p, new Date(existingJob.expires_at));
                } else {
                    // 3. 미결제/Draft 상태에서 신규 결제하는 경우 -> 결제하는 현재 시각 기준으로 KST 기간 더하기 (수동 설정 무시)
                    updatePayload.expires_at = getKSTExpiresAt(p);
                }
            }

            if (payload.option_jump !== undefined && !isPaymentUpdate) {
                updatePayload.option_jump = !!payload.option_jump;
                updatePayload.jump_interval = updatePayload.option_jump ? 1 : 4;
                updatePayload.last_jumped_at = new Date().toISOString();
                updatePayload.last_exposed_at = new Date().toISOString();
            }

            const { data, error } = await supabase
                .from('biz_ads')
                .update(updatePayload)
                .eq('id', jobId)
                .select()
                .single();

            if (error) throw error;
            await syncLinkedJob(data);
            try {
                const { revalidatePath } = await import('next/cache');
                revalidatePath('/', 'layout');
                revalidatePath('/jobs', 'page');
                revalidatePath('/biz/ads', 'page');
            } catch (e) {}
            return { success: true, message: '구인 공고가 수정되었습니다.', data };
        }

        if (actionType === 'DELETE') {
            if (!jobId) return { success: false, message: 'jobId가 필요합니다.' };

            // 연동된 구인글 먼저 삭제 (CASCADE 처리되어 있어 자동으로도 삭제되지만 안정성 보강)
            await supabase
                .from('jobs')
                .delete()
                .eq('linked_ad_id', jobId);

            const { data, error } = await supabase
                .from('biz_ads')
                .delete()
                .eq('id', jobId)
                .select()
                .single();

            if (error) throw error;
            try {
                const { revalidatePath } = await import('next/cache');
                revalidatePath('/', 'layout');
                revalidatePath('/jobs', 'page');
                revalidatePath('/biz/ads', 'page');
            } catch (e) {}
            return { success: true, message: '광고 및 연동된 구인글이 삭제되었습니다.', data };
        }

        return { success: false, message: '지원하지 않는 액션입니다.' };

    } catch (error: any) {
        console.error(`❌ [FA_BIZ_AD_CRUD_FLOW] ${actionType} 에러:`, error);
        return { success: false, message: error.message || '서버 오류가 발생했습니다.' };
    }
}

// 💡 광고와 구인글을 100% 실시간 연동/동기화하는 헬퍼 함수
async function syncLinkedJob(ad: any) {
    try {
        console.log(`🔗 [syncLinkedJob] 광고 ${ad.id}에 연동된 구인글 동기화 시작`);
        
        // 1. 이미 연동된 구인글이 있는지 확인
        const { data: existingJob } = await supabase
            .from('jobs')
            .select('id')
            .eq('linked_ad_id', ad.id)
            .maybeSingle();

        const jobPayload = {
            user_id: ad.user_id,
            linked_ad_id: ad.id,
            title: ad.title,
            company_name: ad.company_name,
            location: ad.location,
            address: ad.address,
            salary_type: ad.salary_type,
            salary_amount: ad.salary_amount,
            logo_url: ad.logo_url,
            image_url: ad.image_url,
            contact_name: ad.contact_name,
            contact_phone: ad.contact_phone,
            kakao_id: ad.kakao_id,
            line_id: ad.line_id,
            telegram_id: ad.telegram_id,
            wechat_id: ad.wechat_id,
            employment_type: ad.employment_type,
            category1: ad.category1,
            category2: ad.category2,
            work_time: ad.work_time,
            amenities: ad.amenities || [],
            keywords: ad.keywords || [],
            design_mode: ad.design_mode,
            content: ad.detail_content, // jobs.content 에 매핑
            detail_content: ad.detail_content,
            detail_bg_color: ad.detail_bg_color,
            detail_bg_image: ad.detail_bg_image,
            
            tier: ad.tier || 'GENERAL',
            status: ad.status || 'PAUSED',
            expires_at: ad.expires_at,
            exposure_period: ad.exposure_period || 30,
            is_subscription: ad.is_subscription,

            // 광고 옵션 효과들이 일반 구인글 카드에도 동일 연동되도록 매핑
            option_bold: ad.option_double_slot || false,
            option_jump: ad.option_jump || false,
            jump_interval: ad.jump_interval || 4,
            last_jumped_at: ad.last_jumped_at,
            last_exposed_at: ad.last_exposed_at,
            total_points: 0,
        };

        if (existingJob) {
            // 2. 존재하면 업데이트
            const { error: updateErr } = await supabase
                .from('jobs')
                .update({
                    ...jobPayload,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingJob.id);

            if (updateErr) throw updateErr;
            console.log(`🔗 [syncLinkedJob] 기존 연동 구인글 업데이트 완료 (Job ID: ${existingJob.id})`);
        } else {
            // 3. 존재하지 않으면 신규 생성
            const { data: newJob, error: insertErr } = await supabase
                .from('jobs')
                .insert([jobPayload])
                .select('id')
                .single();

            if (insertErr) throw insertErr;
            console.log(`🔗 [syncLinkedJob] 신규 연동 구인글 생성 완료 (Job ID: ${newJob.id})`);
        }
    } catch (err) {
        console.error(`❌ [syncLinkedJob] 구인글 연동 동기화 실패:`, err);
    }
}
