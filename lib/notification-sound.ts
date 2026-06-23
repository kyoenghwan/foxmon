// 채팅 알림음 유틸리티
// Web Audio API로 간단한 '띵동' 소리를 생성합니다.

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
}

/**
 * 채팅 메시지 도착 알림음 재생
 * Web Audio API로 2음 (띵동) 사운드를 합성합니다.
 */
export function playNotificationSound() {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const now = ctx.currentTime;

        // 첫 번째 음 (띵) - 높은 음
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now); // A5
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.15);

        // 두 번째 음 (동) - 더 높은 음
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1175, now + 0.12); // D6
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.setValueAtTime(0.3, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.35);
    } catch (e) {
        console.warn('[NotificationSound] 알림음 재생 실패:', e);
    }
}

/**
 * 브라우저 Notification API로 알림 표시
 * 탭이 백그라운드일 때 OS 레벨 알림 팝업을 보여줍니다.
 */
export function showBrowserNotification(title: string, body: string, onClick?: () => void) {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: 'foxtalk-message',
            renotify: true,
        });

        if (onClick) {
            notification.onclick = () => {
                window.focus();
                onClick();
                notification.close();
            };
        }

        // 5초 후 자동 닫기
        setTimeout(() => notification.close(), 5000);
    }
}

/**
 * 브라우저 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined') return 'denied';
    if (!('Notification' in window)) return 'denied';

    if (Notification.permission === 'default') {
        return await Notification.requestPermission();
    }

    return Notification.permission;
}
