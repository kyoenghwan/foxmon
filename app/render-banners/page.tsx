'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';

const ROULETTE_SECTORS = [
  { amount: 10, label: '10p', color: '#3b82f6' },     // 파랑
  { amount: 30, label: '30p', color: '#ec4899' },     // 핑크
  { amount: 50, label: '50p', color: '#10b981' },     // 초록
  { amount: 100, label: '100p', color: '#f59e0b' },   // 노랑
  { amount: 500, label: '500p', color: '#8b5cf6' },   // 보라
  { amount: 1000, label: '1,000p', color: '#ef4444' }, // 빨강
];

// ═══════════════════════════════════════
// 캡처 전용: DOM 정리 useEffect (공통)
// ═══════════════════════════════════════
function useCaptureCleanup(rootRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    document.body.style.cssText = 'overflow:hidden!important;margin:0!important;padding:0!important;background:#090d16!important;';
    document.documentElement.style.cssText = 'overflow:hidden!important;margin:0!important;padding:0!important;background:#090d16!important;';

    let parent = root.parentElement;
    const cleanedParents: HTMLElement[] = [];
    while (parent && parent !== document.body && parent !== document.documentElement) {
      parent.style.cssText += ';background:transparent!important;box-shadow:none!important;max-width:100vw!important;width:100vw!important;height:100vh!important;padding:0!important;margin:0!important;border:none!important;position:static!important;overflow:visible!important;';
      cleanedParents.push(parent);
      parent = parent.parentElement;
    }

    const bodyChildren = Array.from(document.body.children);
    const hiddenElements: HTMLElement[] = [];
    for (const child of bodyChildren) {
      if (child instanceof HTMLElement && !child.contains(root) && child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE') {
        child.style.display = 'none';
        hiddenElements.push(child);
      }
    }

    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => { (iframe as HTMLElement).style.display = 'none'; });

    return () => {
      for (const el of hiddenElements) el.style.display = '';
      for (const p of cleanedParents) p.style.cssText = '';
      document.body.style.cssText = '';
      document.documentElement.style.cssText = '';
    };
  }, [rootRef]);
}

