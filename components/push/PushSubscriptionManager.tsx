'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { OA_SAVE_PUSH_SUBSCRIPTION } from '@/src/atoms/oa/push/OA_PUSH_SUBSCRIPTION';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * PushSubscriptionManager
 * - 로그인 유저에 대해 자동으로 Push 알림 구독을 시도합니다.
 * - Service Worker가 등록된 후 Push 구독을 진행합니다.
 */
export function PushSubscriptionManager() {
    const { data: session } = useSession();
    const subscribedRef = useRef(false);

    useEffect(() => {
        if (!session?.user?.id) return;
        if (subscribedRef.current) return;
        if (!VAPID_PUBLIC_KEY) return;
        if (!('serviceWorker' in navigator)) return;
        if (!('PushManager' in window)) return;

        const subscribe = async () => {
            try {
                // 알림 권한 요청
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    console.log('[Push] 알림 권한 거부됨');
                    return;
                }

                // Service Worker 준비 대기
                const registration = await navigator.serviceWorker.ready;

                // 기존 구독 확인
                let subscription = await registration.pushManager.getSubscription();

                if (!subscription) {
                    // 새 구독 생성
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                    });
                    console.log('[Push] 새 구독 생성 완료');
                } else {
                    console.log('[Push] 기존 구독 재사용');
                }

                // DB에 저장
                const result = await OA_SAVE_PUSH_SUBSCRIPTION({
                    user_id: session.user.id,
                    subscription: subscription.toJSON(),
                });

                if (result.success) {
                    subscribedRef.current = true;
                    console.log('[Push] 구독 정보 저장 완료');
                }
            } catch (err) {
                console.warn('[Push] 구독 실패:', err);
            }
        };

        // 약간의 딜레이 후 구독 시도 (SW 등록 완료 대기)
        const timer = setTimeout(subscribe, 3000);
        return () => clearTimeout(timer);
    }, [session?.user?.id]);

    return null; // 렌더링 없음
}
