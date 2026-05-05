'use server';
import { auth } from '@/auth';

export async function getUserPointsAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: '로그인이 필요합니다.' };
        }
        const { QA_GET_DEDUCTION_CONTEXT } = await import('@/src/atoms/qa/points/QA_GET_DEDUCTION_CONTEXT');
        const res = await QA_GET_DEDUCTION_CONTEXT(session.user.id);
        if (res.success && res.data) {
            return { success: true, points: res.data.bonusPoints + res.data.paidPoints };
        }
        return { success: false, message: res.error || '포인트 조회 실패' };
    } catch (error: any) {
        return { success: false, message: error.message || '포인트 조회 중 오류 발생' };
    }
}
