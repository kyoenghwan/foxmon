'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';

export interface PointPolicyItem {
    id?: string;
    config_key: string;
    config_value: number;
    start_at?: string;
    end_at?: string;
    is_override?: boolean;
}

// 기본 유료 광고 설정값 (최초 삽입용 30/60/90일 개별 기준 및 등급별 기본료)
const DEFAULT_POLICIES = [
    // 광고 등급(Tier) 단일 기본료 (레거시, 필요시 유지)
    { config_key: 'TIER_PRICE_PREMIUM_MAIN', config_value: 800000 },
    { config_key: 'TIER_PRICE_SIDE', config_value: 500000 },
    { config_key: 'TIER_PRICE_PREMIUM', config_value: 300000 },
    { config_key: 'TIER_PRICE_SPECIAL', config_value: 200000 },
    { config_key: 'TIER_PRICE_GENERAL', config_value: 100000 },
    
    // 기간별 패키지 요금 (구인 공고용)
    { config_key: 'OPTION_PRICE_BASE_PERIOD_30', config_value: 70000 },
    { config_key: 'OPTION_PRICE_BASE_PERIOD_60', config_value: 125000 },
    { config_key: 'OPTION_PRICE_BASE_PERIOD_90', config_value: 170000 },

    // 광고(배너) 등급별 기간 패키지 요금 (30일 원가 기준 60일 10%할인, 90일 20%할인)
    { config_key: 'TIER_PRICE_PREMIUM_30', config_value: 300000 },
    { config_key: 'TIER_PRICE_PREMIUM_60', config_value: 540000 },
    { config_key: 'TIER_PRICE_PREMIUM_90', config_value: 720000 },
    
    { config_key: 'TIER_PRICE_SIDE_30', config_value: 200000 },
    { config_key: 'TIER_PRICE_SIDE_60', config_value: 360000 },
    { config_key: 'TIER_PRICE_SIDE_90', config_value: 480000 },
    
    { config_key: 'TIER_PRICE_SPECIAL_30', config_value: 150000 },
    { config_key: 'TIER_PRICE_SPECIAL_60', config_value: 270000 },
    { config_key: 'TIER_PRICE_SPECIAL_90', config_value: 360000 },
    
    { config_key: 'TIER_PRICE_GENERAL_30', config_value: 50000 },
    { config_key: 'TIER_PRICE_GENERAL_60', config_value: 90000 },
    { config_key: 'TIER_PRICE_GENERAL_90', config_value: 120000 },

    { config_key: 'TIER_PRICE_AD_GENERAL_30', config_value: 30000 },
    { config_key: 'TIER_PRICE_AD_GENERAL_60', config_value: 54000 },
    { config_key: 'TIER_PRICE_AD_GENERAL_90', config_value: 72000 },
    
    { config_key: 'OPTION_PRICE_BOLD_30', config_value: 30000 },
    { config_key: 'OPTION_PRICE_BOLD_60', config_value: 55000 },
    { config_key: 'OPTION_PRICE_BOLD_90', config_value: 70000 },
    
    { config_key: 'OPTION_PRICE_COLOR_30', config_value: 15000 },
    { config_key: 'OPTION_PRICE_COLOR_60', config_value: 25000 },
    { config_key: 'OPTION_PRICE_COLOR_90', config_value: 35000 },
    
    { config_key: 'OPTION_PRICE_BG_30', config_value: 15000 },
    { config_key: 'OPTION_PRICE_BG_60', config_value: 25000 },
    { config_key: 'OPTION_PRICE_BG_90', config_value: 35000 },
    
    { config_key: 'OPTION_PRICE_HIGHLIGHT_30', config_value: 15000 },
    { config_key: 'OPTION_PRICE_HIGHLIGHT_60', config_value: 25000 },
    { config_key: 'OPTION_PRICE_HIGHLIGHT_90', config_value: 35000 },
    
    { config_key: 'OPTION_PRICE_ICON_30', config_value: 15000 },
    { config_key: 'OPTION_PRICE_ICON_60', config_value: 25000 },
    { config_key: 'OPTION_PRICE_ICON_90', config_value: 35000 },
    
    { config_key: 'OPTION_PRICE_GENERAL_ICONS_30', config_value: 10000 },
    { config_key: 'OPTION_PRICE_GENERAL_ICONS_60', config_value: 18000 },
    { config_key: 'OPTION_PRICE_GENERAL_ICONS_90', config_value: 25000 },
    
    { config_key: 'OPTION_PRICE_JUMP_30', config_value: 30000 },
    { config_key: 'OPTION_PRICE_JUMP_60', config_value: 55000 },
    { config_key: 'OPTION_PRICE_JUMP_90', config_value: 70000 },
    
    { config_key: 'OPTION_PRICE_BIZ_JUMP_30', config_value: 30000 },
    { config_key: 'OPTION_PRICE_BIZ_JUMP_60', config_value: 55000 },
    { config_key: 'OPTION_PRICE_BIZ_JUMP_90', config_value: 70000 },

    // 프리미엄 메인 배너 기간별 요금
    { config_key: 'TIER_PRICE_PREMIUM_MAIN_30', config_value: 800000 },
    { config_key: 'TIER_PRICE_PREMIUM_MAIN_60', config_value: 1440000 },
    { config_key: 'TIER_PRICE_PREMIUM_MAIN_90', config_value: 1920000 },

    // 사이드 고정 노출 (Fix Slot) 기간별 요금 (기본 3배 적용)
    { config_key: 'OPTION_PRICE_SIDE_FIXED_30', config_value: 600000 },
    { config_key: 'OPTION_PRICE_SIDE_FIXED_60', config_value: 1080000 },
    { config_key: 'OPTION_PRICE_SIDE_FIXED_90', config_value: 1440000 },

    // 비즈니스용 스페셜 테마 이펙트 요금
    { config_key: 'OPTION_PRICE_BIZ_THEME_EFFECT_30', config_value: 30000 },
    { config_key: 'OPTION_PRICE_BIZ_THEME_EFFECT_60', config_value: 55000 },
    { config_key: 'OPTION_PRICE_BIZ_THEME_EFFECT_90', config_value: 70000 },

    // 배너 더블 슬롯 할인율 (%)
    { config_key: 'DISCOUNT_RATIO_BIZ_DOUBLE_SLOT', config_value: 5 },

    // 배너 최대 구좌 개수 제한
    { config_key: 'LIMIT_PREMIUM_MAIN_SLOTS', config_value: 10 },
    { config_key: 'LIMIT_SIDE_SLOTS', config_value: 15 },
    { config_key: 'LIMIT_SIDE_FIXED_SLOTS', config_value: 4 },

    // 유저 활동 보너스 포인트 정책
    { config_key: 'ACTIVITY_REFERRAL_SIGNUP', config_value: 500 },
    { config_key: 'ACTIVITY_REFERRAL_BONUS', config_value: 1000 },
    { config_key: 'ACTIVITY_POST_WRITE', config_value: 100 },
    { config_key: 'ACTIVITY_COMMENT_WRITE', config_value: 30 },
];

