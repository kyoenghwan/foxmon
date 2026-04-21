import { supabase } from '@/lib/supabase';

export interface CodeItem {
    list_type: string;
    code_value: string;
    code_name: string;
    sort_order: number;
    is_active: boolean;
    description: string | null;
}

/**
 * [QA_GET_COMMON_CODES]
 * 특정 list_type에 속하는 공통 코드를 정렬하여 반환합니다.
 * @param listType 대상 리스트별 타입 지정. (전체 조회 시 undefined/null)
 * @param activeOnly true일 경우 is_active가 true인 건만 조회 (기본값 true)
 */
export async function QA_GET_COMMON_CODES(listType?: string, activeOnly: boolean = true) {
    try {
        let query = supabase.from('common_codes').select('*');
        if (listType) {
            query = query.eq('list_type', listType);
        }
        if (activeOnly) {
            query = query.eq('is_active', true);
        }
        
        query = query.order('list_type', { ascending: true })
                     .order('sort_order', { ascending: true })
                     .order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) {
            console.error('QA_GET_COMMON_CODES error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data as CodeItem[] };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
