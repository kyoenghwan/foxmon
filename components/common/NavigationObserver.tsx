'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationObserver() {
    const pathname = usePathname();
    const routeStartRef = useRef<number | null>(null);
    const targetUrlRef = useRef<string | null>(null);

    // 1. 클릭 캡처링 리스너: 내부 라우팅 이동(Link 클릭) 시점 감지
    useEffect(() => {
        const handleLinkClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('a');
            if (target && target.href) {
                // target="_blank" 또는 JavaScript 바인딩 링크 제외
                if (target.target === '_blank' || target.href.startsWith('javascript:')) {
                    return;
                }
                try {
                    const url = new URL(target.href);
                    // 내부 도메인 내 라우팅 이동인 경우에만 시작 타임스탬프 기록
                    if (url.origin === window.location.origin) {
                        routeStartRef.current = performance.now();
                        targetUrlRef.current = url.pathname + url.search;
                        console.log(`⏳ [Navigation Performance] 🚀 Route started from ${window.location.pathname} to ${targetUrlRef.current}`);
                    }
                } catch (err) {
                    // URL 파싱 방어 코드
                }
            }
        };

        window.addEventListener('click', handleLinkClick, true); // 캡처링 단계에서 선점
        return () => window.removeEventListener('click', handleLinkClick, true);
    }, []);

    // 2. 라우팅 완성 시점(pathname 변경 감지) 처리
    useEffect(() => {
        if (routeStartRef.current !== null && targetUrlRef.current !== null) {
            const duration = performance.now() - routeStartRef.current;
            console.log(`🏁 [Navigation Performance] Completed route to ${pathname} in ${duration.toFixed(2)}ms`);
            
            // 타이머 초기화
            routeStartRef.current = null;
            targetUrlRef.current = null;
        }
    }, [pathname]);

    return null;
}
