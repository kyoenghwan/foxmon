'use server';

import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { invalidateAdCache } from '@/lib/ad-service';
import { nvLog } from '@/lib/logger';

export interface AdRefundEstimation {
    adId: string;
    title: string;
    company: string;
    totalPoints: number;
    totalDays: number;
    usedDays: number;
    remainingDays: number;
    proratedAmount: number;
    feeAmount: number;
    refundPoints: number;
}

/**
 * 광고 취소/철회 시 예상 환불 포인트를 일할 계산하는 헬퍼 함수
 */
export async function estimateAdRefund(ad: any): Promise<AdRefundEstimation> {
    const totalPoints = Number(ad.total_points || 0);
    const createdAt = new Date(ad.created_at);
    const expiresAt = new Date(ad.expires_at);

    // 총 광고 기간 계산 (ms -> day 올림)
    const totalDays = Math.max(1, Math.ceil((expiresAt.getTime() - createdAt.getTime()) / (24 * 3600 * 1000)));
    
    // 사용 일수 계산 (현재 시간 기준, 올림)
    // 광고가 시작된 상태이므로 사용 일수는 최소 1일로 설정
    const usedDays = Math.max(1, Math.ceil((Date.now() - createdAt.getTime()) / (24 * 3600 * 1000)));
    
    // 남은 일수 = 총 일수 - 사용 일수 (음수 방지)
    const remainingDays = Math.max(0, totalDays - Math.min(totalDays, usedDays));

    // 일할 계산 잔여액
    const proratedAmount = Math.floor(totalPoints * (remainingDays / totalDays));

    // 10% 철회 수수료
    const feeAmount = Math.floor(proratedAmount * 0.1);

    // 최종 반환 포인트 (잔여액 - 수수료)
    const refundPoints = Math.max(0, proratedAmount - feeAmount);

    return {
        adId: ad.id,
        title: ad.title,
        company: ad.company || ad.company_name || '폭스몬',
        totalPoints,
        totalDays,
        usedDays: Math.min(totalDays, usedDays),
        remainingDays,
        proratedAmount,
        feeAmount,
        refundPoints
    };
}

/**
 * 어드민 전용 - 특정 광고 노출 취소 및 일할 계산 포인트 환불 승인 액션
 */
export async function adminCancelAdAction(adId: string) {
    nvLog('AT', `▶️ adminCancelAdAction 시작 - adId: ${adId}`);

    try {
        // 1. 관리자 세션 권한 검증
        const session = await auth();
        const role = (session?.user as any)?.role;
        if (!session?.user?.id || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
            return { success: false, message: '관리자 권한이 없습니다.' };
        }

        // 2. 광고 데이터 조회
        const { data: ad, error: fetchAdError } = await supabaseAdmin
            .from('biz_ads')
            .select('*')
            .eq('id', adId)
            .single();

        if (fetchAdError || !ad) {
            return { success: false, message: `광고를 찾을 수 없습니다: ${fetchAdError?.message || ''}` };
        }

        const isPending = new Date(ad.expires_at).getFullYear() === 2000;
        const isExpired = new Date(ad.expires_at) < new Date() && !isPending;

        if (isExpired) {
            return { success: false, message: '이미 만료된 광고는 취소/철회할 수 없습니다.' };
        }

        // 3. 환불 내역 계산
        // 만약 결제 대기 상태인 경우 환불할 포인트가 없고 바로 노출 취소만 가능
        let refundEst: AdRefundEstimation;
        if (isPending) {
            refundEst = {
                adId: ad.id,
                title: ad.title,
                company: ad.company || ad.company_name || '폭스몬',
                totalPoints: 0,
                totalDays: 0,
                usedDays: 0,
                remainingDays: 0,
                proratedAmount: 0,
                feeAmount: 0,
                refundPoints: 0
            };
        } else {
            refundEst = estimateAdRefund(ad);
        }

        // 4. 유저 포인트 갱신 및 만료일 업데이트 트랜잭션 수행
        const userId = ad.user_id;

        // 4-1. 유저의 현재 포인트 조회
        const { data: userCurrent, error: userError } = await supabaseAdmin
            .from('users')
            .select('paid_points, bonus_points')
            .eq('id', userId)
            .single();

        if (userError || !userCurrent) {
            return { success: false, message: `사용자 정보를 가져올 수 없습니다: ${userError?.message || ''}` };
        }

        // 포인트 복구 (유료 포인트인 paid_points 가산)
        const currentPaid = Number(userCurrent.paid_points || 0);
        const currentBonus = Number(userCurrent.bonus_points || 0);
        const newPaidPoints = currentPaid + refundEst.refundPoints;
        const balanceAfter = newPaidPoints + currentBonus;

        // 4-2. 유저 포인트 합산 업데이트
        if (refundEst.refundPoints > 0) {
            const { error: updatePointsError } = await supabaseAdmin
                .from('users')
                .update({
                    paid_points: newPaidPoints
                })
                .eq('id', userId);

            if (updatePointsError) {
                return { success: false, message: `사용자 포인트 복구 업데이트 실패: ${updatePointsError.message}` };
            }

            // 4-3. 포인트 트랜잭션 내역 로그 기록
            const { error: logError } = await supabaseAdmin
                .from('point_transactions')
                .insert({
                    user_id: userId,
                    type: 'CHARGE',
                    amount: refundEst.refundPoints,
                    balance_after: balanceAfter,
                    description: `[광고 철회 환불] ${ad.title} (사용 ${refundEst.usedDays}일/잔여 ${refundEst.remainingDays}일)`
                });

            if (logError) {
                nvLog('AT', `⚠️ 포인트 로그 기록 실패 (단, 잔액은 복구됨)`, logError.message);
            }
        }

        // 4-4. 광고 노출 만료일 현재로 단축하여 강제 만료 처리
        const { error: updateAdError } = await supabaseAdmin
            .from('biz_ads')
            .update({
                expires_at: new Date().toISOString()
            })
            .eq('id', adId);

        if (updateAdError) {
            return { success: false, message: `광고 만료일 변경 실패: ${updateAdError.message}` };
        }

        // 5. 서버 캐시 갱신
        invalidateAdCache(ad.tier);

        nvLog('AT', `✅ 광고 취소 및 환불 완료 - adId: ${adId}, 반환포인트: ${refundEst.refundPoints}`);
        return { 
            success: true, 
            message: isPending 
                ? '결제 대기 중인 광고가 정상적으로 취소 및 만료 처리되었습니다.' 
                : `광고 철회가 완료되었습니다. (${refundEst.refundPoints.toLocaleString()} P 반환 완료)`
        };
    } catch (err: any) {
        nvLog('AT', `❌ adminCancelAdAction 예외 발생`, err.message);
        return { success: false, message: `작업 중 예외 오류가 발생했습니다: ${err.message}` };
    }
}
