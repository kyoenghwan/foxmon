'use client';

import { useState, useEffect } from 'react';
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
  onPullSuccess: (rewardAmount: number, balanceAfter: number, updatedBoard: RetroBoard, isFree?: boolean) => void;
  onRefreshBoard: () => Promise<void>;
  isPostRewardAvailable?: boolean;
  isPlayedToday?: boolean;
}

export default function RetroDrawGame({
  board,
  activityPoints,
  onPullSuccess,
  onRefreshBoard,
  isPostRewardAvailable = false,
  isPlayedToday = false,
}: RetroDrawGameProps) {
  const [pullingSlot, setPullingSlot] = useState<number | null>(null);
  const [showConfirmSlot, setShowConfirmSlot] = useState<number | null>(null);
  const [result, setResult] = useState<{ amount: number; tier: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1초 주기로 실시간 보드판 상태를 동기화 (유저가 슬롯을 뜯고 있는 상태가 아닐 때만 백그라운드 갱신)
  useEffect(() => {
    let intervalId: any;
    if (pullingSlot === null && showConfirmSlot === null) {
      intervalId = setInterval(async () => {
        try {
          await onRefreshBoard();
        } catch (e) {
          console.error("자동 보드 갱신 에러:", e);
        }
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [onRefreshBoard, pullingSlot, showConfirmSlot]);

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshBoard();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 300);
    }
  };

  if (!board) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const handlePullSlotClick = (slotNumber: number) => {
    if (pullingSlot !== null) return;
    setError(null);
    setResult(null);

    const isFree = !isPlayedToday;
    const cost = isFree ? 0 : 200;

    // 포인트 검증
    if (activityPoints < cost) {
      setError(`포인트가 부족합니다. (뽑기 비용: ${cost}p)`);
      return;
    }

    if (isFree) {
      // 무료 기회는 팝업 없이 즉시 실행
      executePullSlot(slotNumber);
    } else {
      // 포인트가 소모될 때만 팝업 노출
      setShowConfirmSlot(slotNumber);
    }
  };

  const executePullSlot = async (slotNumber: number) => {
    setShowConfirmSlot(null);
    setPullingSlot(slotNumber);

    const isFree = !isPlayedToday;

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
         onPullSuccess(rewardAmount, balanceAfter, refreshJson.retroBoard, isFree);
        
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
    <div className="flex flex-col items-center justify-center p-4 bg-gray-900/60 rounded-3xl border border-gray-800 shadow-2xl w-full max-w-2xl mx-auto backdrop-blur-md">
      
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
      <div className="w-full flex flex-col md:flex-row justify-between items-center border-b border-gray-800 pb-2.5 mb-4 gap-2">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
             추억의 종이 뽑기판
            <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full font-bold">
              제 {board.boardRound}회차
            </span>
          </h2>
          <p className="text-gray-400 text-[11px] mt-0.5">
            원하는 슬롯을 눌러 딱지를 뜯어보세요. (동시 당첨 차단/실시간 연동 완료)
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-500 rounded-xl text-[11px] font-black border border-yellow-500/20">
            보유: {activityPoints.toLocaleString()}p
          </span>
          {isPlayedToday ? (
            <span className="px-2.5 py-1 bg-red-500/10 text-red-400 rounded-xl text-[11px] font-black border border-red-500/20">
              1회: 200p
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-xl text-[11px] font-black border border-emerald-500/20 animate-pulse">
              🎁 첫 회 무료!
            </span>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`h-7 px-2.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all active:scale-95 ${
              isRefreshing 
                ? 'bg-gray-800 border border-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-550 text-white shadow-md shadow-emerald-600/10'
            }`}
          >
            {isRefreshing ? (
              <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
            )}
            새로고침
          </button>
        </div>
      </div>

      {/* 알림 메시지 영역 */}
      <div className="w-full mb-2">
        {result && (
          <div className="space-y-2">
            <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center text-xs font-black text-yellow-400 animate-in fade-in slide-in-from-bottom-2 duration-300">
              🎁 당첨 결과: {getTierName(result.tier)}!
              {result.amount > 0 ? ` +${result.amount.toLocaleString()} 포인트 적립 완료!` : ' 아쉽게도 꽝입니다!'}
            </div>
            {result.amount > 0 && (
              <div className="text-center">
                <a
                  href={`/community?tab=free&write=true&category=놀이터 인증&title=${encodeURIComponent('추억의 종이뽑기 당첨 인증! 🥇')}&content=${encodeURIComponent(`여우들의 놀이터 [추억의 종이뽑기] 제 ${board.boardRound}회차에서 딱지를 뜯어 ${result.amount} 포인트를 획득했습니다! 🦊\n\n기 받아가세요!`)}&prefillImage=${encodeURIComponent('/images/playground/retrodraw_win_banner.png')}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer text-center"
                >
                  📝 당첨 인증글 쓰기{isPostRewardAvailable ? ' (+50p 적립)' : ''}
                </a>
              </div>
            )}
          </div>
        )}
        {error && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-center text-[11px] font-bold text-red-400">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* 10x10 격자 보드판 고정 */}
      <div 
        className="relative grid grid-cols-10 gap-1 w-full p-2 bg-amber-950/20 border border-amber-900/30 rounded-2xl shadow-inner"
      >
        {board.slots.map((slot) => {
          const isCurrentPulling = pullingSlot === slot.slotNumber;
          
          return (
            <button
              key={slot.id}
              onClick={() => !slot.isPulled && handlePullSlotClick(slot.slotNumber)}
              disabled={slot.isPulled || pullingSlot !== null || showConfirmSlot !== null}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-md border text-[8px] md:text-[9px] font-bold transition-all ${
                slot.isPulled
                  ? 'bg-gray-800/40 border-gray-800 text-gray-600 shadow-none cursor-default'
                  : 'bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-100 border-amber-400/30 hover:border-amber-300 shadow-md active:scale-95 hover:-translate-y-0.5'
              } ${isCurrentPulling ? 'rip-animation' : ''}`}
            >
              {slot.isPulled ? (
                <div className="flex flex-col items-center justify-center p-0.5 leading-tight">
                  <span className="text-[7px] md:text-[9px] font-black text-yellow-600/80">
                    {slot.rewardAmount && slot.rewardAmount > 0 ? `+${slot.rewardAmount}` : '꽝'}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center leading-none">
                  <span className="text-[6px] md:text-[7px] opacity-75 font-normal">No.</span>
                  <span className="text-[9px] md:text-xs font-black">{slot.slotNumber}</span>
                </div>
              )}

              {/* 뜯는 중 스피너 */}
              {isCurrentPulling && (
                <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-500" />
                </div>
              )}
            </button>
          );
        })}

        {/* 커스텀 확인 레이어 오버레이 */}
        {showConfirmSlot !== null && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex items-center justify-center p-4 z-30 animate-in zoom-in duration-300">
            <div className="flex flex-col items-center justify-center p-5 bg-gray-900/95 border border-gray-800 rounded-2xl max-w-xs w-full text-center shadow-2xl">
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-full mb-3">
                <HelpCircle className="w-8 h-8 animate-pulse text-purple-400" />
              </div>
              <h4 className="text-white text-xs font-black mb-1.5">딱지 뜯기</h4>
              <p className="text-gray-300 text-[11px] leading-relaxed mb-4">
                정말로 <span className="text-yellow-400 font-bold">{showConfirmSlot}번</span> 딱지를 뜯으시겠습니까?
                <br />
                {!isPlayedToday ? (
                  <span className="text-emerald-400 font-bold text-[10px] mt-1 block">[오늘 첫 뽑기: 무료 기회 제공]</span>
                ) : (
                  <span className="text-purple-400 font-bold text-[10px] mt-1 block">(200포인트가 소모됩니다.)</span>
                )}
              </p>
              <div className="flex gap-2 w-full justify-center">
                <button
                  onClick={() => executePullSlot(showConfirmSlot)}
                  className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-[11px] rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  뜯기
                </button>
                <button
                  onClick={() => setShowConfirmSlot(null)}
                  className="px-4 py-1.5 bg-gray-750 hover:bg-gray-700 text-gray-300 hover:text-white font-black text-[11px] rounded-xl transition-all active:scale-95 cursor-pointer border border-gray-700"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 보드 하단 등수 통계 안내 */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 w-full text-[11px] text-gray-400 border-t border-gray-800/50 pt-4">
        <div className="flex items-center gap-1.5 bg-gray-800/20 p-2 rounded-xl border border-gray-800/40">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>1등: 5,000p (1개)</span>
        </div>
        <div className="flex items-center gap-1.5 bg-gray-800/20 p-2 rounded-xl border border-gray-800/40">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>2~3등: 3,000p / 2,000p (각 1개)</span>
        </div>
        <div className="flex items-center gap-1.5 bg-gray-800/20 p-2 rounded-xl border border-gray-800/40">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>4~5등: 1,000p(2개) / 500p(5개)</span>
        </div>
        <div className="flex items-center gap-1.5 bg-gray-800/20 p-2 rounded-xl border border-gray-800/40">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          <span>6~8등: 100p / 50p / 10p (총 60개)</span>
        </div>
      </div>
    </div>
  );
}
