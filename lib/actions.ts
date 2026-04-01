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

