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

// 기본 유료 광고 설정값 (최초 삽입용 30일 기준)
const DEFAULT_POLICIES = [
    { config_key: 'OPTION_PRICE_BASE_PERIOD', config_value: 70000 },
    { config_key: 'OPTION_PRICE_BOLD', config_value: 30000 },
    { config_key: 'OPTION_PRICE_COLOR', config_value: 15000 },
    { config_key: 'OPTION_PRICE_BG', config_value: 15000 },
    { config_key: 'OPTION_PRICE_HIGHLIGHT', config_value: 15000 },
    { config_key: 'OPTION_PRICE_ICON', config_value: 15000 },
    { config_key: 'OPTION_PRICE_GENERAL_ICONS', config_value: 10000 },
    { config_key: 'OPTION_PRICE_JUMP', config_value: 30000 },
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

        // DB가 비어있다면, 초기 설정을 넣고 반환한다.
        if (!data || data.length === 0) {
            nvLog('AT', '💡 point_policies 비어있음 - 기본값 삽입 시작');
            const insertData = DEFAULT_POLICIES.map(p => ({
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
                return { success: true, data: insertData }; // DB오류여도 기본값 리턴해서 UI 방어
            }
            return { success: true, data: insertedData as PointPolicyItem[] };
        }

        return { success: true, data: data as PointPolicyItem[] };
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
            }
        }
        return { success: true };
    } catch (err: any) {
        nvLog('AT', '❌ UPDATE_POINT_POLICIES 예외', err.message);
        return { success: false, error: err.message };
    }
}
