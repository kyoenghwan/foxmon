'use server';

import { signIn, signOut, auth } from '@/auth';
import { AuthError } from 'next-auth';
import { cookies } from 'next/headers';

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
    const session = await auth();
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

    return FA_BIZ_AD_CRUD_FLOW({
        actionType,
        userId: session.user.id,
        jobId,
        payload
    });
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

