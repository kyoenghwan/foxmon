import { createClient } from '@/utils/supabase/server';

export async function QA_GET_ACTIVE_BANNERS(type: 'POPUP' | 'MAIN_BANNER' = 'POPUP') {
    try {
        const supabase = await createClient();
        const now = new Date().toISOString();

        // 1. is_active = true
        // 2. type = type
        // 3. start_date가 null이거나 현재보다 과거
        // 4. end_date가 null이거나 현재보다 미래
        const { data, error } = await supabase
            .from('site_banners')
            .select('*')
            .eq('type', type)
            .eq('is_active', true)
            .or(`start_date.is.null,start_date.lte.${now}`)
            .or(`end_date.is.null,end_date.gte.${now}`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('QA_GET_ACTIVE_BANNERS 에러:', error.message);
            return [];
        }

        return data || [];
    } catch (e: any) {
        console.error('QA_GET_ACTIVE_BANNERS 시스템 에러:', e.message);
        return [];
    }
}
