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
            } else {
                const meta = document.querySelector('meta[name="viewport"]');
                if (meta) {
                    meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
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
