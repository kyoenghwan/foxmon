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
}

export async function QA_GET_EMPLOYER_LIST() {
    nvLog('AT', '▶️ QA_GET_EMPLOYER_LIST 시작');

    try {
        // 사업자번호가 있거나 등록증 이미지가 있는 유저(혹은 role이 EMPLOYER인 유저)를 모두 조회
        // 여기서는 사업자등록번호나 증명서가 존재하는 유저를 가져옵니다.
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('id, nickname, email, role, business_registration_number, is_business_verified, verified_ceo_name, verified_business_name, business_cert_image_url, created_at')
            .or('business_registration_number.not.is.null,business_cert_image_url.not.is.null')
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
