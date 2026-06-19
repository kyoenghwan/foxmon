'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Gift } from 'lucide-react';

interface LuckyBoxGameProps {
  isPlayedToday: boolean;
  activityPoints: number;
  onPlaySuccess: (rewardAmount: number, balanceAfter: number, playedTodayUpdate: boolean) => void;
}

export default function LuckyBoxGame({ isPlayedToday, activityPoints, onPlaySuccess }: LuckyBoxGameProps) {
  const [status, setStatus] = useState<'idle' | 'shaking' | 'opened'>('idle');
  const [reward, setReward] = useState<{ amount: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenBox = async () => {
    if (status === 'shaking' || isLoading) return;
    setError(null);

    // 포인트 검증
    if (isPlayedToday && activityPoints < 100) {
      setError('포인트가 부족합니다. (게임 비용: 100p)');
      return;
    }

    setIsLoading(true);
    setStatus('shaking');

    try {
      const res = await fetch('/api/game/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType: 'LUCKY_BOX' }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || '게임 진행 중 오류가 발생했습니다.');
      }

      const { rewardAmount, label, balanceAfter } = json.data;

      // 2초 동안 흔들리는 모션 유지 후 상자 개봉
      setTimeout(() => {
        setStatus('opened');
        setReward({ amount: rewardAmount, label });
        setIsLoading(false);
        onPlaySuccess(rewardAmount, balanceAfter, true);
      }, 2000);

    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
      setStatus('idle');
      setIsLoading(false);
    }
  };

  const resetBox = () => {
    setStatus('idle');
    setReward(null);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-900/60 rounded-3xl border border-gray-800 shadow-2xl max-w-md mx-auto relative overflow-hidden backdrop-blur-md">
      
      {/* 커스텀 흔들림(shake) 애니메이션 스타일 주입 */}
      <style jsx global>{`
        @keyframes box-shake {
          0% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-3px, 2px) rotate(-3deg); }
          20% { transform: translate(3px, -2px) rotate(3deg); }
          30% { transform: translate(-2px, -1px) rotate(-1.5deg); }
          40% { transform: translate(2px, 2px) rotate(1.5deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(1px, -1px) rotate(1deg); }
          70% { transform: translate(-3px, 1px) rotate(-3deg); }
          80% { transform: translate(2px, 2px) rotate(3deg); }
          90% { transform: translate(-1px, -2px) rotate(-1.5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        .box-shake-animation {
          animation: box-shake 0.5s infinite;
        }
      `}</style>

      {/* 선물 상자 그래픽 영역 */}
      <div className="relative w-72 h-64 flex items-center justify-center">
        
        {/* 아우라 빛 효과 */}
        <div className={`absolute w-44 h-44 rounded-full bg-purple-500/20 blur-3xl transition-all duration-1000 ${
          status === 'shaking' ? 'scale-125 bg-pink-500/30' : status === 'opened' ? 'scale-150 bg-yellow-500/30' : ''
        }`} />

        {status === 'idle' && (
          <div className="flex flex-col items-center cursor-pointer group" onClick={handleOpenBox}>
            <div className="p-8 bg-purple-600 rounded-full border-4 border-purple-400 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-purple-500 hover:shadow-purple-500/20 active:scale-95">
              <Gift className="w-20 h-20 animate-pulse" />
            </div>
            <span className="text-purple-300 text-xs font-bold mt-4 tracking-wider uppercase group-hover:text-purple-200">
              상자를 눌러 열어보세요!
            </span>
          </div>
        )}

        {status === 'shaking' && (
          <div className="box-shake-animation flex flex-col items-center text-pink-400">
            <div className="p-8 bg-pink-600 rounded-full border-4 border-pink-400 text-white shadow-2xl">
              <Gift className="w-20 h-20" />
            </div>
            <span className="text-pink-300 text-xs font-black mt-4 tracking-widest animate-bounce">
              두구두구 흔들리는 중...
            </span>
          </div>
        )}

        {status === 'opened' && reward && (
          <div className="flex flex-col items-center animate-in zoom-in duration-500">
            {reward.amount > 0 ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-yellow-500/10 border-4 border-yellow-500 flex items-center justify-center text-yellow-500 text-3xl font-black shadow-lg shadow-yellow-500/20">
                  +{reward.amount}p
                </div>
                <h3 className="text-yellow-400 text-lg font-black mt-4">
                  보상 당첨!
                </h3>
                <p className="text-gray-300 text-sm font-semibold mt-1">
                  선물 상자에서 <span className="text-yellow-400 font-bold">{reward.label}</span>이 나왔습니다!
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-gray-700/50 border-4 border-gray-600 flex items-center justify-center text-gray-400 text-3xl font-black">
                  꽝
                </div>
                <h3 className="text-gray-400 text-lg font-black mt-4">
                  아쉽지만 다음 기회에!
                </h3>
                <p className="text-gray-300 text-xs mt-1">
                  빈 상자였습니다. 내일 새로운 상자에 도전하세요.
                </p>
              </div>
            )}
            
            <button
              onClick={resetBox}
              className="mt-6 text-xs text-purple-400 hover:text-purple-300 font-bold underline underline-offset-4"
            >
              다시 하기
            </button>
          </div>
        )}
      </div>

      {/* 설명 및 포인트 안내 */}
      <div className="text-center mt-6 space-y-2">
        <p className="text-gray-400 text-xs">
          매일 1회 무료 플레이! 이후 플레이 시 100포인트가 차감됩니다.
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-xs font-bold border border-yellow-500/20">
            보유: {activityPoints.toLocaleString()}p
          </span>
          <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-bold border border-purple-500/20">
            비용: {isPlayedToday ? '100p' : '무료'}
          </span>
        </div>
      </div>

      {/* 조작 버튼 */}
      {status !== 'opened' && (
        <div className="w-full mt-6">
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-center text-xs font-bold text-red-400 mb-4">
              ⚠️ {error}
            </div>
          )}

          <Button
            onClick={handleOpenBox}
            disabled={status === 'shaking' || isLoading}
            className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-600/20 transition-all active:scale-[0.98]"
          >
            {status === 'shaking' ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                상자 여는 중...
              </span>
            ) : isPlayedToday ? (
              '100p로 랜덤상자 열기'
            ) : (
              '오늘의 무료 상자 열기!'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
