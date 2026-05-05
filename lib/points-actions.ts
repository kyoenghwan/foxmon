'use server';

import { auth } from '@/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function requestPointRecharge(payload: { amount: number, depositor_name: string }) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: '로그인이 필요합니다.' };
    }

    try {
        const { error } = await supabase
            .from('point_recharge_requests')
            .insert({
                user_id: session.user.id,
                amount: payload.amount,
                depositor_name: payload.depositor_name,
                status: 'PENDING'
            });

        if (error) {
            // 테이블이 아직 없거나 다른 에러일 경우를 위해 임시 처리 (테이블 없으면 에러남)
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
