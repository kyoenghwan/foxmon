/**
 * ⚠️ [프로젝트 특수 지침 보호 파일] ⚠️
 * 규칙 문서: docs/project_rules/03_mobile_viewport_scaling.md
 * 
 * 이 파일은 모바일 세로모드(425px 미만) 뷰포트 스케일링의 유일한 소스(SSOT)입니다.
 * MOBILE_TRIGGER(425) 값을 임의 변경하거나, 스케일링 로직을 제거/비활성화하는 것은
 * 프로젝트 규칙에 의해 절대 금지됩니다.
 * 
 * 수정이 필요한 경우 반드시 사용자 승인을 받으십시오.
 */
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// ❌ [절대 변경 금지] 425px 미만에서 스케일링 발동
const MOBILE_TRIGGER = 425;
// ⚠️ [사용자 승인 필요] 실제 렌더링 기준 너비 (축소 비율 완화용)
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
        isAdmin ? 'w-full' : 'max-w-[425px] xl:max-w-[920px] 2xl:max-w-[1100px] 3xl:max-w-[1500px] 4xl:max-w-[2040px]'
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

