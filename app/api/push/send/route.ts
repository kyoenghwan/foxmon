import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@foxmon.co.kr';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

/**
 * POST /api/push/send
 * 특정 방의 모든 구독자에게 Push 알림을 발송합니다.
 */
export async function POST(req: Request) {
    try {
        const { title, body, room_id, sender_id } = await req.json();

        if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
            return NextResponse.json({ success: false, message: 'VAPID 키가 설정되지 않았습니다.' }, { status: 500 });
        }

        // 모든 푸시 구독자 조회 (발송자 본인 제외)
        let query = supabaseAdmin
            .from('push_subscriptions')
            .select('id, endpoint, subscription_json, user_id');
        
        if (sender_id) {
            query = query.neq('user_id', sender_id);
        }

        const { data: subscriptions, error } = await query;

        if (error || !subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ success: true, sent: 0 });
        }

        const payload = JSON.stringify({
            title: title || '🦊 폭스톡',
            body: body || '새 메시지가 도착했습니다.',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            url: '/',
            room_id,
        });

        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    await webpush.sendNotification(sub.subscription_json, payload);
                    return { id: sub.id, status: 'sent' };
                } catch (err: any) {
                    // 410 Gone = 구독 만료 → DB에서 삭제
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await supabaseAdmin
                            .from('push_subscriptions')
                            .delete()
                            .eq('id', sub.id);
                        return { id: sub.id, status: 'expired_removed' };
                    }
                    return { id: sub.id, status: 'failed', error: err.message };
                }
            })
        );

        const sent = results.filter(r => r.status === 'fulfilled' && (r.value as any).status === 'sent').length;

        return NextResponse.json({ success: true, sent, total: subscriptions.length });
    } catch (err: any) {
        console.error('[Push API] 발송 오류:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
