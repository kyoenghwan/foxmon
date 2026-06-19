/**
 * ⚠️ [프로젝트 특수 지침 보호 파일] ⚠️
 * 규칙 문서: docs/project_rules/03_mobile_viewport_scaling.md
 * 
 * 이 파일은 모바일 세로모드(425px 미만) 뷰포트 스케일링 및 PC/모바일 이분법적 레이아웃 잠금의 핵심 파일입니다.
 */
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const MOBILE_TRIGGER = 425;
const MOBILE_RENDER_WIDTH = 390;
const PC_TRIGGER = 1024;

export function MaxWidthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/fox-office');
  const isCapturePage = pathname?.startsWith('/render-banners');
  const isExcluded = isAdmin || isCapturePage;
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);

  useEffect(() => {
    if (isExcluded) return;

    const updateDimensions = () => {
      setViewportWidth(window.innerWidth);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isExcluded]);

  // 서버 사이드 렌더링 시에는 기본값(클라이언트 너비 알기 전)으로 null 리턴 또는 w-full 렌더
  const isMounted = viewportWidth !== null;
  const needsZoom = !isExcluded && isMounted && viewportWidth < MOBILE_TRIGGER;
  const isMobileLocked = !isExcluded && isMounted && viewportWidth >= MOBILE_TRIGGER && viewportWidth < 640;
  const isTabletLocked = !isExcluded && isMounted && viewportWidth >= 640 && viewportWidth < PC_TRIGGER;
  const isPcLocked = !isExcluded && isMounted && viewportWidth >= PC_TRIGGER;

  let dynamicStyle: React.CSSProperties | undefined = undefined;

  if (!isExcluded && isMounted) {
    if (needsZoom) {
      dynamicStyle = {
        width: `${MOBILE_RENDER_WIDTH}px`,
        maxWidth: `${MOBILE_RENDER_WIDTH}px`,
        zoom: viewportWidth / MOBILE_RENDER_WIDTH,
        marginLeft: 0,
        marginRight: 0,
      };
    } else {
      dynamicStyle = {
        width: '100%',
        maxWidth: '100%',
      };
    }
  }

  // 캡처 전용 페이지에서는 래핑 없이 children만 반환
  if (isCapturePage) {
    return <>{children}</>;
  }

  return (
    <div 
      className={`mx-auto bg-white min-h-screen relative shadow-[0_0_40px_rgba(0,0,0,0.05)] flex flex-col transition-all duration-300 ${
        isExcluded ? 'w-full' : ''
      }`}
      style={dynamicStyle}
    >
      {children}
    </div>
  );
}
