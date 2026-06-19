'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, HelpCircle } from 'lucide-react';

interface RetroSlot {
  id: string;
  slotNumber: number;
  isPulled: boolean;
  rewardAmount?: number;
  rewardTier?: number;
  userNickname?: string;
}

interface RetroBoard {
  boardRound: number;
  isCompleted: boolean;
  slots: RetroSlot[];
}

interface RetroDrawGameProps {
  board: RetroBoard | null;
  activityPoints: number;
  onPullSuccess: (rewardAmount: number, balanceAfter: number, updatedBoard: RetroBoard) => void;
  onRefreshBoard: () => Promise<void>;
}

export default function RetroDrawGame({ board, activityPoints, onPullSuccess, onRefreshBoard }: RetroDrawGameProps) {
  const [pullingSlot, setPullingSlot] = useState<number | null>(null);
  const [result, setResult] = useState<{ amount: number; tier: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!board) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const handlePullSlot = async (slotNumber: number) => {
    if (pullingSlot !== null) return;
    setError(null);
    setResult(null);

    // 포인트 검증 (1회 200p)
    if (activityPoints < 200) {
      setError('포인트가 부족합니다. (뽑기 비용: 200p)');
      return;
    }

    const confirmPull = confirm(`정말로 ${slotNumber}번 딱지를 뜯으시겠습니까?\n200포인트가 소모됩니다.`);
    if (!confirmPull) return;

    setPullingSlot(slotNumber);

    try {
      const res = await fetch('/api/game/retro-pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardRound: board.boardRound,
          slotNumber,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || '뽑기 진행 중 오류가 발생했습니다.');
      }

      const { rewardAmount, rewardTier, newBoardOpened, balanceAfter } = json.data;
      setResult({ amount: rewardAmount, tier: rewardTier });

      // 최신 보드판 정보 다시 가져오기
      const refreshRes = await fetch('/api/game/status');
      const refreshJson = await refreshRes.json();
      
      if (refreshJson.success && refreshJson.retroBoard) {
        onPullSuccess(rewardAmount, balanceAfter, refreshJson.retroBoard);
        
        if (newBoardOpened) {
          alert('🎉 대단합니다! 마지막 딱지를 뜯으셨습니다. 새로운 100개 뽑기판이 개설되었습니다!');
        }
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setPullingSlot(null);
    }
  };

  const getTierName = (tier: number): string => {
    if (tier === 1) return '🥇 1등 (5,000p)';
    if (tier === 2) return '🥈 2등 (3,000p)';
    if (tier === 3) return '🥉 3등 (2,000p)';
    if (tier === 4) return '4등 (1,000p)';
    if (tier === 5) return '5등 (500p)';
    if (tier === 6) return '6등 (100p)';
    if (tier === 7) return '7등 (50p)';
    if (tier === 8) return '8등 (10p)';
    return '꽝 (0p)';
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-900/60 rounded-3xl border border-gray-800 shadow-2xl w-full max-w-4xl mx-auto backdrop-blur-md">
      
      {/* 뜯기 찌리릭 및 흔들림 애니메이션 CSS 주입 */}
      <style jsx global>{`
        @keyframes slot-rip {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1) rotate(5deg); filter: brightness(1.2); }
          100% { transform: scale(0); opacity: 0; }
        }
        .rip-animation {
          animation: slot-rip 0.5s forwards ease-in-out;
        }
      `}</style>

      {/* 헤더 정보 */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center border-b border-gray-800 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
             추억의 종이 뽑기판
            <span className="text-xs px-2.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full font-bold">
              제 {board.boardRound}회차
            </span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            원하는 슬롯을 눌러 딱지를 뜯어보세요. F12 개발자도구를 통한 보상 유출이 불가능하도록 보안 마스킹되어 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="px-3 py-1.5 bg-yellow-500/10 text-yellow-500 rounded-2xl text-xs font-black border border-yellow-500/20">
            보유: {activityPoints.toLocaleString()}p
          </span>
          <span className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-2xl text-xs font-black border border-red-500/20">
            1회 비용: 200p
          </span>
          <Button onClick={onRefreshBoard} size="sm" variant="outline" className="h-8 rounded-xl font-bold text-xs bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
            새로고침
          </Button>
        </div>
      </div>

      {/* 알림 메시지 영역 */}
      <div className="w-full mb-4">
        {result && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-center text-sm font-black text-yellow-400 animate-in fade-in slide-in-from-bottom-2 duration-300">
            🎁 당첨 결과: {getTierName(result.tier)}!
            {result.amount > 0 ? ` +${result.amount.toLocaleString()} 포인트 적립 완료!` : ' 아쉽게도 꽝입니다!'}
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-center text-xs font-bold text-red-400">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* 10x10 격자 보드판 */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 w-full p-4 bg-amber-950/20 border border-amber-900/30 rounded-2xl shadow-inner">
        {board.slots.map((slot) => {
          const isCurrentPulling = pullingSlot === slot.slotNumber;
          
          return (
            <button
              key={slot.id}
              onClick={() => !slot.isPulled && handlePullSlot(slot.slotNumber)}
              disabled={slot.isPulled || pullingSlot !== null}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-lg border-2 text-xs font-bold transition-all ${
                slot.isPulled
                  ? 'bg-gray-800/40 border-gray-800 text-gray-600 shadow-none cursor-default'
                  : 'bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-100 border-amber-400/30 hover:border-amber-300 shadow-md active:scale-95 hover:-translate-y-0.5'
              } ${isCurrentPulling ? 'rip-animation' : ''}`}
            >
              {slot.isPulled ? (
                <div className="flex flex-col items-center justify-center p-0.5 scale-90">
                  <span className="text-[10px] text-gray-500 truncate max-w-full">
                    {slot.userNickname}
                  </span>
                  <span className="text-[9px] font-black text-yellow-600/70 mt-0.5">
                    {slot.rewardAmount && slot.rewardAmount > 0 ? `+${slot.rewardAmount}p` : '꽝'}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] opacity-75 font-normal">No.</span>
                  <span className="text-sm font-black">{slot.slotNumber}</span>
                </div>
              )}

              {/* 뜯는 중 스피너 */}
              {isCurrentPulling && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 보드 하단 등수 통계 안내 */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 w-full text-xs text-gray-400 border-t border-gray-800 pt-6">
        <div className="flex items-center gap-2 bg-gray-800/20 p-2.5 rounded-xl border border-gray-800/40">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span>1등: 5,000p (1개)</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-800/20 p-2.5 rounded-xl border border-gray-800/40">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>2~3등: 3,000p / 2,000p (각 1개)</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-800/20 p-2.5 rounded-xl border border-gray-800/40">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>4~5등: 1,000p(2개) / 500p(5개)</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-800/20 p-2.5 rounded-xl border border-gray-800/40">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
          <span>6~8등: 100p / 50p / 10p (총 60개)</span>
        </div>
      </div>
    </div>
  );
}
