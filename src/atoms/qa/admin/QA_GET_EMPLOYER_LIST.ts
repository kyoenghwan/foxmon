import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

export interface EmployerListItem {
    id: string;
    login_id: string | null;
    nickname: string | null;
    email: string | null;
    role: string | null;
    business_registration_number: string | null;
    is_business_verified: boolean;
    is_cert_verified: boolean;
    verified_ceo_name: string | null;
    verified_business_name: string | null;
    business_cert_image_url: string | null;
    business_type: string | null;
    verification_doc_url: string | null;
    created_at: string;
    paid_points: number;
    bonus_points: number;
    admin_memo?: string | null;
    merchant_tier?: 'NORMAL' | 'VIP' | 'VVIP' | 'VVVIP' | null;
    jobs?: { id: string; status: string; expires_at: string | null; auto_renew: boolean; tier: string }[];
    biz_ads?: { id: string; status: string; expires_at: string | null; auto_renew: boolean; tier: string }[];
}

export async function QA_GET_EMPLOYER_LIST() {
    nvLog('AT', '▶️ QA_GET_EMPLOYER_LIST 시작');

    try {
        // role이 EMPLOYER인 모든 유저를 조회 (미인증 포함) 및 연관 광고/배너 정보 동시 조인 패치
        const { data, error } = await supabaseAdmin
            .from('users')
            .select(`
                id, login_id, nickname, email, role, business_registration_number, 
                is_business_verified, is_cert_verified, verified_ceo_name, 
                verified_business_name, business_cert_image_url, business_type, 
                verification_doc_url, created_at, paid_points, bonus_points, admin_memo,
                merchant_tier,
                jobs(id, status, expires_at, auto_renew, tier),
                biz_ads(id, status, expires_at, auto_renew, tier)
            `)
            .eq('role', 'EMPLOYER')
            .order('created_at', { ascending: false });

        if (error) {
            nvLog('AT', '❌ QA_GET_EMPLOYER_LIST 에러', error.message);
            return { success: false, data: [], error: error.message };
        }

        return { success: true, data: data as any[], error: null };
    } catch (err: any) {
        nvLog('AT', '❌ QA_GET_EMPLOYER_LIST 실패', err.message);
        return { success: false, data: [], error: err.message };
    }
}
