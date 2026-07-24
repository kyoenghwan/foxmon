'use server';

import { signIn, signOut, auth } from '@/auth';
import { AuthError } from 'next-auth';
import { cookies } from 'next/headers';
import { invalidateAdCache } from '@/lib/ad-service';
import { sendTelegramMessage } from '@/lib/telegram';

import { FA_MANAGE_RESUME_FLOW } from '@/src/atoms/fa/resume/FA_MANAGE_RESUME_FLOW';
import { ResumeData } from '@/src/atoms/oa/resume/OA_UPSERT_RESUME';
import { FA_USER_SETTINGS_FLOW, UserSettingsFlowInput } from '@/src/atoms/fa/auth/FA_USER_SETTINGS_FLOW';

export async function handleSignOut() {
    console.log('⚛️ [ATOM] handleSignOut 시작');
    try {
        const cookieStore = await cookies();
        cookieStore.delete('age_verified');
        console.log('✅ age_verified 쿠키 삭제 완료');
        
        // signOut internally throws a Redirect error in Next.js
        await signOut({ redirectTo: '/' });
    } catch (error) {
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error; // Let Next.js handle the redirect
        }
        console.error('❌ 로그아웃 중 에러 발생:', error);
        throw error;
    }
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

import { FA_MANAGE_SEEKER_AD_FLOW } from '@/src/atoms/fa/resume/FA_MANAGE_SEEKER_AD_FLOW';
import { SeekerAdInput } from '@/src/atoms/oa/resume/OA_UPSERT_SEEKER_AD';
import { QA_GET_PUBLIC_SEEKER_ADS } from '@/src/atoms/qa/resume/QA_GET_PUBLIC_SEEKER_ADS';

export async function manageResumeAction(
  actionType: 'GET' | 'SAVE' | 'GET_DEFAULTS' | 'DELETE' | 'TOGGLE_PUBLIC',
  resumeData?: ResumeData
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: '로그인이 필요합니다.' };
    }
    
    return FA_MANAGE_RESUME_FLOW(actionType, session.user.id, resumeData);
}

export async function manageSeekerAdAction(
  actionType: 'GET' | 'SAVE' | 'DELETE',
  adData?: Partial<SeekerAdInput>
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: '로그인이 필요합니다.' };
    }
    
    return FA_MANAGE_SEEKER_AD_FLOW(actionType, session.user.id, adData);
}

export async function getPublicSeekerAdsAction() {
    return QA_GET_PUBLIC_SEEKER_ADS();
}

import { QA_GET_SEEKER_AD_BY_ID } from '@/src/atoms/qa/resume/QA_GET_SEEKER_AD_BY_ID';

export async function getSeekerAdByIdAction(id: string) {
    return QA_GET_SEEKER_AD_BY_ID(id);
}

export async function userSettingsAction(actionType: UserSettingsFlowInput['actionType'], payloads?: any) {
    console.time('🕒 [userSettingsAction] auth() session fetch');
    const session = await auth();
    console.timeEnd('🕒 [userSettingsAction] auth() session fetch');
    if (!session?.user?.id) {
        return { success: false, message: '로그인이 필요합니다.', data: null };
    }

    const inputData: UserSettingsFlowInput = {
        actionType,
        userId: session.user.id,
        ...payloads,
    };

    return FA_USER_SETTINGS_FLOW(inputData);
}
import { FA_AD_CRUD_FLOW } from '@/src/atoms/fa/biz/FA_AD_CRUD_FLOW';
import { FA_BIZ_AD_CRUD_FLOW } from '@/src/atoms/fa/biz/FA_BIZ_AD_CRUD_FLOW';
import { AdFormData } from '@/components/biz/AdEditorForm';

export async function manageAdAction(
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'GET' | 'GET_ONE',
  payload?: Partial<AdFormData>,
  jobId?: string
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: '로그인이 필요합니다.' };
    }

    return FA_AD_CRUD_FLOW({
        actionType,
        userId: session.user.id,
        jobId,
        payload
    });
}

export async function manageBizAdAction(
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'GET' | 'GET_ONE',
  payload?: Partial<AdFormData>,
  jobId?: string
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: '로그인이 필요합니다.' };
    }

    const res = await FA_BIZ_AD_CRUD_FLOW({
        actionType,
        userId: session.user.id,
        jobId,
        payload
    });

    if (res.success && ['CREATE', 'UPDATE', 'DELETE'].includes(actionType)) {
        // 서버 메모리 캐시 즉시 무효화 (revalidatePath만으로는 커스텀 adCache를 비울 수 없음)
        invalidateAdCache();
        revalidatePath('/');
        revalidatePath('/jobs');
        revalidatePath('/biz/ads');
        revalidatePath('/biz/banners');
    }

    return res;
}

