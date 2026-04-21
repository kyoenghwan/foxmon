import { supabase } from '@/lib/supabase';

/**
 * [OA_DELETE_COMMON_CODE]
 * 특정 id의 공통 코드를 물리 삭제합니다. 
 * (이미 데이터로 연결된 상태라면 soft delete(활성 해제)를 사용해야 하므로 주의)
 */
export async function OA_DELETE_COMMON_CODE(listType: string, codeValue: string) {
    try {
        const { error } = await supabase
            .from('common_codes')
            .delete()
            .eq('list_type', listType)
            .eq('code_value', codeValue);

        if (error) {
            console.error('OA_DELETE_COMMON_CODE error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
