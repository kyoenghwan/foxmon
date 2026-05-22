'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const MOBILE_BASE_WIDTH = 425;

export function MaxWidthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/fox-office');
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (isAdmin) return;

    const updateZoom = () => {
      const vw = window.innerWidth;
      setZoomLevel(vw < MOBILE_BASE_WIDTH ? vw / MOBILE_BASE_WIDTH : 1);
    };

    updateZoom();
    window.addEventListener('resize', updateZoom);
    return () => window.removeEventListener('resize', updateZoom);
  }, [isAdmin]);

  const needsZoom = !isAdmin && zoomLevel < 1;

  return (
    <div 
      className={`mx-auto bg-white min-h-screen relative shadow-[0_0_40px_rgba(0,0,0,0.05)] flex flex-col transition-all duration-300 ${
        isAdmin ? 'w-full' : 'max-w-[1280px] 2xl:max-w-[1096px] 3xl:max-w-[1280px]'
      }`}
      style={needsZoom ? {
        width: `${MOBILE_BASE_WIDTH}px`,
        maxWidth: `${MOBILE_BASE_WIDTH}px`,
        zoom: zoomLevel,
        marginLeft: 0,
        marginRight: 0,
      } : undefined}
    >
      {children}
    </div>
  );
}