// ═══════════════════════════════════════
// 공통 배너 카드 플레이트 (축하 텍스트)
// ═══════════════════════════════════════
function BannerCard({ gameLabel, rewardLabel, className }: { gameLabel: string; rewardLabel: string; className?: string }) {
  return (
    <div className={`absolute z-30 w-[370px] h-[160px] rounded-2xl bg-gradient-to-br from-[#24123a] via-[#140a22] to-[#24123a] border-[3px] border-yellow-600/40 shadow-[0_12px_30px_rgba(0,0,0,0.85),_0_0_20px_rgba(217,119,6,0.2)] flex flex-col items-center justify-center p-3 ${className || ''}`}>
      
      {/* 금색 테두리 장식 프레임 (SVG) */}
      <div className="absolute inset-1.5 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect x="2" y="2" width="96" height="96" rx="4" fill="none" stroke="#eab308" strokeWidth="0.8" strokeOpacity="0.9" />
          <rect x="3.5" y="3.5" width="93" height="93" rx="3" fill="none" stroke="#d97706" strokeWidth="0.4" strokeOpacity="0.7" />
          <path d="M 1 8 L 8 1 L 12 5 L 5 12 Z" fill="#d97706" />
          <path d="M 2 12 C 5 8, 8 5, 12 2" fill="none" stroke="#fef08a" strokeWidth="1" />
          <circle cx="6" cy="6" r="1" fill="#facc15" />
          <path d="M 99 8 L 92 1 L 88 5 L 95 12 Z" fill="#d97706" />
          <path d="M 98 12 C 95 8, 92 5, 88 2" fill="none" stroke="#fef08a" strokeWidth="1" />
          <circle cx="94" cy="6" r="1" fill="#facc15" />
          <path d="M 1 92 L 8 99 L 12 95 L 5 88 Z" fill="#d97706" />
          <path d="M 2 88 C 5 92, 8 95, 12 98" fill="none" stroke="#fef08a" strokeWidth="1" />
          <circle cx="6" cy="94" r="1" fill="#facc15" />
          <path d="M 99 92 L 92 99 L 88 95 L 95 88 Z" fill="#d97706" />
          <path d="M 98 88 C 95 92, 92 95, 88 98" fill="none" stroke="#fef08a" strokeWidth="1" />
          <circle cx="94" cy="94" r="1" fill="#facc15" />
        </svg>
      </div>

      <div className="absolute top-1.5 w-10 h-5 flex items-center justify-center opacity-85">
        <svg className="w-full h-full text-yellow-400" viewBox="0 0 24 12" fill="currentColor">
          <path d="M12 2L9 6h6l-3-4zm0 8l3-4H9l3 4z" />
        </svg>
      </div>

      <div className="text-center mt-1 z-10 flex flex-col items-center">
        <h2 className="text-[20px] font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-amber-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          축하합니다!
        </h2>
        <div className="h-[1.5px] w-24 bg-gradient-to-r from-transparent via-yellow-400 to-transparent my-2 shadow-glow"></div>
        <h1 className="text-[25px] font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-300 to-amber-500 drop-shadow-[0_3px_5px_rgba(0,0,0,0.9)]">
          {gameLabel} {rewardLabel} 당첨!
        </h1>
      </div>
      
      <div className="absolute bottom-1.5 w-10 h-5 flex items-center justify-center opacity-85">
        <svg className="w-full h-full text-yellow-400" viewBox="0 0 24 12" fill="currentColor">
          <path d="M12 10L9 6h6l-3 4zm0-8l3 4H9l3-4z" />
        </svg>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// 룰렛 배너 렌더러
// ═══════════════════════════════════════
function RouletteBanner({ amount }: { amount: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  useCaptureCleanup(rootRef);

  const targetIndex = ROULETTE_SECTORS.findIndex((s) => s.amount === amount);
  const sectorAngle = 360 / ROULETTE_SECTORS.length;
  const targetAngle = 360 - (targetIndex * sectorAngle) - (sectorAngle / 2);
  const rewardLabel = amount.toLocaleString() + 'p';

  return (
    <div ref={rootRef} id="capture-root" style={{ position: 'fixed', inset: 0, zIndex: 2147483647, backgroundColor: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none', overflow: 'hidden' }}>
      <div style={{ width: 400, height: 400, backgroundColor: '#090d16', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        
        <div className="absolute top-[15px] z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-red-500 filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.6)]"></div>

        <div className="relative w-[320px] h-[320px] rounded-full border-[8px] border-yellow-600/90 shadow-[0_0_35px_rgba(217,119,6,0.35)] bg-gray-950 flex items-center justify-center mt-3">
          <div
            className="w-full h-full rounded-full relative overflow-hidden"
            style={{
              transform: `rotate(${targetAngle}deg)`,
              background: `conic-gradient(from 0deg, ${ROULETTE_SECTORS.map(
                (s, i) => `${s.color} ${i * 60}deg ${(i + 1) * 60}deg`
              ).join(', ')})`,
            }}
          >
            {ROULETTE_SECTORS.map((sector, index) => {
              const angle = index * 60 + 30;
              return (
                <div key={index} className="absolute top-0 left-0 w-full h-full flex justify-center items-start pt-7 origin-center" style={{ transform: `rotate(${angle}deg)` }}>
                  <span className="text-white text-[13px] font-black tracking-tighter filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">{sector.label}</span>
                </div>
              );
            })}
          </div>

          <div className="absolute w-18 h-18 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-750 border-[3px] border-yellow-250 flex flex-col items-center justify-center shadow-2xl z-10 opacity-70">
            <span className="text-[12px] text-gray-950 font-black tracking-tight">START</span>
          </div>
        </div>

        <div className="absolute z-10 w-[200px] h-[200px] rounded-full border-[5px] border-yellow-500/25 bg-gradient-to-br from-purple-950/60 via-transparent to-red-950/60 flex items-center justify-center">
          <div className="w-[160px] h-[160px] rounded-full border border-yellow-400/30 border-dashed"></div>
        </div>

        <div className="absolute z-20 top-[160px] left-[60px] w-3 h-3 bg-yellow-200 rounded-full blur-[3px] animate-pulse"></div>
        <div className="absolute z-20 top-[260px] right-[60px] w-3 h-3 bg-yellow-200 rounded-full blur-[3px] animate-pulse"></div>

        <BannerCard gameLabel="룰렛" rewardLabel={rewardLabel} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// 랜덤박스 배너 렌더러 (열린 상자 + 당첨금 표시)
// ═══════════════════════════════════════
function LuckyBoxBanner({ amount }: { amount: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  useCaptureCleanup(rootRef);

  const rewardLabel = amount.toLocaleString() + 'p';

  return (
    <div ref={rootRef} id="capture-root" style={{ position: 'fixed', inset: 0, zIndex: 2147483647, backgroundColor: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none', overflow: 'hidden' }}>
      <div style={{ width: 400, height: 400, backgroundColor: '#090d16', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        
        {/* 아우라 빛 효과 */}
        <div className="absolute w-52 h-52 rounded-full bg-yellow-500/15 blur-3xl" />

        {/* 선물 상자 이미지 (HTML) */}
        <div className="relative w-48 h-52 select-none overflow-visible z-0" style={{ position: 'absolute', top: '50px' }}>
          {/* 상자 몸통 (열린 상태 배너이므로 몸통만 표시) */}
          <img 
            src="/images/playground/random_box_bottom.png" 
            alt="상자 몸통" 
            className="absolute inset-0 w-full h-full object-contain" 
          />
        </div>

        {/* 폭죽 파티클 (정적 - SVG로 겹쳐 그림) */}
        <svg viewBox="0 0 200 240" className="w-56 h-64 select-none relative overflow-visible z-10 pointer-events-none" style={{ position: 'absolute', top: '40px' }}>
          {/* 폭죽 파티클 (정적 - 상자에서 위로 사방 부채꼴로 퍼져나감, 크기 상향 조정) */}
          {/* 원형 파티클 */}
          <circle cx="65" cy="40" r="8" fill="#ef4444" opacity="0.9" />
          <circle cx="140" cy="35" r="7" fill="#facc15" opacity="0.9" />
          <circle cx="50" cy="60" r="9" fill="#3b82f6" opacity="0.85" />
          <circle cx="155" cy="55" r="7.5" fill="#10b981" opacity="0.9" />
          <circle cx="80" cy="20" r="8" fill="#ec4899" opacity="0.9" />
          <circle cx="125" cy="25" r="8" fill="#f59e0b" opacity="0.9" />
          <circle cx="45" cy="80" r="6" fill="#8b5cf6" opacity="0.85" />
          <circle cx="160" cy="75" r="7" fill="#06b6d4" opacity="0.9" />
          <circle cx="95" cy="15" r="7" fill="#ef4444" opacity="0.95" />
          <circle cx="110" cy="15" r="6.5" fill="#00e676" opacity="0.95" />
          <circle cx="35" cy="95" r="7" fill="#ffee58" opacity="0.9" />
          <circle cx="170" cy="90" r="5" fill="#2979ff" opacity="0.9" />
          
          {/* 별 모양 파티클 (크기 확대) */}
          <path d="M 70,27 L 73,34 L 81,35 L 73,37 L 70,44 L 67,37 L 59,35 L 67,34 Z" fill="#facc15" opacity="0.95" />
          <path d="M 135,42 L 137.5,47 L 143.5,48.5 L 137.5,50 L 135,55 L 132.5,50 L 126.5,48.5 L 132.5,47 Z" fill="#ef4444" opacity="0.9" />
          <path d="M 100,22 L 102.5,27 L 108.5,28.5 L 102.5,30 L 100,35 L 97.5,30 L 91.5,28.5 L 97.5,27 Z" fill="#ff4081" opacity="0.95" />

          {/* 나선형 스트리머 (구불구불 리본) 파티클 (선 굵기 및 크기 확대) */}
          <path d="M 65,30 Q 75,37 68,44 Q 61,51 69,58" fill="none" stroke="#bd10e0" strokeWidth="3.2" strokeLinecap="round" opacity="0.9" />
          <path d="M 130,25 Q 120,35 133,45 Q 144,55 129,65" fill="none" stroke="#05d9e8" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
          <path d="M 155,45 Q 146,52 151,62 Q 158,72 148,80" fill="none" stroke="#ff4081" strokeWidth="3.2" strokeLinecap="round" opacity="0.85" />
          <path d="M 45,55 Q 54,62 49,72 Q 41,82 51,90" fill="none" stroke="#f5a623" strokeWidth="3.2" strokeLinecap="round" opacity="0.85" />

          {/* 사각형/리본 조각 파티클 (크기 확대) */}
          <rect x="55" y="50" width="7" height="7" rx="1" fill="#10b981" opacity="0.85" transform="rotate(45 58.5 53.5)" />
          <rect x="145" y="48" width="7" height="7" rx="1" fill="#ec4899" opacity="0.85" transform="rotate(30 148.5 51.5)" />
          <rect x="75" y="55" width="6" height="9" rx="1" fill="#8b5cf6" opacity="0.85" transform="rotate(15 78 59.5)" />
          <rect x="120" y="50" width="9" height="6" rx="1" fill="#ff7043" opacity="0.85" transform="rotate(75 124.5 53)" />
        </svg>

        {/* ═══ 당첨 코인 (HTML 오버레이 - z-index: 20으로 폭죽보다 위) ═══ */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center justify-center"
          style={{
            top: '48px', // 박스 입구 바로 위로 올림
          }}
        >
          <div className="w-[74px] h-[74px] rounded-full bg-gradient-to-b from-yellow-300 to-yellow-600 border-[3.5px] border-yellow-500 shadow-[0_10px_25px_rgba(0,0,0,0.85),_0_0_20px_rgba(234,179,8,0.45)] flex flex-col items-center justify-center bg-[#1e1b4b]">
            <span className="text-yellow-400 font-extrabold text-[11px] leading-tight drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">당첨</span>
            <span className="text-white font-black text-[15px] leading-tight drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">{rewardLabel}</span>
          </div>
        </div>

        {/* 스파클링 광원 효과 */}
        <div className="absolute z-20 top-[100px] left-[50px] w-3 h-3 bg-yellow-200 rounded-full blur-[3px] animate-pulse"></div>
        <div className="absolute z-20 top-[80px] right-[50px] w-3 h-3 bg-yellow-200 rounded-full blur-[3px] animate-pulse"></div>
        <div className="absolute z-20 top-[60px] left-[140px] w-2 h-2 bg-amber-300 rounded-full blur-[2px] animate-pulse"></div>

        {/* 축하 배너 카드 */}
        <BannerCard gameLabel="랜덤박스" rewardLabel={rewardLabel} className="z-[40]" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// 라우터: ?type=luckybox|roulette 에 따라 분기
// ═══════════════════════════════════════
function BannerRouter() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'roulette';
  const amountStr = searchParams.get('amount') || '100';
  const amount = parseInt(amountStr, 10);

  if (type === 'luckybox') {
    return <LuckyBoxBanner amount={amount} />;
  }
  return <RouletteBanner amount={amount} />;
}

export default function RenderBannersPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <BannerRouter />
    </Suspense>
  );
}
