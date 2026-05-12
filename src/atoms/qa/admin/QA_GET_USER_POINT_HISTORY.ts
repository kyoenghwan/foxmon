import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

export async function QA_GET_USER_POINT_HISTORY(userId: string) {
    try {
        const { data: transactions, error: txError } = await supabaseAdmin
            .from('point_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (txError) throw txError;

        const { data: recharges, error: rcError } = await supabaseAdmin
            .from('point_recharge_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (rcError) throw rcError;

        return { success: true, data: { transactions, recharges }, error: null };
    } catch (err: any) {
        nvLog('AT', '❌ QA_GET_USER_POINT_HISTORY 실패', err.message);
        return { success: false, data: null, error: err.message };
    }
}
