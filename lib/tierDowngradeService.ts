import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';

/**
 * applyTierDowngradeCheck:
 * 명가(VVVIP) 등 우수 회원이 30일 동안 신규 광고/공고를 등록하지 않았을 경우 등급을 한 단계 강등하고 이력을 기록합니다.
 * @param userId 대상 사용자 ID
 */
export async function applyTierDowngradeCheck(userId: string): Promise<{ downgraded: boolean; nextTier: string | null }> {
    try {
        // 1. 사용자 기본 정보 및 현재 등급 조회
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, created_at, merchant_tier, admin_memo, login_id')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            nvLog('AT', `⚠️ [tierDowngradeService] 유저 조회 실패 (ID: ${userId})`, userError?.message);
            return { downgraded: false, nextTier: null };
        }

        const currentTier = user.merchant_tier || 'NORMAL';
        if (currentTier === 'NORMAL') {
            return { downgraded: false, nextTier: 'NORMAL' };
        }

        // 2. 가장 최근 등록한 공고(jobs) 조회
        const { data: latestJob, error: jobError } = await supabaseAdmin
            .from('jobs')
            .select('created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        // 3. 가장 최근 등록한 광고(biz_ads) 조회
        const { data: latestAd, error: adError } = await supabaseAdmin
            .from('biz_ads')
            .select('created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (jobError) nvLog('AT', `⚠️ [tierDowngradeService] jobs 조회 에러`, jobError.message);
        if (adError) nvLog('AT', `⚠️ [tierDowngradeService] biz_ads 조회 에러`, adError.message);

        // 4. 기준일 산정 (마지막 광고/공고 생성일, 둘 다 없으면 회원 가입일)
        let lastAdDate = new Date(user.created_at);
        
        if (latestJob?.created_at) {
            const jobDate = new Date(latestJob.created_at);
            if (jobDate > lastAdDate) lastAdDate = jobDate;
        }
        
        if (latestAd?.created_at) {
            const adDate = new Date(latestAd.created_at);
            if (adDate > lastAdDate) lastAdDate = adDate;
        }

        // 5. 경과 일수 계산
        const now = new Date();
        const diffMs = now.getTime() - lastAdDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        nvLog('AT', `ℹ️ [tierDowngradeService] 유저 ${user.login_id}: 현재 등급 ${currentTier}, 마지막 활동 기준일: ${lastAdDate.toLocaleDateString()} (경과일: ${diffDays}일)`);

        // 6. 30일 경과 확인 및 강등 실행
        if (diffDays >= 30) {
            let nextTier = 'NORMAL';
            if (currentTier === 'VVVIP') nextTier = 'VVIP';
            else if (currentTier === 'VVIP') nextTier = 'VIP';
            else if (currentTier === 'VIP') nextTier = 'NORMAL';

            // 어드민 메모 이력 구성
            const todayStr = now.toISOString().slice(0, 10);
            const sysMemo = `[시스템] 30일 무등록 자동 강등 (${todayStr}, ${currentTier} -> ${nextTier})`;
            const newMemo = user.admin_memo 
                ? `${user.admin_memo.trim()}\n${sysMemo}`
                : sysMemo;

            const { error: updateError } = await supabaseAdmin
                .from('users')
                .update({
                    merchant_tier: nextTier,
                    admin_memo: newMemo
                })
                .eq('id', userId);

            if (updateError) {
                nvLog('AT', `❌ [tierDowngradeService] 유저 강등 업데이트 에러`, updateError.message);
                return { downgraded: false, nextTier: currentTier };
            }

            nvLog('AT', `🔥 [tierDowngradeService] 강등 실행 완료: 유저 ${user.login_id} (${currentTier} -> ${nextTier})`);
            return { downgraded: true, nextTier };
        }

        return { downgraded: false, nextTier: currentTier };
    } catch (e: any) {
        nvLog('AT', `❌ [tierDowngradeService] 강등 체크 중 예외 발생`, e.message);
        return { downgraded: false, nextTier: null };
    }
}
