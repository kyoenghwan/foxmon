'use server';

import { supabaseAdmin } from '@/lib/supabase';

/**
 * OA_SAVE_PUSH_SUBSCRIPTION
 * 유저의 Web Push 구독 정보를 DB에 저장합니다.
 */
export async function OA_SAVE_PUSH_SUBSCRIPTION({
    user_id,
    subscription,
}: {
    user_id: string;
    subscription: any; // PushSubscription JSON
}): Promise<{ success: boolean }> {
    try {
        const endpoint = subscription.endpoint;

        // upsert: 같은 endpoint가 있으면 업데이트
        const { error } = await supabaseAdmin
            .from('push_subscriptions')
            .upsert(
                {
                    user_id,
                    endpoint,
                    subscription_json: subscription,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'endpoint' }
            );

        if (error) {
            console.error('[PushSub] 구독 저장 실패:', error);
            return { success: false };
        }

        return { success: true };
    } catch (e) {
        console.error('[PushSub] 구독 저장 예외:', e);
        return { success: false };
    }
}

/**
 * OA_DELETE_PUSH_SUBSCRIPTION
 * 유저의 Web Push 구독 정보를 삭제합니다.
 */
export async function OA_DELETE_PUSH_SUBSCRIPTION({
    endpoint,
}: {
    endpoint: string;
}): Promise<{ success: boolean }> {
    try {
        const { error } = await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', endpoint);

        if (error) {
            console.error('[PushSub] 구독 삭제 실패:', error);
            return { success: false };
        }

        return { success: true };
    } catch (e) {
        return { success: false };
    }
}
