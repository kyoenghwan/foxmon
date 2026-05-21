'use server';

import { OA_INCREMENT_KEYWORD_COUNT } from '@/src/atoms/oa/search/OA_INCREMENT_KEYWORD_COUNT';
import { nvLog } from '@/lib/logger';

export async function FA_RECORD_SEARCH_KEYWORD_FLOW(keyword: string): Promise<{
    success: boolean;
    error: string | null;
}> {
    nvLog('AT', '▶️ FA_RECORD_SEARCH_KEYWORD_FLOW 시작', { keyword });

    try {
        const trimmed = keyword.trim();
        if (!trimmed) {
            return { success: false, error: '검색어가 비어 있습니다.' };
        }

        // 키워드 최대 길이 제한 검증 (예: 50자 이하)
        if (trimmed.length > 50) {
            return { success: false, error: '검색어는 최대 50자까지 입력 가능합니다.' };
        }

        // OA_INCREMENT_KEYWORD_COUNT 호출
        const result = await OA_INCREMENT_KEYWORD_COUNT(trimmed);
        
        if (!result.success) {
            nvLog('AT', '⚠️ FA_RECORD_SEARCH_KEYWORD_FLOW: OA 호출 실패', result.error);
            return { success: false, error: result.error };
        }

        nvLog('AT', '✅ FA_RECORD_SEARCH_KEYWORD_FLOW 완료', { keyword: trimmed });
        return { success: true, error: null };
    } catch (e: any) {
        nvLog('AT', '❌ FA_RECORD_SEARCH_KEYWORD_FLOW 시스템 에러', e.message);
        return { success: false, error: e.message };
    }
}
