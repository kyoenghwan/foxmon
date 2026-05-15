'use client';

import { useEffect } from 'react';

export function ZoomProvider() {
  useEffect(() => {
    let ticking = false;

    const handleResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // window.innerWidth returns the *zoomed* width. 
          // To get the actual physical width in CSS pixels before zoom is applied,
          // we can multiply the current innerWidth by the current zoom level.
          const currentZoom = parseFloat(document.documentElement.style.zoom || '1');
          const realWidth = window.innerWidth * currentZoom;
          
          // Apply zoom only if the real browser window is between 1280px and 1600px
          // We need 1600px to show 1280px main content + two 150px side banners comfortably.
          if (realWidth >= 1280 && realWidth < 1600) {
            const zoomLevel = realWidth / 1600;
            document.documentElement.style.zoom = zoomLevel.toString();
          } else {
            document.documentElement.style.zoom = '1';
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial calculation
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return null;
}