import { FA_ADMIN_EMPLOYER_FLOW, AdminEmployerFlowInput } from '@/src/atoms/fa/admin/FA_ADMIN_EMPLOYER_FLOW';

export async function adminEmployerAction(input: Omit<AdminEmployerFlowInput, 'adminId'>) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPER_ADMIN') {
        return { success: false, message: '관리자 권한이 없습니다.' };
    }

    return FA_ADMIN_EMPLOYER_FLOW({
        ...input,
        adminId: session.user.id
    });
}

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function requestPointRecharge(payload: { amount: number, depositor_name: string }) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: '로그인이 필요합니다.' };
    }

    try {
        const { error } = await supabaseAdmin
            .from('point_recharge_requests')
            .insert({
                user_id: session.user.id,
                amount: payload.amount,
                depositor_name: payload.depositor_name,
                status: 'PENDING'
            });

        if (error) {
            console.error('Insert error:', error);
            throw error;
        }

        // 텔레그램 실시간 알림 전송 (비동기 처리)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://foxmon.co.kr';
        const nickname = session?.user?.name || '익명 회원';
        const messageText = `
<b>🔔 [폭스몬] 새로운 무통장 입금 충전 신청이 접수되었습니다!</b>

• <b>신청회원</b>: ${nickname}
• <b>입금자명</b>: ${payload.depositor_name}
• <b>신청금액</b>: ${payload.amount.toLocaleString()} P
• <b>상태</b>: 승인 대기중 (PENDING)

👉 <a href="${appUrl}/cs">모바일 관리자 CS 페이지 바로가기</a>
`.trim();
        sendTelegramMessage(messageText).catch(e => console.error('Telegram notification error:', e));

        revalidatePath('/biz/points');
        return { success: true, message: '충전 신청이 완료되었습니다.' };
    } catch (e: any) {
        console.error('requestPointRecharge error:', e);
        return { success: false, message: e.message || '충전 신청 중 오류가 발생했습니다.' };
    }
}

import { SiteBannerInput, OA_UPSERT_SITE_BANNER } from '@/src/atoms/oa/admin/OA_UPSERT_SITE_BANNER';
import { OA_DELETE_SITE_BANNER } from '@/src/atoms/oa/admin/OA_DELETE_SITE_BANNER';

