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
        // 1. 전체 유저를 조회 (안전한 분할 쿼리를 위해 우선 전체 users 패치)
        const { data: users, error: userError } = await supabaseAdmin
            .from('users')
            .select(`
                id, login_id, nickname, email, role, business_registration_number, 
                is_business_verified, is_cert_verified, verified_ceo_name, 
                verified_business_name, business_cert_image_url, business_type, 
                verification_doc_url, created_at, paid_points, bonus_points, admin_memo,
                merchant_tier
            `)
            .order('created_at', { ascending: false });

        if (userError) {
            nvLog('AT', '❌ QA_GET_EMPLOYER_LIST 유저 조회 에러', userError.message);
            return { success: false, data: [], error: userError.message };
        }

        // 1.5. 30일 무등록 회원 등급 자동 강등 체크 (비동기 일괄 진단)
        const { applyTierDowngradeCheck } = await import('@/lib/tierDowngradeService');
        const downgradePromises = (users || [])
            .filter(u => u.merchant_tier && u.merchant_tier !== 'NORMAL')
            .map(async (u) => {
                const res = await applyTierDowngradeCheck(u.id);
                if (res.downgraded && res.nextTier) {
                    u.merchant_tier = res.nextTier;
                    const sysMemo = `[시스템] 30일 무등록 자동 강등 (${new Date().toISOString().slice(0, 10)})`;
                    u.admin_memo = u.admin_memo 
                        ? `${u.admin_memo.trim()}\n${sysMemo}`
                        : sysMemo;
                }
            });
        await Promise.all(downgradePromises);

        const allUsers: EmployerListItem[] = (users || []).map(u => ({
            ...u,
            jobs: [],
            biz_ads: []
        }));

        if (allUsers.length === 0) {
            return { success: true, data: [], error: null };
        }

        // 2. jobs 정보 전체 조회 (PostgreSQL UUID 타입 캐스팅 버그 우회를 위해 전체 조회 후 JS 단 매핑)
        const { data: jobsData, error: jobsError } = await supabaseAdmin
            .from('jobs')
            .select('id, user_id, status, expires_at, auto_renew, tier');

        if (jobsError) {
            nvLog('AT', '⚠️ QA_GET_EMPLOYER_LIST jobs 조회 에러', jobsError.message);
        } else if (jobsData) {
            jobsData.forEach(job => {
                const emp = allUsers.find(u => u.id === job.user_id);
                if (emp) {
                    if (!emp.jobs) emp.jobs = [];
                    emp.jobs.push({
                        id: job.id,
                        status: job.status,
                        expires_at: job.expires_at,
                        auto_renew: !!job.auto_renew,
                        tier: job.tier
                    });
                }
            });
        }

        // 3. biz_ads 정보 전체 조회 (PostgreSQL UUID 타입 캐스팅 버그 우회를 위해 전체 조회 후 JS 단 매핑)
        const { data: adsData, error: adsError } = await supabaseAdmin
            .from('biz_ads')
            .select('id, user_id, status, expires_at, option_subscription, tier');

        if (adsError) {
            nvLog('AT', '⚠️ QA_GET_EMPLOYER_LIST biz_ads 조회 에러', adsError.message);
        } else if (adsData) {
            adsData.forEach(ad => {
                const emp = allUsers.find(u => u.id === ad.user_id);
                if (emp) {
                    if (!emp.biz_ads) emp.biz_ads = [];
                    emp.biz_ads.push({
                        id: ad.id,
                        status: ad.status,
                        expires_at: ad.expires_at,
                        auto_renew: !!(ad as any).option_subscription || !!(ad as any).auto_renew,
                        tier: ad.tier
                    });
                }
            });
        }

        // 4. 업체 성격을 띤 유저만 필터링 (EMPLOYER 권한이거나, 상호명이 기재되었거나, 등록한 광고/공고가 있는 유저)
        const filteredEmployers = allUsers.filter(user => {
            const isEmployerRole = user.role === 'EMPLOYER';
            const hasBusinessName = !!user.verified_business_name && user.verified_business_name.trim() !== '';
            const hasRegistrationNo = !!user.business_registration_number && user.business_registration_number.trim() !== '';
            const hasActiveJobs = (user.jobs?.length ?? 0) > 0;
            const hasActiveAds = (user.biz_ads?.length ?? 0) > 0;

            return isEmployerRole || hasBusinessName || hasRegistrationNo || hasActiveJobs || hasActiveAds;
        });

        nvLog('AT', `▶️ QA_GET_EMPLOYER_LIST 필터 결과: 전체 ${allUsers.length}명 중 ${filteredEmployers.length}명 선별 완료`);
        return { success: true, data: filteredEmployers, error: null };
    } catch (err: any) {
        nvLog('AT', '❌ QA_GET_EMPLOYER_LIST 실패', err.message);
        return { success: false, data: [], error: err.message };
    }
}
