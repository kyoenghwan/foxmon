'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const SECTORS = [
  { amount: 10, label: '10p', color: '#3b82f6' },     // 파랑
  { amount: 30, label: '30p', color: '#ec4899' },     // 핑크
  { amount: 50, label: '50p', color: '#10b981' },     // 초록
  { amount: 100, label: '100p', color: '#f59e0b' },   // 노랑
  { amount: 500, label: '500p', color: '#8b5cf6' },   // 보라
  { amount: 1000, label: '1,000p', color: '#ef4444' }, // 빨강
];

function BannerRenderer() {
  const searchParams = useSearchParams();
  const amountStr = searchParams.get('amount') || '100';
  const amount = parseInt(amountStr, 10);

  const targetIndex = SECTORS.findIndex((s) => s.amount === amount);
  const sectorAngle = 360 / SECTORS.length; // 60
  
  // 12시 정렬 회전각 계산
  const targetAngle = 360 - (targetIndex * sectorAngle) - (sectorAngle / 2);
  const rewardLabel = amount.toLocaleString() + 'p';

  return (
    // 캡처 최상위 루트 아이디 부여
    <div id="capture-root" className="fixed inset-0 z-[999999] bg-[#090d16] flex items-center justify-center select-none overflow-hidden">
      
      {/* 바디 하위의 capture-root를 제외한 모든 형제 플로팅 엘리먼트/채널톡/톡톡 위젯을 강력하게 숨김 */}
      <style>{`
        body > *:not(#capture-root) {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        #channel-io-button, .ch-messenger, iframe, [id^="ch-"], [class^="ch-"], .kakao-channel, [class*="talk"], [id*="talk"] {
          display: none !important;
          visibility: hidden !important;
        }
        /* 글로벌 스크롤바 숨김 */
        body, html {
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
          background-color: #090d16 !important;
        }
      `}</style>

      {/* 400x400 크기의 정밀 캡처 타겟 영역 */}
      <div className="w-[400px] h-[400px] bg-[#090d16] relative flex items-center justify-center overflow-hidden">
        
        {/* 룰렛 상단 핀 데코레이션 */}
        <div className="absolute top-[15px] z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-red-500 filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.6)]"></div>

        {/* 룰렛 외부 고리 테두리 (지름 320px로 조절하여 400x400 내에 완벽 안착) */}
        <div className="relative w-[320px] h-[320px] rounded-full border-[8px] border-yellow-600/90 shadow-[0_0_35px_rgba(217,119,6,0.35)] bg-gray-950 flex items-center justify-center mt-3">
          
          {/* 룰렛 회전판 */}
          <div
            className="w-full h-full rounded-full relative overflow-hidden"
            style={{
              transform: `rotate(${targetAngle}deg)`,
              background: `conic-gradient(from 0deg, ${SECTORS.map(
                (s, i) => `${s.color} ${i * 60}deg ${(i + 1) * 60}deg`
              ).join(', ')})`,
            }}
          >
            {/* 부채꼴 라벨 텍스트 */}
            {SECTORS.map((sector, index) => {
              const angle = index * 60 + 30; // 부채꼴의 중앙각
              return (
                <div
                  key={index}
                  className="absolute top-0 left-0 w-full h-full flex justify-center items-start pt-7 origin-center"
                  style={{
                    transform: `rotate(${angle}deg)`,
                  }}
                >
                  <span className="text-white text-[13px] font-black tracking-tighter filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                    {sector.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 룰렛 중앙 START 버튼 비주얼 */}
          <div className="absolute w-18 h-18 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-750 border-[3px] border-yellow-250 flex flex-col items-center justify-center shadow-2xl z-10 opacity-70">
            <span className="text-[12px] text-gray-950 font-black tracking-tight">START</span>
          </div>
        </div>

        {/* 배너 뒤 황금색/보라색 원형 문양 서클 */}
        <div className="absolute z-10 w-[200px] h-[200px] rounded-full border-[5px] border-yellow-500/25 bg-gradient-to-br from-purple-950/60 via-transparent to-red-950/60 flex items-center justify-center">
          <div className="w-[160px] h-[160px] rounded-full border border-yellow-400/30 border-dashed"></div>
        </div>

        {/* 스파클링 광원 효과 데코레이션 */}
        <div className="absolute z-20 top-[160px] left-[60px] w-3 h-3 bg-yellow-200 rounded-full blur-[3px] animate-pulse"></div>
        <div className="absolute z-20 top-[260px] right-[60px] w-3 h-3 bg-yellow-200 rounded-full blur-[3px] animate-pulse"></div>

        {/* 🏆 당첨 축하 배너 카드 플레이트 (400 영역 내에 컴팩트하게 조절: 370x160) */}
        <div className="absolute z-30 w-[370px] h-[160px] rounded-2xl bg-gradient-to-br from-[#24123a] via-[#140a22] to-[#24123a] border-[3px] border-yellow-600/40 shadow-[0_12px_30px_rgba(0,0,0,0.85),_0_0_20px_rgba(217,119,6,0.2)] flex flex-col items-center justify-center p-3">
          
          {/* 금색 테두리 장식 프레임 (SVG) */}
          <div className="absolute inset-1.5 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <rect x="2" y="2" width="96" height="96" rx="4" fill="none" stroke="#eab308" strokeWidth="0.8" strokeOpacity="0.9" />
              <rect x="3.5" y="3.5" width="93" height="93" rx="3" fill="none" stroke="#d97706" strokeWidth="0.4" strokeOpacity="0.7" />
              
              {/* 좌상단 */}
              <path d="M 1 8 L 8 1 L 12 5 L 5 12 Z" fill="#d97706" />
              <path d="M 2 12 C 5 8, 8 5, 12 2" fill="none" stroke="#fef08a" strokeWidth="1" />
              <circle cx="6" cy="6" r="1" fill="#facc15" />
              {/* 우상단 */}
              <path d="M 99 8 L 92 1 L 88 5 L 95 12 Z" fill="#d97706" />
              <path d="M 98 12 C 95 8, 92 5, 88 2" fill="none" stroke="#fef08a" strokeWidth="1" />
              <circle cx="94" cy="6" r="1" fill="#facc15" />
              {/* 좌하단 */}
              <path d="M 1 92 L 8 99 L 12 95 L 5 88 Z" fill="#d97706" />
              <path d="M 2 88 C 5 92, 8 95, 12 98" fill="none" stroke="#fef08a" strokeWidth="1" />
              <circle cx="6" cy="94" r="1" fill="#facc15" />
              {/* 우하단 */}
              <path d="M 99 92 L 92 99 L 88 95 L 95 88 Z" fill="#d97706" />
              <path d="M 98 88 C 95 92, 92 95, 88 98" fill="none" stroke="#fef08a" strokeWidth="1" />
              <circle cx="94" cy="94" r="1" fill="#facc15" />
            </svg>
          </div>

          {/* 황금빛 그라데이션 장식 문양 배경 */}
          <div className="absolute top-1.5 w-10 h-5 flex items-center justify-center opacity-85">
            <svg className="w-full h-full text-yellow-400" viewBox="0 0 24 12" fill="currentColor">
              <path d="M12 2L9 6h6l-3-4zm0 8l3-4H9l3 4z" />
            </svg>
          </div>

          {/* 텍스트 내용 */}
          <div className="text-center mt-1 z-10 flex flex-col items-center">
            <h2 className="text-[20px] font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-amber-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              축하합니다!
            </h2>
            <div className="h-[1.5px] w-24 bg-gradient-to-r from-transparent via-yellow-400 to-transparent my-2 shadow-glow"></div>
            <h1 className="text-[25px] font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-300 to-amber-500 drop-shadow-[0_3px_5px_rgba(0,0,0,0.9)]">
              룰렛 {rewardLabel} 당첨!
            </h1>
          </div>
          
          {/* 하단 황금빛 장식 꼬리 */}
          <div className="absolute bottom-1.5 w-10 h-5 flex items-center justify-center opacity-85">
            <svg className="w-full h-full text-yellow-400" viewBox="0 0 24 12" fill="currentColor">
              <path d="M12 10L9 6h6l-3 4zm0-8l3 4H9l3-4z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RenderBannersPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <BannerRenderer />
    </Suspense>
  );
}
