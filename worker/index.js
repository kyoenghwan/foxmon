// 커스텀 Service Worker - Push 알림 처리
// next-pwa가 빌드 시 이 파일을 sw.js에 자동으로 병합합니다.

self.addEventListener('push', function (event) {
    if (!event.data) return;

    try {
        const data = event.data.json();

        const options = {
            body: data.body || '새 메시지가 도착했습니다.',
            icon: data.icon || '/icons/icon-192x192.png',
            badge: data.badge || '/icons/icon-72x72.png',
            tag: 'foxtalk-push-' + (data.room_id || 'general'),
            renotify: true,
            vibrate: [200, 100, 200],
            data: {
                url: data.url || '/',
                room_id: data.room_id,
            },
        };

        event.waitUntil(
            self.registration.showNotification(data.title || '🦊 폭스톡', options)
        );
    } catch (e) {
        console.error('[SW Push] 알림 처리 실패:', e);
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // 이미 열려있는 창이 있으면 포커스
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // 없으면 새 창 열기
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
