'use server';

import { OA_UPSERT_POLICY } from '@/src/atoms/oa/settings/OA_UPSERT_POLICY';
import { QA_GET_POLICY } from '@/src/atoms/qa/settings/QA_GET_POLICY';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function getPolicy(policyType: string) {
    const { data, error, success } = await QA_GET_POLICY(policyType);
    if (!success) {
        throw new Error(error || 'Failed to get policy');
    }
    return data;
}

export async function updatePolicy(policyType: string, title: string, content: string, isRequired: boolean = true) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        throw new Error('권한이 없습니다.');
    }

    const { data, error, success } = await OA_UPSERT_POLICY({
        policy_type: policyType,
        title,
        content,
        is_required: isRequired
    });

    if (!success) {
        throw new Error(error || 'Failed to update policy');
    }

    revalidatePath('/fox-office/settings/policies');
    return data;
}