export async function GET_POINT_POLICIES() {
    nvLog('AT', '▶️ GET_POINT_POLICIES 시작');
    try {
        const { data, error } = await supabaseAdmin
            .from('point_policies')
            .select('*')
            .order('config_key', { ascending: true });

        if (error) {
            nvLog('AT', '❌ GET_POINT_POLICIES 에러', error.message);
            return { success: false, data: [] };
        }

        // 기존 데이터와 기본 설정값을 비교하여 누락된 옵션이 있는지 확인합니다.
        let existingData = data || [];
        const missingPolicies = DEFAULT_POLICIES.filter(dp => !existingData.some(ed => ed.config_key === dp.config_key));

        if (missingPolicies.length > 0) {
            nvLog('AT', `💡 누락된 정책 ${missingPolicies.length}개 기본값 삽입 시작 (RLS 우회)`);
            try {
                const insertRows = missingPolicies.map(p => {
                    const val = p.config_value;
                    const key = p.config_key.replace(/[^a-zA-Z0-9_]/g, '');
                    const startAt = new Date().toISOString();
                    const endAt = '9999-12-31 23:59:59';
                    return `('${key}', ${val}, '${startAt}', '${endAt}')`;
                }).join(',\n');
                
                const sql = `INSERT INTO point_policies (config_key, config_value, start_at, end_at) VALUES \n${insertRows};`;
                const { error: rpcError } = await supabaseAdmin.rpc('execute_sql', { sql });
                
                if (rpcError) {
                    nvLog('AT', '❌ 초기값 삽입 RPC 에러', rpcError.message);
                    const insertData = missingPolicies.map(p => ({
                        ...p,
                        start_at: new Date().toISOString(),
                        end_at: '9999-12-31 23:59:59'
                    }));
                    existingData = [...existingData, ...insertData];
                } else {
                    const { data: reData } = await supabaseAdmin
                        .from('point_policies')
                        .select('*')
                        .order('config_key', { ascending: true });
                    if (reData) existingData = reData;
                }
            } catch (rpcEx: any) {
                nvLog('AT', '❌ 초기값 삽입 RPC 예외', rpcEx.message);
                const insertData = missingPolicies.map(p => ({
                    ...p,
                    start_at: new Date().toISOString(),
                    end_at: '9999-12-31 23:59:59'
                }));
                existingData = [...existingData, ...insertData];
            }
        }

        return { success: true, data: existingData as PointPolicyItem[] };
    } catch (err: any) {
        nvLog('AT', '❌ GET_POINT_POLICIES 예외', err.message);
        return { success: false, data: [] };
    }
}

export async function UPDATE_POINT_POLICIES(policies: PointPolicyItem[]) {
    nvLog('AT', '▶️ UPDATE_POINT_POLICIES 시작 (RLS 우회 RPC 사용)');
    try {
        if (!policies || policies.length === 0) {
            return { success: true };
        }

        const keysToDelete = policies.map(p => `'${p.config_key.replace(/[^a-zA-Z0-9_]/g, '')}'`).join(', ');
        let safeSql = `DELETE FROM point_policies WHERE config_key IN (${keysToDelete});\n`;
        
        const insertRows = policies.map(p => {
            const val = typeof p.config_value === 'number' ? p.config_value : parseInt(p.config_value as any) || 0;
            const key = p.config_key.replace(/[^a-zA-Z0-9_]/g, '');
            const startAt = p.start_at || new Date().toISOString();
            const endAt = p.end_at || '9999-12-31 23:59:59';
            return `('${key}', ${val}, '${startAt}', '${endAt}')`;
        }).join(',\n');
        
        safeSql += `INSERT INTO point_policies (config_key, config_value, start_at, end_at) VALUES \n${insertRows};`;

        const { error } = await supabaseAdmin.rpc('execute_sql', { sql: safeSql });
        
        if (error) {
            nvLog('AT', '❌ UPDATE_POINT_POLICIES RPC 에러', error.message);
            return { success: false, error: error.message };
        }
        
        nvLog('AT', '✅ UPDATE_POINT_POLICIES 완료');
        return { success: true };
    } catch (err: any) {
        nvLog('AT', '❌ UPDATE_POINT_POLICIES 예외', err.message);
        return { success: false, error: err.message };
    }
}
