'use server';

import { createClient } from '@/utils/supabase/server';

export async function OA_INCREMENT_KEYWORD_COUNT(keyword: string): Promise<{
    success: boolean;
    error: string | null;
}> {
    try {
        const trimmed = keyword.trim();
        if (!trimmed) {
            return { success: false, error: '검색어가 비어 있습니다.' };
        }

        const supabase = await createClient();

        // 1. 기존 키워드가 존재하는지 확인
        const { data: existing, error: selectError } = await supabase
            .from('search_keywords')
            .select('clicks_count')
            .eq('keyword', trimmed)
            .maybeSingle();

        if (selectError) {
            // 테이블이 없거나 DB 에러인 경우 로그만 남기고 조용히 리턴 (폴백 대응)
            console.warn('OA_INCREMENT_KEYWORD_COUNT select error:', selectError.message);
            return { success: false, error: selectError.message };
        }

        if (existing) {
            // 2. 존재하면 clicks_count + 1로 업데이트
            const nextCount = Number(existing.clicks_count || 0) + 1;
            const { error: updateError } = await supabase
                .from('search_keywords')
                .update({
                    clicks_count: nextCount,
                    updated_at: new Date().toISOString()
                })
                .eq('keyword', trimmed);

            if (updateError) {
                console.error('OA_INCREMENT_KEYWORD_COUNT update error:', updateError.message);
                return { success: false, error: updateError.message };
            }
        } else {
            // 3. 존재하지 않으면 clicks_count = 1로 새로 추가
            const { error: insertError } = await supabase
                .from('search_keywords')
                .insert({
                    keyword: trimmed,
                    clicks_count: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (insertError) {
                console.error('OA_INCREMENT_KEYWORD_COUNT insert error:', insertError.message);
                return { success: false, error: insertError.message };
            }
        }

        return { success: true, error: null };
    } catch (e: any) {
        console.error('OA_INCREMENT_KEYWORD_COUNT 시스템 에러:', e.message);
        return { success: false, error: e.message };
    }
}
