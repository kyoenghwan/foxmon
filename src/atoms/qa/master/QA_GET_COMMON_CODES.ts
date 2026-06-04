'use server';

import { supabaseAdmin as supabase } from '@/lib/supabase';

export interface CodeItem {
    list_type: string;
    code_value: string;
    parent_code_value?: string | null;
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
import { unstable_noStore as noStore } from 'next/cache';

// 서버 인메모리 캐싱 변수
let cachedCommonCodes: CodeItem[] | null = null;
let lastFetchedTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60초 캐시 유지

export async function QA_GET_COMMON_CODES(listType?: string, activeOnly: boolean = true) {
    noStore();
    const now = Date.now();
    try {
        let allCodes: CodeItem[];

        // 캐시 유효 시 DB 쿼리 생략
        if (cachedCommonCodes && (now - lastFetchedTime < CACHE_TTL_MS)) {
            allCodes = cachedCommonCodes;
        } else {
            // 모든 활성 마스터 코드를 한 번에 가져옴
            let query = supabase.from('common_codes').select('*');
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
            allCodes = data as CodeItem[];
            cachedCommonCodes = allCodes;
            lastFetchedTime = now;
        }

        // 특정 list_type 필터링은 메모리에서 처리
        let filteredData = allCodes;
        if (listType) {
            filteredData = allCodes.filter(c => c.list_type === listType);
        }

        return { success: true, data: filteredData };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
