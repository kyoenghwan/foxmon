'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ViewportScaler() {
    const pathname = usePathname();

    useEffect(() => {
        function adjustViewport() {
            const w = window.innerWidth || document.documentElement.clientWidth || screen.width;
            if (w > 0 && w < 425) {
                const scale = w / 425;
                let meta = document.querySelector('meta[name="viewport"]');
                if (!meta) {
                    meta = document.createElement('meta');
                    meta.setAttribute('name', 'viewport');
                    document.head.appendChild(meta);
                }
                meta.setAttribute('content', `width=425, initial-scale=${scale}, minimum-scale=${scale}, maximum-scale=${scale}, user-scalable=no`);
                
                // CSS zoom 및 고정 width 속성을 주입하여 데스크톱 리사이즈 및 모바일 브라우저에서 즉시 비율 축소 처리
                document.documentElement.style.zoom = `${scale}`;
                document.documentElement.style.width = '425px';
                document.documentElement.style.overflowX = 'hidden';
            } else {
                const meta = document.querySelector('meta[name="viewport"]');
                if (meta) {
                    meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
                }
                document.documentElement.style.zoom = '';
                document.documentElement.style.width = '';
                document.documentElement.style.overflowX = '';
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