export async function adminSiteBannerAction(actionType: 'UPSERT' | 'DELETE', payload?: SiteBannerInput | string) {
    const session = await auth();
    if (!session?.user?.id || ((session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPER_ADMIN')) {
        return { success: false, message: '관리자 권한이 없습니다.' };
    }

    if (actionType === 'UPSERT') {
        const result = await OA_UPSERT_SITE_BANNER(payload as SiteBannerInput);
        revalidatePath('/fox-office/ads');
        return result;
    } else if (actionType === 'DELETE') {
        const result = await OA_DELETE_SITE_BANNER(payload as string);
        revalidatePath('/fox-office/ads');
        return result;
    }

    return { success: false, message: '잘못된 액션입니다.' };
}

import { OA_DELETE_COMMUNITY_POST } from '@/src/atoms/oa/admin/OA_DELETE_COMMUNITY_POST';

export async function adminCommunityAction(actionType: 'DELETE', payload: string) {
    const session = await auth();
    if (!session?.user?.id || ((session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPER_ADMIN')) {
        return { success: false, message: '관리자 권한이 없습니다.' };
    }

    if (actionType === 'DELETE') {
        const result = await OA_DELETE_COMMUNITY_POST(payload);
        revalidatePath('/fox-office/community');
        revalidatePath('/community'); // Update the main community page as well
        return result;
    }

    return { success: false, message: '잘못된 액션입니다.' };
}

import { QA_GET_JOB_BY_ID } from '@/src/atoms/qa/auth/QA_GET_JOB_BY_ID';

export async function getJobsByIdsAction(ids: string[]) {
    try {
        const results = await Promise.all(
            ids.map(async (id) => {
                const res = await QA_GET_JOB_BY_ID(id);
                return res.success ? res.data : null;
            })
        );
        return { success: true, data: results.filter(Boolean) };
    } catch (e: any) {
        return { success: false, message: e.message || '공고 데이터를 가져오는 데 실패했습니다.' };
    }
}

export async function claimBizAdByCodeAction(claimCode: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: '로그인이 필요합니다.' };
    }

    const code = claimCode?.trim()?.toUpperCase();
    if (!code) {
        return { success: false, message: '올바른 핀코드를 입력해주세요.' };
    }

    try {
        // 1. 해당 코드를 가진 광고 조회
        const { data: ad, error: selectError } = await supabaseAdmin
            .from('biz_ads')
            .select('id, company_name, title, user_id')
            .eq('claim_code', code)
            .maybeSingle();

        if (selectError) {
            console.error('Claim query error:', selectError);
            return { success: false, message: 'DB 조회 중 오류가 발생했습니다.' };
        }

        if (!ad) {
            return { success: false, message: '일치하는 광고가 없거나 이미 수령이 완료되었습니다.' };
        }

        // 2. 소유주 업데이트 및 핀코드 제거
        const { error: updateError } = await supabaseAdmin
            .from('biz_ads')
            .update({
                user_id: session.user.id,
                claim_code: null
            })
            .eq('id', ad.id);

        if (updateError) {
            console.error('Claim update error:', updateError);
            return { success: false, message: '소유권 양도 중 오류가 발생했습니다.' };
        }

        revalidatePath('/biz/ads');
        return { 
            success: true, 
            message: `[${ad.company_name || '업체'}] ${ad.title || '광고'}의 소유권이 성공적으로 이전되었습니다!` 
        };
    } catch (e: any) {
        console.error('claimBizAdByCodeAction error:', e);
        return { success: false, message: e.message || '서버 오류가 발생했습니다.' };
    }
}

export async function getActiveFixedAdCountAction() {
    try {
        const { count, error } = await supabaseAdmin
            .from('biz_ads')
            .select('*', { count: 'exact', head: true })
            .eq('tier', 'SIDE')
            .eq('status', 'ACTIVE')
            .eq('is_fixed', true);
            
        if (error) throw error;
        return { success: true, count: count || 0 };
    } catch (e: any) {
        console.error('getActiveFixedAdCountAction error:', e);
        return { success: false, count: 0 };
    }
}

import { QA_GET_ALL_USERS } from '@/src/atoms/qa/admin/QA_GET_ALL_USERS';
import { OA_ADMIN_GIVE_ACTIVITY_POINTS } from '@/src/atoms/oa/admin/OA_ADMIN_GIVE_ACTIVITY_POINTS';
import { QA_GET_ALL_POINT_HISTORY } from '@/src/atoms/qa/admin/QA_GET_ALL_POINT_HISTORY';

export async function adminUserAction(
    actionType: 'GET_LIST' | 'GIVE_ACTIVITY_POINTS' | 'GET_ACTIVITY_POINT_HISTORY' | 'GET_ALL_POINT_HISTORY',
    payloads?: any
) {
    const session = await auth();
    if (!session?.user?.id || ((session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPER_ADMIN')) {
        return { success: false, message: '관리자 권한이 없습니다.' };
    }

    switch (actionType) {
        case 'GET_LIST':
            return QA_GET_ALL_USERS();
        case 'GET_ALL_POINT_HISTORY':
            return QA_GET_ALL_POINT_HISTORY();
        case 'GIVE_ACTIVITY_POINTS': {
            if (!payloads?.targetUserId || payloads?.amountDiff === undefined || !payloads?.description) {
                return { success: false, message: '필수 파라미터 누락' };
            }
            return OA_ADMIN_GIVE_ACTIVITY_POINTS({
                userId: payloads.targetUserId,
                amountDiff: payloads.amountDiff,
                description: payloads.description,
                adminId: session.user.id
            });
        }
        case 'GET_ACTIVITY_POINT_HISTORY': {
            if (!payloads?.targetUserId) return { success: false, message: '유저 ID 누락' };
            try {
                const { data: list, error } = await supabaseAdmin
                    .from('activity_point_transactions')
                    .select('*')
                    .eq('user_id', payloads.targetUserId)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                return { success: true, data: { transactions: list || [] } };
            } catch (e: any) {
                return { success: false, message: e.message };
            }
        }
        default:
            return { success: false, message: '잘못된 액션입니다.' };
    }
}

import { FA_BIZ_VERIFY_FLOW } from '@/src/atoms/fa/biz/FA_BIZ_VERIFY_FLOW';

export async function verifyBusinessAction(bizNumber: string, ceoName?: string, businessName?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: '로그인이 필요합니다.' };
    }
    
    return FA_BIZ_VERIFY_FLOW({
        userId: session.user.id,
        bizNumber,
        ceoName,
        businessName
    });
}

