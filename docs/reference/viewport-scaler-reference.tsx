'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * [기술 참고용] ViewportScaler
 * 
 * 모바일 화면(600px 미만)에서 가로 해상도를 강제로 600px로 고정하고,
 * 브라우저의 실제 너비 비례에 맞춰 CSS zoom 스타일로 축소(scale-down) 렌더링을 제공하는 컴포넌트입니다.
 * 
 * 반응형 분기 조절이 어렵거나, 600px에 특화된 레이아웃을 전 기종에서 그대로 유지하고 싶을 때 사용됩니다.
 */
export function ViewportScaler() {
    const pathname = usePathname();

    useEffect(() => {
        function adjustViewport() {
            const w = window.innerWidth || document.documentElement.clientWidth || screen.width;
            console.log("Foxmon ViewportScaler: window.innerWidth =", window.innerWidth, "documentElement.clientWidth =", document.documentElement.clientWidth, "screen.width =", screen.width, "final w =", w);
            if (w > 0 && w < 600) {
                const scale = w / 600;
                console.log("Foxmon ViewportScaler: Scaling viewport to", scale);
                let meta = document.querySelector('meta[name="viewport"]');
                if (!meta) {
                    meta = document.createElement('meta');
                    meta.setAttribute('name', 'viewport');
                    document.head.appendChild(meta);
                }
                meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
                
                // CSS zoom 및 고정 width 속성을 body에 주입하여 데스크톱 리사이즈 및 모바일 브라우저에서 즉시 비율 축소 처리
                if (document.body) {
                    console.log("Foxmon ViewportScaler: Applying zoom styles to document.body");
                    document.body.style.zoom = `${scale}`;
                    document.body.style.width = '600px';
                    document.body.style.margin = '0 auto';
                    document.body.style.overflowX = 'hidden';
                }
            } else {
                console.log("Foxmon ViewportScaler: Clearing zoom styles");
                const meta = document.querySelector('meta[name="viewport"]');
                if (meta) {
                    meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
                }
                if (document.body) {
                    document.body.style.zoom = '';
                    document.body.style.width = '';
                    document.body.style.margin = '';
                    document.body.style.overflowX = '';
                }
            }
        }

        adjustViewport();
        window.addEventListener('resize', adjustViewport);
        return () => {
            window.removeEventListener('resize', adjustViewport);
        };
    }, [pathname]);

    return null;
}
