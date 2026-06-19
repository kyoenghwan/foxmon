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
    <div className="flex flex-col items-center justify-center p-4 bg-gray-900/60 rounded-3xl border border-gray-800 shadow-2xl max-w-md mx-auto relative overflow-hidden backdrop-blur-md">
      
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

      {/* 설명 및 포인트 안내 (상단 배치) */}
      <div className="text-center w-full mb-3 space-y-1.5 border-b border-gray-800 pb-3">
        <p className="text-gray-400 text-xs">
          매일 1회 무료! 이후 플레이 시 100p 차감 (상자 터치)
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

      {/* 선물 상자 그래픽 영역 (높이를 56으로 콤팩트화) */}
      <div className="relative w-full h-56 flex items-center justify-center">
        
        {/* 아우라 빛 효과 */}
        <div className={`absolute w-36 h-36 rounded-full bg-purple-500/20 blur-3xl transition-all duration-1000 ${
          status === 'shaking' ? 'scale-125 bg-pink-500/30' : status === 'opened' ? 'scale-150 bg-yellow-500/30' : ''
        }`} />

        {status === 'idle' && (
          <div className="flex flex-col items-center cursor-pointer group" onClick={handleOpenBox}>
            <div className="p-6 bg-purple-600 rounded-full border-4 border-purple-400 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-purple-500 hover:shadow-purple-500/20 active:scale-95">
              <Gift className="w-16 h-16 animate-pulse" />
            </div>
            <span className="text-purple-300 text-[11px] font-bold mt-3 tracking-wider uppercase group-hover:text-purple-200">
              상자를 눌러 열어보세요!
            </span>
          </div>
        )}

        {status === 'shaking' && (
          <div className="box-shake-animation flex flex-col items-center text-pink-400">
            <div className="p-6 bg-pink-600 rounded-full border-4 border-pink-400 text-white shadow-2xl">
              <Gift className="w-16 h-16" />
            </div>
            <span className="text-pink-300 text-[11px] font-black mt-3 tracking-widest animate-bounce">
              두구두구 흔들리는 중...
            </span>
          </div>
        )}

        {status === 'opened' && reward && (
          <div className="flex flex-col items-center animate-in zoom-in duration-500 leading-tight">
            {reward.amount > 0 ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-yellow-500/10 border-4 border-yellow-500 flex items-center justify-center text-yellow-500 text-2xl font-black shadow-lg shadow-yellow-500/20">
                  +{reward.amount}p
                </div>
                <h3 className="text-yellow-400 text-sm font-black mt-3">
                  보상 당첨!
                </h3>
                <p className="text-gray-300 text-xs font-semibold mt-1">
                  선물 상자에서 <span className="text-yellow-400 font-bold">{reward.label}</span>이 나왔습니다!
                </p>
                <div className="mt-3">
                  <a
                    href={`/community?tab=free&write=true&category=놀이터 인증&title=${encodeURIComponent('랜덤상자 대박 당첨 인증! 🎁')}&content=${encodeURIComponent(`여우들의 놀이터 [랜덤상자]에서 [${reward.label}]이(가) 당첨되어 ${reward.amount} 포인트를 획득했습니다! 🦊\n\n축하해주세요!`)}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    📝 당첨 인증글 쓰기 (+50p 적립)
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gray-700/50 border-4 border-gray-600 flex items-center justify-center text-gray-400 text-2xl font-black">
                  꽝
                </div>
                <h3 className="text-gray-400 text-sm font-black mt-3">
                  아쉽지만 다음 기회에!
                </h3>
                <p className="text-gray-300 text-xs mt-1">
                  빈 상자였습니다. 내일 새로운 상자에 도전하세요.
                </p>
              </div>
            )}
            
            <button
              onClick={resetBox}
              className="mt-3 text-xs text-purple-400 hover:text-purple-300 font-bold underline underline-offset-4"
            >
              다시 하기
            </button>
          </div>
        )}
      </div>

      {/* 조작 버튼 및 알림 피드백 (상자 그래픽 바로 아래 밀착 배치) */}
      {status !== 'opened' && (
        <div className="w-full mt-3 space-y-2">
          {error && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-center text-xs font-bold text-red-400">
              ⚠️ {error}
            </div>
          )}

          <Button
            onClick={handleOpenBox}
            disabled={status === 'shaking' || isLoading}
            className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-purple-600/20 transition-all active:scale-[0.98]"
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
