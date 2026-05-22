'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// 425px 미만에서 스케일링 발동
const MOBILE_TRIGGER = 425;
// 실제 렌더링 기준 너비 (축소 비율 완화용)
// 375px 기기: zoom 0.96 | 360px 기기: zoom 0.92 | 320px 기기: zoom 0.82
const MOBILE_RENDER_WIDTH = 390;

export function MaxWidthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/fox-office');
  const [zoomLevel, setZoomLevel] = useState<number | null>(null);

  useEffect(() => {
    if (isAdmin) return;

    const updateZoom = () => {
      const vw = window.innerWidth;
      setZoomLevel(vw < MOBILE_TRIGGER ? vw / MOBILE_RENDER_WIDTH : null);
    };

    updateZoom();
    window.addEventListener('resize', updateZoom);
    return () => window.removeEventListener('resize', updateZoom);
  }, [isAdmin]);

  const needsZoom = !isAdmin && zoomLevel !== null;

  return (
    <div 
      className={`mx-auto bg-white min-h-screen relative shadow-[0_0_40px_rgba(0,0,0,0.05)] flex flex-col transition-all duration-300 ${
        isAdmin ? 'w-full' : 'max-w-[1280px] 2xl:max-w-[1096px] 3xl:max-w-[1280px]'
      }`}
      style={needsZoom ? {
        width: `${MOBILE_RENDER_WIDTH}px`,
        maxWidth: `${MOBILE_RENDER_WIDTH}px`,
        zoom: zoomLevel!,
        marginLeft: 0,
        marginRight: 0,
      } : undefined}
    >
      {children}
    </div>
  );
}

