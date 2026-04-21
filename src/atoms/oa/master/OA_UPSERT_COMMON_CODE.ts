'use server';

import { supabaseAdmin as supabase } from '@/lib/supabase';

export interface UpsertCodeParams {
    list_type: string;
    code_value: string;
    parent_code_value?: string | null;
    code_name: string;
    sort_order?: number;
    is_active?: boolean;
    description?: string;
}

/**
 * [OA_UPSERT_COMMON_CODE]
 * 신규 공통 코드를 추가하거나, id가 있을 경우 기존 코드를 수정합니다.
 */
export async function OA_UPSERT_COMMON_CODE(params: UpsertCodeParams) {
    try {
        const payload: any = {
            list_type: params.list_type,
            code_value: params.code_value,
            code_name: params.code_name,
            updated_at: new Date().toISOString(),
        };

        if (params.sort_order !== undefined) payload.sort_order = params.sort_order;
        if (params.is_active !== undefined) payload.is_active = params.is_active;
        if (params.description !== undefined) payload.description = params.description;
        if (params.parent_code_value !== undefined) payload.parent_code_value = params.parent_code_value;

        const { data, error } = await supabase
            .from('common_codes')
            .upsert(payload, { onConflict: 'list_type,code_value' })
            .select()
            .single();

        if (error) {
            console.error('OA_UPSERT_COMMON_CODE error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
