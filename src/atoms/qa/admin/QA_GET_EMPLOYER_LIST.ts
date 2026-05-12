import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

export interface EmployerListItem {
    id: string;
    nickname: string | null;
    email: string | null;
    role: string | null;
    business_registration_number: string | null;
    is_business_verified: boolean;
    verified_ceo_name: string | null;
    verified_business_name: string | null;
    business_cert_image_url: string | null;
    created_at: string;
    paid_points: number;
    bonus_points: number;
    admin_memo?: string | null;
}

export async function QA_GET_EMPLOYER_LIST() {
    nvLog('AT', '▶️ QA_GET_EMPLOYER_LIST 시작');

    try {
        // role이 EMPLOYER인 모든 유저를 조회 (미인증 포함)
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('id, nickname, email, role, business_registration_number, is_business_verified, verified_ceo_name, verified_business_name, business_cert_image_url, created_at, paid_points, bonus_points, admin_memo')
            .eq('role', 'EMPLOYER')
            .order('created_at', { ascending: false });

        if (error) {
            nvLog('AT', '❌ QA_GET_EMPLOYER_LIST 에러', error.message);
            // Return mock if table structure is not fully synced
            return { success: false, data: [], error: error.message };
        }

        return { success: true, data: data as EmployerListItem[], error: null };
    } catch (err: any) {
        nvLog('AT', '❌ QA_GET_EMPLOYER_LIST 실패', err.message);
        return { success: false, data: [], error: err.message };
    }
}
