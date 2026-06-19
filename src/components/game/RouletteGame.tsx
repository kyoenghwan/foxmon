'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCw } from 'lucide-react';

interface RouletteGameProps {
  isPlayedToday: boolean;
  activityPoints: number;
  onPlaySuccess: (rewardAmount: number, balanceAfter: number, playedTodayUpdate: boolean) => void;
}

const SECTORS = [
  { amount: 0, label: '꽝', color: '#374151' },       // 회색
  { amount: 10, label: '10p', color: '#3b82f6' },     // 파랑
  { amount: 50, label: '50p', color: '#10b981' },     // 초록
  { amount: 100, label: '100p', color: '#f59e0b' },   // 노랑
  { amount: 500, label: '500p', color: '#8b5cf6' },   // 보라
  { amount: 1000, label: '1,000p', color: '#ef4444' }, // 빨강
];

export default function RouletteGame({ isPlayedToday, activityPoints, onPlaySuccess }: RouletteGameProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [lastRewardAmount, setLastRewardAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rouletteRef = useRef<HTMLDivElement>(null);
  const currentRotation = useRef(0);

  const handleSpin = async () => {
    if (isSpinning) return;
    setError(null);
    setResultMessage(null);

    // 포인트 검증 (오늘 참여 안 했으면 무료, 했으면 100p 소모)
    if (isPlayedToday && activityPoints < 100) {
      setError('포인트가 부족합니다. (게임 비용: 100p)');
      return;
    }

    setIsSpinning(true);

    try {
      const res = await fetch('/api/game/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType: 'ROULETTE' }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || '게임 진행 중 오류가 발생했습니다.');
      }

      const { rewardAmount, balanceAfter } = json.data;

      // 룰렛 회전 애니메이션 계산
      // 당첨된 보상의 인덱스 찾기
      const targetIndex = SECTORS.findIndex((s) => s.amount === rewardAmount);
      const sectorAngle = 360 / SECTORS.length;

      // 타겟 각도: 중앙 핀에 맞추기 위해 보정
      // 중앙 핀이 12시 방향(270도 혹은 90도)에 있다고 가정할 때의 인덱스 매핑 계산
      // 룰렛 판 회전 시, 각도 = 360 - (targetIndex * sectorAngle) - (sectorAngle / 2)
      // 최소 5바퀴(1800도) 이상 회전하도록 추가 회전각 부여
      const baseRotation = 3600; 
      const targetAngle = 360 - (targetIndex * sectorAngle) - (sectorAngle / 2);
      const nextRotation = currentRotation.current + baseRotation + targetAngle - (currentRotation.current % 360);
      currentRotation.current = nextRotation;

      if (rouletteRef.current) {
        rouletteRef.current.style.transition = 'transform 4s cubic-bezier(0.1, 0.8, 0.1, 1)';
        rouletteRef.current.style.transform = `rotate(${nextRotation}deg)`;
      }

      // 애니메이션 완료 대기 (4초)
      setTimeout(() => {
        setIsSpinning(false);
        if (rewardAmount > 0) {
          setResultMessage(`🎉 축하합니다! ${rewardAmount.toLocaleString()} 포인트를 획득하셨습니다!`);
          setLastRewardAmount(rewardAmount);
        } else {
          setResultMessage('😢 아쉽게도 꽝입니다! 내일 다시 도전해 보세요.');
          setLastRewardAmount(null);
        }
        onPlaySuccess(rewardAmount, balanceAfter, true);
      }, 4000);

    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
      setIsSpinning(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-900/60 rounded-3xl border border-gray-800 shadow-2xl max-w-md mx-auto relative overflow-hidden backdrop-blur-md">
      {/* 룰렛 상단 핀 데코레이션 */}
      <div className="absolute top-8 z-10 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-red-500 filter drop-shadow-md"></div>

      {/* 룰렛 외부 고리 테두리 */}
      <div className="relative w-80 h-80 rounded-full border-8 border-yellow-500/80 shadow-[0_0_30px_rgba(234,179,8,0.3)] bg-gray-950 flex items-center justify-center mt-6">
        
        {/* 룰렛 회전판 */}
        <div
          ref={rouletteRef}
          className="w-full h-full rounded-full relative overflow-hidden transition-transform duration-[4000ms]"
          style={{
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
                className="absolute top-0 left-0 w-full h-full flex justify-center items-start pt-6 origin-center select-none"
                style={{
                  transform: `rotate(${angle}deg)`,
                }}
              >
                <span className="text-white text-sm font-black tracking-tighter filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {sector.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* 룰렛 정중앙 클릭 버튼 (START) */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-4 border-yellow-200 flex flex-col items-center justify-center shadow-2xl z-20 cursor-pointer active:scale-90 hover:from-yellow-300 hover:to-yellow-500 transition-all select-none group"
          title="룰렛 돌리기"
        >
          {isSpinning ? (
            <Loader2 className="w-6 h-6 animate-spin text-gray-950" />
          ) : (
            <div className="flex flex-col items-center justify-center leading-none text-gray-950 font-black">
              <span className="text-[14px] tracking-tight uppercase group-hover:scale-110 transition-transform">START</span>
              <span className="text-[9px] mt-0.5 opacity-80">
                {isPlayedToday ? '100p' : '무료'}
              </span>
            </div>
          )}
        </button>
      </div>

      {/* 설명 및 포인트 안내 */}
      <div className="text-center mt-4 space-y-1.5">
        <p className="text-gray-400 text-xs">
          매일 1회 무료! 이후 플레이 시 100p 차감 (중앙 START 터치)
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-500 rounded-xl text-xs font-bold border border-yellow-500/20">
            보유: {activityPoints.toLocaleString()}p
          </span>
          <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 rounded-xl text-xs font-bold border border-purple-500/20">
            비용: {isPlayedToday ? '100p' : '무료'}
          </span>
        </div>
      </div>

      {/* 조작 및 메시지 영역 */}
      <div className="w-full mt-4 space-y-3">
        {resultMessage && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-center text-xs font-black text-yellow-400 animate-bounce">
            {resultMessage}
          </div>
        )}

        {resultMessage && lastRewardAmount && lastRewardAmount > 0 && (
          <div className="text-center mt-1">
            <a
              href={`/community?tab=free&write=true&category=놀이터 인증&title=${encodeURIComponent('회전 룰렛 당첨 인증합니다! 🎉')}&content=${encodeURIComponent(`여우들의 놀이터 [회전 룰렛]에서 ${lastRewardAmount} 포인트를 획득했습니다! 🦊\n\n모두 기 받아가세요!`)}`}
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer text-center"
            >
              📝 당첨 인증글 쓰기 (+50p 적립)
            </a>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-center text-xs font-bold text-red-400">
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
}
