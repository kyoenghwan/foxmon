'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

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
                meta.setAttribute('content', `width=600, initial-scale=${scale}, minimum-scale=${scale}, maximum-scale=${scale}, user-scalable=no`);
                
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
