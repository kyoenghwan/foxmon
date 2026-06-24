// 채팅 알림음 유틸리티
// HTMLAudioElement를 사용한 안정적인 알림음 재생

let notifAudio: HTMLAudioElement | null = null;
let audioInitialized = false;

/**
 * 알림음 HTMLAudioElement를 초기화합니다.
 * 사용자 인터랙션 이벤트에서 호출하여 AudioContext 제한을 우회합니다.
 */
function initAudio() {
    if (audioInitialized) return;
    if (typeof window === 'undefined') return;

    // Base64 인코딩된 짧은 알림음 (Web Audio API로 생성한 WAV)
    // 사용자 인터랙션 없이도 재생 가능하도록 Audio 객체를 미리 생성
    notifAudio = new Audio();
    notifAudio.volume = 0.5;
    audioInitialized = true;
}

/**
 * Web Audio API로 '띵동' 사운드를 WAV Blob URL로 생성
 */
function generateNotificationSoundUrl(): string {
    const sampleRate = 44100;
    const duration = 0.4;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // subchunk size
    view.setUint16(20, 1, true);  // PCM
    view.setUint16(22, 1, true);  // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // 사운드 생성: 띵 (880Hz) + 동 (1175Hz)
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let sample = 0;

        // 첫 번째 음 (띵) 0~0.15s
        if (t < 0.15) {
            const envelope = Math.exp(-t * 20); // 감쇠
            sample += Math.sin(2 * Math.PI * 880 * t) * envelope * 0.4;
        }

        // 두 번째 음 (동) 0.12~0.35s
        if (t >= 0.12 && t < 0.35) {
            const t2 = t - 0.12;
            const envelope = Math.exp(-t2 * 15);
            sample += Math.sin(2 * Math.PI * 1175 * t2) * envelope * 0.4;
        }

        // Clamp & write
        sample = Math.max(-1, Math.min(1, sample));
        view.setInt16(44 + i * 2, sample * 32767, true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
}

let soundUrl: string | null = null;

/**
 * 채팅 메시지 도착 알림음 재생
 */
export function playNotificationSound() {
    try {
        if (typeof window === 'undefined') return;

        initAudio();

        if (!soundUrl) {
            soundUrl = generateNotificationSoundUrl();
        }

        // 매번 새 Audio 인스턴스로 재생 (중복 재생 가능)
        const audio = new Audio(soundUrl);
        audio.volume = 0.5;
        audio.play().catch(() => {
            // 자동 재생 차단 시 무시
            console.warn('[NotificationSound] 자동 재생 차단됨');
        });
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
