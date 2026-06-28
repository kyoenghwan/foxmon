import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

export interface ToggleBusinessVerifyInput {
    userId: string;
    isVerified: boolean;
}

export async function OA_TOGGLE_BUSINESS_VERIFY({ userId, isVerified }: ToggleBusinessVerifyInput) {
    nvLog('AT', `▶️ OA_TOGGLE_BUSINESS_VERIFY 시작`, { userId, isVerified });

    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .update({ is_cert_verified: isVerified })
            .eq('id', userId)
            .select('id, is_cert_verified');

        if (error) {
            nvLog('AT', '❌ OA_TOGGLE_BUSINESS_VERIFY 에러', error.message);
            return { success: false, data: null, error: error.message };
        }

        nvLog('AT', '✅ OA_TOGGLE_BUSINESS_VERIFY 성공');
        return { success: true, data, error: null };
    } catch (err: any) {
        nvLog('AT', '❌ OA_TOGGLE_BUSINESS_VERIFY 시스템 에러', err.message);
        return { success: false, data: null, error: err.message };
    }
}
