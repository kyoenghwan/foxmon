import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

export interface SiteBannerInput {
    id?: string;
    title: string;
    type: 'POPUP' | 'MAIN_BANNER';
    image_url: string;
    link_url?: string;
    is_active: boolean;
    start_date?: string | null;
    end_date?: string | null;
}

export async function OA_UPSERT_SITE_BANNER(input: SiteBannerInput) {
    nvLog('AT', '▶️ OA_UPSERT_SITE_BANNER 시작', { title: input.title, type: input.type });

    try {
        const payload: any = {
            title: input.title,
            type: input.type,
            image_url: input.image_url,
            link_url: input.link_url || null,
            is_active: input.is_active,
            start_date: input.start_date || null,
            end_date: input.end_date || null,
            updated_at: new Date().toISOString()
        };

        let result;
        if (input.id) {
            result = await supabaseAdmin
                .from('site_banners')
                .update(payload)
                .eq('id', input.id)
                .select()
                .single();
        } else {
            result = await supabaseAdmin
                .from('site_banners')
                .insert([payload])
                .select()
                .single();
        }

        const { data, error } = result;

        if (error) {
            nvLog('AT', '❌ OA_UPSERT_SITE_BANNER 에러', error.message);
            return { success: false, data: null, error: error.message };
        }

        nvLog('AT', '✅ OA_UPSERT_SITE_BANNER 성공');
        return { success: true, data, error: null };
    } catch (err: any) {
        nvLog('AT', '❌ OA_UPSERT_SITE_BANNER 시스템 에러', err.message);
        return { success: false, data: null, error: err.message };
    }
}
