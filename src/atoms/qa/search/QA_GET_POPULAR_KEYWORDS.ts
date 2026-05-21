'use server';

import { createClient } from '@/utils/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';
import type { SearchKeyword } from '@/src/atoms/da/search/DA_SEARCH_KEYWORD_TYPES';
import { DEFAULT_POPULAR_KEYWORDS } from '@/src/atoms/da/search/DA_SEARCH_KEYWORD_TYPES';

export async function QA_GET_POPULAR_KEYWORDS(): Promise<{
    success: boolean;
    data: SearchKeyword[];
    error: string | null;
}> {
    noStore();
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('search_keywords')
            .select('*')
            .order('clicks_count', { ascending: false })
            .limit(10);

        if (error) {
            console.warn('QA_GET_POPULAR_KEYWORDS error (using fallback):', error.message);
            const fallbackData: SearchKeyword[] = DEFAULT_POPULAR_KEYWORDS.map((keyword, index) => ({
                keyword,
                clicks_count: 1000 - index * 50,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }));
            return { success: true, data: fallbackData, error: error.message };
        }

        if (!data || data.length === 0) {
            const fallbackData: SearchKeyword[] = DEFAULT_POPULAR_KEYWORDS.map((keyword, index) => ({
                keyword,
                clicks_count: 1000 - index * 50,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }));
            return { success: true, data: fallbackData, error: null };
        }

        return { success: true, data: data as SearchKeyword[], error: null };
    } catch (e: any) {
        console.warn('QA_GET_POPULAR_KEYWORDS catch error (using fallback):', e.message);
        const fallbackData: SearchKeyword[] = DEFAULT_POPULAR_KEYWORDS.map((keyword, index) => ({
            keyword,
            clicks_count: 1000 - index * 50,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }));
        return { success: true, data: fallbackData, error: e.message };
    }
}
