'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function MaxWidthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/fox-office');

  useEffect(() => {
    if (isAdmin) return;

    const updateViewport = () => {
      let meta = document.querySelector('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'viewport');
        document.head.appendChild(meta);
      }

      const width = window.innerWidth;
      if (width < 425) {
        const scale = width / 425;
        meta.setAttribute(
          'content',
          `width=425, initial-scale=${scale}, minimum-scale=${scale}, maximum-scale=${scale}, user-scalable=no`
        );
      } else {
        meta.setAttribute(
          'content',
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
        );
      }
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      const meta = document.querySelector('meta[name="viewport"]');
      if (meta) {
        meta.setAttribute(
          'content',
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
        );
      }
    };
  }, [isAdmin]);

  return (
    <div 
      className={`mx-auto bg-white min-h-screen relative shadow-[0_0_40px_rgba(0,0,0,0.05)] flex flex-col transition-all duration-300 ${
        isAdmin ? 'w-full' : 'max-w-[1280px] 2xl:max-w-[1096px] 3xl:max-w-[1280px]'
      }`}
    >
      {children}
    </div>
  );
}
