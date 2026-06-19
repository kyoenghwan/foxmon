'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Hash } from 'lucide-react';

interface LottoGeneratorProps {
  isPlayedToday: boolean;
  activityPoints: number;
  onPlaySuccess: (rewardAmount: number, balanceAfter: number, playedTodayUpdate: boolean) => void;
}

// 로또 공 색상 맵 (실제 로또와 비슷하게 번호 대역별 색상 지정)
function getBallColorClass(num: number): string {
  if (num <= 10) return 'bg-yellow-500 text-yellow-950 border-yellow-300';
  if (num <= 20) return 'bg-blue-500 text-white border-blue-300';
  if (num <= 30) return 'bg-red-500 text-white border-red-300';
  if (num <= 40) return 'bg-gray-500 text-white border-gray-300';
  return 'bg-green-500 text-white border-green-300';
}

export default function LottoGenerator({ isPlayedToday, activityPoints, onPlaySuccess }: LottoGeneratorProps) {
  const [balls, setBalls] = useState<number[]>([]);
  const [visibleBalls, setVisibleBalls] = useState<number[]>([]);
  const [status, setStatus] = useState<'idle' | 'rolling' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (status === 'rolling' || isLoading) return;
    setError(null);
    setBalls([]);
    setVisibleBalls([]);

    // 포인트 검증
    if (isPlayedToday && activityPoints < 50) {
      setError('포인트가 부족합니다. (게임 비용: 50p)');
      return;
    }

    setIsLoading(true);
    setStatus('rolling');

    try {
      const res = await fetch('/api/game/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType: 'LOTTO' }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || '번호 생성 중 오류가 발생했습니다.');
      }

      const { lottoNumbers, rewardAmount, balanceAfter } = json.data;
      setBalls(lottoNumbers);

      // 공이 하나씩 순차적으로 팝업되는 모션 구현 (500ms 간격)
      let index = 0;
      const interval = setInterval(() => {
        if (index < lottoNumbers.length) {
          setVisibleBalls((prev) => [...prev, lottoNumbers[index]]);
          index++;
        } else {
          clearInterval(interval);
          setStatus('done');
          setIsLoading(false);
          onPlaySuccess(rewardAmount, balanceAfter, true);
        }
      }, 500);

    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
      setStatus('idle');
      setIsLoading(false);
    }
  };

  const resetGame = () => {
    setStatus('idle');
    setBalls([]);
    setVisibleBalls([]);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-900/60 rounded-3xl border border-gray-800 shadow-2xl max-w-md mx-auto relative overflow-hidden backdrop-blur-md">
      
      {/* 믹싱 드럼 내부 공들 굴러가는 모션 스타일 주입 */}
      <style jsx global>{`
        @keyframes roll-balls {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(10px, -15px) rotate(90deg); }
          50% { transform: translate(-10px, 15px) rotate(180deg); }
          75% { transform: translate(15px, 10px) rotate(270deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
        .rolling-ball-animation {
          animation: roll-balls 0.6s infinite ease-in-out;
        }
      `}</style>

      {/* 믹서기 드럼 영역 */}
      <div className="relative w-80 h-44 rounded-2xl border-2 border-gray-800 bg-gray-950/80 flex items-center justify-center overflow-hidden shadow-inner mt-4">
        {status === 'rolling' && visibleBalls.length < balls.length ? (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="w-10 h-10 rounded-full border-2 bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md rolling-ball-animation"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                ?
              </div>
            ))}
          </div>
        ) : status === 'done' || visibleBalls.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-3.5 px-4">
            {visibleBalls.map((num, idx) => (
              <div
                key={idx}
                className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-black text-sm shadow-lg scale-in-animation animate-in zoom-in spin-in-12 duration-300 ${getBallColorClass(num)}`}
              >
                {num}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center text-gray-500">
            <Hash className="w-12 h-12 text-purple-600/40 animate-pulse mb-2" />
            <span className="text-xs font-semibold tracking-wider text-gray-400">
              오늘의 행운번호 6개를 받아보세요!
            </span>
          </div>
        )}
      </div>

      {/* 포인트 및 보상 안내 */}
      <div className="text-center mt-6 space-y-2">
        <p className="text-gray-400 text-xs">
          매일 1회 무료 번호 생성! 이후 50포인트가 차감됩니다. (기본 +10p 적립)
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-xs font-bold border border-yellow-500/20">
            보유: {activityPoints.toLocaleString()}p
          </span>
          <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-bold border border-purple-500/20">
            비용: {isPlayedToday ? '50p' : '무료'}
          </span>
        </div>
      </div>

      {/* 조작 버튼 및 결과 메시지 */}
      <div className="w-full mt-6 space-y-4">
        {status === 'done' && (
          <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-center text-xs font-black text-yellow-400">
            🎉 번호 생성 보너스로 <span className="font-bold">10 포인트</span>가 자동 적립되었습니다!
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-center text-xs font-bold text-red-400">
            ⚠️ {error}
          </div>
        )}

        {status === 'done' ? (
          <Button
            onClick={resetGame}
            className="w-full h-12 bg-gray-800 hover:bg-gray-700 text-white font-black text-sm rounded-2xl transition-all"
          >
            다시 번호 뽑기
          </Button>
        ) : (
          <Button
            onClick={handleGenerate}
            disabled={status === 'rolling' || isLoading}
            className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-600/20 transition-all active:scale-[0.98]"
          >
            {status === 'rolling' ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                로또 공 섞는 중...
              </span>
            ) : isPlayedToday ? (
              '50p로 번호 발급받기'
            ) : (
              '오늘의 무료 행운번호 받기!'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
