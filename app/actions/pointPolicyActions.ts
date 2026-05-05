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

// 기본 유료 광고 설정값 (최초 삽입용 30/60/90일 개별 기준)
const DEFAULT_POLICIES = [
    { config_key: 'OPTION_PRICE_BASE_PERIOD_30', config_value: 70000 },
    { config_key: 'OPTION_PRICE_BASE_PERIOD_60', config_value: 125000 },
    { config_key: 'OPTION_PRICE_BASE_PERIOD_90', config_value: 170000 },
    
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
            nvLog('AT', `💡 누락된 정책 ${missingPolicies.length}개 기본값 삽입 시작`);
            const insertData = missingPolicies.map(p => ({
                ...p,
                start_at: new Date().toISOString(),
                end_at: '9999-12-31 23:59:59'
            }));
            
            const { data: insertedData, error: insertError } = await supabaseAdmin
                .from('point_policies')
                .insert(insertData)
                .select();
                
            if (insertError) {
                nvLog('AT', '❌ 초기값 삽입 에러', insertError.message);
                // DB오류(RLS 등)여도 기본값 합쳐서 리턴해서 UI 방어
                existingData = [...existingData, ...insertData];
            } else if (insertedData) {
                existingData = [...existingData, ...insertedData];
            }
        }

        return { success: true, data: existingData as PointPolicyItem[] };
    } catch (err: any) {
        nvLog('AT', '❌ GET_POINT_POLICIES 예외', err.message);
        return { success: false, data: [] };
    }
}

export async function UPDATE_POINT_POLICIES(policies: { config_key: string, config_value: number }[]) {
    nvLog('AT', '▶️ UPDATE_POINT_POLICIES 시작');
    try {
        // 기존 데이터를 전부 읽어와서 비교 후 업데이트 (간단히 루프 돌림)
        for (const policy of policies) {
            const { error } = await supabaseAdmin
                .from('point_policies')
                .upsert({
                    config_key: policy.config_key,
                    config_value: policy.config_value,
                    start_at: new Date().toISOString(),
                    end_at: '9999-12-31 23:59:59'
                }, { onConflict: 'config_key' });
                
            if (error) {
                nvLog('AT', `❌ 업데이트 에러 (${policy.config_key})`, error.message);
                return { success: false, error: error.message };
            }
        }
        return { success: true };
    } catch (err: any) {
        nvLog('AT', '❌ UPDATE_POINT_POLICIES 예외', err.message);
        return { success: false, error: err.message };
    }
}
