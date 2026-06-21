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
        <BannerCard gameLabel="랜덤박스" rewardLabel={rewardLabel} className="z-[40] translate-y-[50px]" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// 종이뽑기 배너 렌더러 (레트로 딱지 디자인)
// ═══════════════════════════════════════
function RetroDrawBanner({ amount }: { amount: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  useCaptureCleanup(rootRef);

  const rewardLabel = amount.toLocaleString() + 'p';

  // 100개 격자 더미 데이터 생성 (일부는 뜯긴 상태로 연출)
  const dummySlots = Array.from({ length: 100 }).map((_, index) => {
    const slotNumber = index + 1;
    const pulledSlots = {
      4: { reward: '+1000' },
      25: { reward: '+50' },
      43: { reward: '꽝' },
      65: { reward: '+10' },
      74: { reward: '꽝' },
      82: { reward: '꽝' },
      98: { reward: '꽝' }
    };
    const isPulled = slotNumber in pulledSlots;
    const reward = isPulled ? (pulledSlots as any)[slotNumber].reward : null;
    return { slotNumber, isPulled, reward };
  });

  return (
    <div ref={rootRef} id="capture-root" style={{ position: 'fixed', inset: 0, zIndex: 2147483647, backgroundColor: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none', overflow: 'hidden' }}>
      
      {/* 개발용 Next.js 배지 및 포탈 강제 숨김 스타일 */}
      <style jsx global>{`
        nextjs-portal, 
        #nextjs-dev-indicator,
        [data-nextjs-dialog-overlay] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>

      <div style={{ width: 400, height: 400, backgroundColor: '#090d16', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        
        {/* 뒷배경: 10x10 종이뽑기판 (반투명 처리용으로 스케일 낮춰 배치) */}
        <div className="absolute w-[360px] h-[360px] opacity-55 grid grid-cols-10 gap-0.5 p-1.5 bg-amber-950/40 border border-amber-850/50 rounded-2xl pointer-events-none scale-90 z-0">
          {dummySlots.map((slot) => (
            <div
              key={slot.slotNumber}
              className={`aspect-square flex items-center justify-center rounded border text-[8px] font-black ${
                slot.isPulled
                  ? 'bg-gray-800/50 border-gray-700/60 text-gray-500'
                  : 'bg-gradient-to-br from-amber-600/90 to-amber-700/90 text-amber-100 border-amber-500/35'
              }`}
            >
              {slot.isPulled ? (
                <span className="text-[7px] text-yellow-600/90 font-black">{slot.reward}</span>
              ) : (
                <span className="text-[8px] font-black">{slot.slotNumber}</span>
              )}
            </div>
          ))}
        </div>

        {/* 반투명 블랙 딤 레이어 (배경 불투명도 조절, 이전 40%에서 15%로 낮춰 배경이 훨씬 잘 보이게 함) */}
        <div className="absolute inset-0 bg-black/15 backdrop-blur-[0.5px] z-10 pointer-events-none" />

        {/* 아우라 빛 효과 (z-index: 15) */}
        <div className="absolute w-56 h-56 rounded-full bg-pink-500/10 blur-3xl z-15" style={{ transform: 'translate(-30px, -20px)' }} />
        <div className="absolute w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl z-15" style={{ transform: 'translate(30px, 20px)' }} />

        {/* 배경 레트로 그리드/도트 장식 (SVG, z-index: 15) */}
        <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none z-15" viewBox="0 0 400 400">
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="none" />
            <circle cx="10" cy="10" r="1" fill="#a855f7" />
          </pattern>
          <rect width="400" height="400" fill="url(#grid)" />
        </svg>

        {/* ═══ 하늘에서 내리는 듯한 풍성한 레트로 컨페티/폭죽 장식 (정적 SVG, z-index: 20) ═══ */}
        <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full select-none z-20 pointer-events-none overflow-visible">
          {/* 별 모양 파티클 (하늘에서 흩날림) */}
          <path d="M 40,30 L 43,36 L 49,37 L 44,41 L 45,47 L 40,43 L 35,47 L 36,41 L 31,37 L 37,36 Z" fill="#ff79c6" opacity="0.95" transform="rotate(15 40 38)" />
          <path d="M 350,50 L 353,56 L 359,57 L 354,61 L 355,67 L 350,63 L 345,67 L 346,61 L 341,57 L 347,56 Z" fill="#50fa7b" opacity="0.95" transform="rotate(-20 350 58)" />
          <path d="M 90,80 L 92,84 L 97,85 L 93,88 L 94,93 L 90,90 L 86,93 L 87,88 L 83,85 L 88,84 Z" fill="#ffb86c" opacity="0.9" transform="rotate(45 90 86)" />
          <path d="M 310,100 L 312,104 L 317,105 L 313,108 L 314,113 L 310,110 L 306,113 L 307,108 L 303,105 L 308,104 Z" fill="#8be9fd" opacity="0.9" transform="rotate(-10 310 106)" />
          <path d="M 50,180 L 52,184 L 57,185 L 53,188 L 54,193 L 50,190 L 46,193 L 47,188 L 43,185 L 48,184 Z" fill="#ff5555" opacity="0.85" transform="rotate(30 50 186)" />
          <path d="M 340,200 L 342,204 L 347,205 L 343,208 L 344,213 L 340,210 L 346,213 L 347,208 L 343,205 L 348,204 Z" fill="#f1fa8c" opacity="0.85" transform="rotate(-35 340 206)" />

          {/* 구부러진 스트리머 리본 조각 (하늘에서 흘러내림) */}
          <path d="M 75,15 Q 85,35 70,55 Q 55,75 75,95" fill="none" stroke="#bd93f9" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
          <path d="M 325,15 Q 310,35 330,55 Q 350,75 325,95" fill="none" stroke="#ff79c6" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
          <path d="M 25,120 Q 15,145 30,170 Q 45,195 25,220" fill="none" stroke="#50fa7b" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <path d="M 370,130 Q 385,160 365,190 Q 345,220 375,250" fill="none" stroke="#f1fa8c" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />

          {/* 둥글둥글 원형 꽃가루 */}
          <circle cx="80" cy="40" r="5" fill="#f1fa8c" opacity="0.9" />
          <circle cx="120" cy="25" r="4" fill="#ff79c6" opacity="0.9" />
          <circle cx="160" cy="45" r="6" fill="#8be9fd" opacity="0.9" />
          <circle cx="240" cy="30" r="5" fill="#50fa7b" opacity="0.9" />
          <circle cx="280" cy="50" r="4.5" fill="#ffb86c" opacity="0.9" />
          <circle cx="320" cy="35" r="5.5" fill="#ff5555" opacity="0.9" />
          
          <circle cx="60" cy="110" r="4" fill="#ffb86c" opacity="0.85" />
          <circle cx="110" cy="130" r="5" fill="#bd93f9" opacity="0.85" />
          <circle cx="140" cy="95" r="3.5" fill="#f1fa8c" opacity="0.85" />
          <circle cx="260" cy="115" r="5" fill="#ff79c6" opacity="0.85" />
          <circle cx="290" cy="85" r="4" fill="#8be9fd" opacity="0.85" />
          
          <circle cx="30" cy="250" r="5.5" fill="#50fa7b" opacity="0.8" />
          <circle cx="75" cy="230" r="4" fill="#ff5555" opacity="0.8" />
          <circle cx="325" cy="270" r="5" fill="#ffb86c" opacity="0.8" />
          <circle cx="365" cy="240" r="4.5" fill="#bd93f9" opacity="0.8" />

          {/* 사각형 및 흩날리는 색종이 조각들 (다양한 각도로 회전) */}
          <rect x="100" y="55" width="6" height="10" rx="1" fill="#bd93f9" opacity="0.9" transform="rotate(25 103 60)" />
          <rect x="290" y="60" width="8" height="6" rx="1" fill="#ff79c6" opacity="0.9" transform="rotate(-15 294 63)" />
          <rect x="145" y="140" width="7" height="7" rx="1.5" fill="#f1fa8c" opacity="0.85" transform="rotate(45 148.5 143.5)" />
          <rect x="235" y="150" width="6" height="9" rx="1" fill="#50fa7b" opacity="0.85" transform="rotate(75 238 154.5)" />
          <rect x="85" y="170" width="9" height="5" rx="1" fill="#8be9fd" opacity="0.85" transform="rotate(-30 89.5 172.5)" />
          <rect x="300" y="180" width="7" height="7" rx="1.5" fill="#ffb86c" opacity="0.85" transform="rotate(60 303.5 183.5)" />
          
          <rect x="50" y="300" width="8" height="8" rx="2" fill="#ff79c6" opacity="0.75" transform="rotate(15 54 304)" />
          <rect x="340" y="320" width="6" height="10" rx="1" fill="#8be9fd" opacity="0.75" transform="rotate(-45 343 325)" />
          <rect x="115" y="270" width="7" height="7" rx="1.5" fill="#ff5555" opacity="0.75" transform="rotate(120 118.5 273.5)" />
          <rect x="270" y="290" width="8" height="6" rx="1" fill="#f1fa8c" opacity="0.75" transform="rotate(-80 274 293)" />
        </svg>

        {/* ═══ 레트로 당첨 딱지 일러스트 (z-index: 25) ═══ */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 z-25 flex flex-col items-center justify-center"
          style={{
            top: '55px',
          }}
        >
          {/* 지그재그 톱니 바퀴 모양의 레트로 딱지 (SVG) */}
          <div className="relative w-44 h-44 flex items-center justify-center filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.85)]">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
              <circle cx="50" cy="50" r="48" fill="#140a22" stroke="#d97706" strokeWidth="2.5" />
              <g transform="translate(50,50)">
                {Array.from({ length: 36 }).map((_, i) => (
                  <path 
                    key={i} 
                    d="M -3,-45 L 3,-45 L 2,-49 L -2,-49 Z" 
                    fill="#f59e0b" 
                    transform={`rotate(${i * 10})`} 
                  />
                ))}
              </g>
              <circle cx="50" cy="50" r="41" fill="url(#retro-grad)" stroke="#140a22" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="36" fill="none" stroke="#d97706" strokeWidth="1.2" strokeDasharray="3, 2" opacity="0.8" />
              <defs>
                <linearGradient id="retro-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#ea580c" />
                  <stop offset="100%" stopColor="#b91c1c" />
                </linearGradient>
              </defs>
            </svg>

            {/* 딱지 내부 복고 인쇄풍 텍스트 */}
            <div className="absolute z-10 flex flex-col items-center justify-center text-center">
              <span 
                className="text-yellow-300 font-extrabold text-[15px] leading-tight tracking-wider"
                style={{
                  textShadow: '2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000',
                  letterSpacing: '0.15em'
                }}
              >
                당첨
              </span>
              <span 
                className="text-white font-black text-[24px] leading-tight mt-0.5"
                style={{
                  textShadow: '3px 3px 0px #140a22, -1px -1px 0px #140a22, 1px -1px 0px #140a22, -1px 1px 0px #140a22',
                }}
              >
                {rewardLabel}
              </span>
            </div>
            
            <div className="absolute inset-4 rounded-full border border-yellow-400/25 opacity-20 pointer-events-none" />
          </div>
        </div>

        {/* 스파클 네온 광원 장식 (z-index: 25) */}
        <div className="absolute z-25 top-[90px] left-[60px] w-2.5 h-2.5 bg-yellow-200 rounded-full blur-[2px] animate-pulse"></div>
        <div className="absolute z-25 top-[80px] right-[60px] w-2.5 h-2.5 bg-pink-200 rounded-full blur-[2px] animate-pulse"></div>
        
        {/* 축하 배너 카드 (z-index: 30) */}
        <BannerCard gameLabel="종이뽑기" rewardLabel={rewardLabel} className="z-[30] translate-y-[50px]" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// 라우터: ?type=luckybox|roulette|retro 에 따라 분기
// ═══════════════════════════════════════
function BannerRouter() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'roulette';
  const amountStr = searchParams.get('amount') || '100';
  const amount = parseInt(amountStr, 10);

  if (type === 'luckybox') {
    return <LuckyBoxBanner amount={amount} />;
  }
  if (type === 'retro') {
    return <RetroDrawBanner amount={amount} />;
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
