'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Gift } from 'lucide-react';
import { createCommunityPost } from '@/lib/actions/community';

interface LuckyBoxGameProps {
  isPlayedToday: boolean;
  activityPoints: number;
  onPlaySuccess: (rewardAmount: number, balanceAfter: number, playedTodayUpdate: boolean) => void;
  isPostRewardAvailable?: boolean;
}

export default function LuckyBoxGame({
  isPlayedToday,
  activityPoints,
  onPlaySuccess,
  isPostRewardAvailable = false,
}: LuckyBoxGameProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'shaking' | 'opened'>('idle');
  const [showConfirm, setShowConfirm] = useState(false);
  const [reward, setReward] = useState<{ amount: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 인증글 모달 관련 상태
  const [showCertModal, setShowCertModal] = useState(false);
  const [certTitle, setCertTitle] = useState('');
  const [certContent, setCertContent] = useState('');
  const [isCertSubmitting, setIsCertSubmitting] = useState(false);

  const handleOpenCertModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setCertTitle('랜덤상자 대박 당첨 인증합니다! 🎁');
    setCertContent(`여우들의 놀이터 [랜덤상자]에서 [${reward?.label}]이(가) 당첨되어 ${reward?.amount} 포인트를 획득했습니다! 🦊\n\n축하해주세요!`);
    setShowCertModal(true);
  };

  const handleRegisterCert = async () => {
    if (!certTitle.trim() || !certContent.trim()) {
      alert('제목과 내용을 모두 입력해 주세요.');
      return;
    }
    setIsCertSubmitting(true);
    try {
      const bannerImg = '/images/playground/luckybox_win_banner.png';
      const res = await createCommunityPost({
        board_id: 'free',
        title: `[놀이터 인증] ${certTitle.trim()}`,
        content: certContent.trim(),
        thumbnail: bannerImg,
        detail_images: [bannerImg]
      });

      if (res.success) {
        alert('당첨 인증글이 자유게시판에 등록되었습니다! (+50p 적립 완료)');
        setShowCertModal(false);
        resetBox();
      } else {
        alert(res.message || '인증글 등록에 실패했습니다.');
      }
    } catch (err) {
      alert('인증글 등록 중 오류가 발생했습니다.');
    } finally {
      setIsCertSubmitting(false);
    }
  };

  const handleOpenBox = () => {
    if (status === 'shaking' || isLoading) return;
    setError(null);

    // 포인트 검증
    if (isPlayedToday) {
      if (activityPoints < 100) {
        setError('포인트가 부족합니다. (게임 비용: 100p)');
        return;
      }
      // 포인트가 소모될 때만 팝업 노출
      setShowConfirm(true);
    } else {
      // 무료 기회인 경우 팝업 없이 즉시 실행
      executeOpenBox();
    }
  };

  const executeOpenBox = async () => {
    setShowConfirm(false);
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

  const resetBox = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setStatus('idle');
    setShowConfirm(false);
    setReward(null);
    setError(null);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-900/60 rounded-3xl border border-gray-800 shadow-2xl max-w-2xl w-full mx-auto relative overflow-hidden backdrop-blur-md">
      
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

      {/* 선물 상자 그래픽 영역 (유연한 최소 높이 설정) */}
      <div className="relative w-full min-h-[14rem] h-auto py-4 flex items-center justify-center">
        
        {/* 아우라 빛 효과 */}
        <div className={`absolute w-36 h-36 rounded-full bg-purple-500/20 blur-3xl transition-all duration-1000 ${
          status === 'shaking' ? 'scale-125 bg-pink-500/30' : status === 'opened' ? 'scale-150 bg-yellow-500/30' : ''
        }`} />

        {showConfirm && (
          <div className="flex flex-col items-center justify-center p-5 bg-gray-800/90 border border-gray-700/60 rounded-2xl max-w-xs w-full mx-auto text-center animate-in zoom-in duration-300 shadow-2xl relative z-20">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-full mb-3">
              <Gift className="w-8 h-8 animate-pulse" />
            </div>
            <h4 className="text-white text-xs font-black mb-1.5">랜덤상자 개봉</h4>
            <p className="text-gray-300 text-[11px] leading-relaxed mb-4">
              {isPlayedToday ? (
                <>
                  <span className="text-purple-400 font-bold">100 포인트</span>를 사용하여<br />랜덤상자를 여시겠습니까?
                </>
              ) : (
                <>
                  오늘 첫 상자 개봉은 <span className="text-emerald-400 font-bold">무료</span>입니다.<br />상자를 여시겠습니까?
                </>
              )}
            </p>
            <div className="flex gap-2 w-full justify-center">
              <button
                onClick={executeOpenBox}
                className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-[11px] rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                열기
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-1.5 bg-gray-700 hover:bg-gray-650 text-gray-300 hover:text-white font-black text-[11px] rounded-xl transition-all active:scale-95 cursor-pointer border border-gray-650"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {status === 'idle' && !showConfirm && (
          <div className="flex flex-col items-center cursor-pointer group" onClick={handleOpenBox}>
            <div className="p-6 bg-purple-600 rounded-full border-4 border-purple-400 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-purple-500 hover:shadow-purple-500/20 active:scale-95">
              <Gift className="w-16 h-16 animate-pulse" />
            </div>
            <span className="text-purple-300 text-[11px] font-black mt-3 tracking-wider group-hover:text-purple-200">
              상자를 눌러 열어보세요! {isPlayedToday ? '(100p 차감)' : '(무료)'}
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
                  <button
                    onClick={handleOpenCertModal}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    📝 당첨 인증글 쓰기{isPostRewardAvailable ? ' (+50p 적립)' : ''}
                  </button>
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
              onClick={(e) => resetBox(e)}
              className="mt-4 text-xs text-purple-400 hover:text-purple-300 font-bold underline underline-offset-4 relative z-30 cursor-pointer"
            >
              다시 하기
            </button>
          </div>
        )}
      </div>

      {/* 조작 피드백 (상자 그래픽 바로 아래 밀착 배치) */}
      {status !== 'opened' && error && (
        <div className="w-full mt-3">
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-center text-xs font-bold text-red-400 animate-in fade-in duration-300">
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* 설명 및 포인트 안내 (하단 배치) */}
      <div className="text-center w-full mt-4 pt-4 border-t border-gray-800 space-y-1.5">
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

      {/* 당첨 인증글 직접 작성 팝업 오버레이 */}
      {showCertModal && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md rounded-3xl flex flex-col justify-center p-6 z-40 animate-in zoom-in duration-305">
          <h4 className="text-white text-sm font-black mb-3 text-center border-b border-gray-800/60 pb-2">
            🏆 놀이터 당첨 인증글 작성
          </h4>
          <div className="space-y-3.5 flex-1 flex flex-col justify-center text-left">
            {/* 자동 첨부 이미지 미리보기 */}
            <div>
              <span className="text-[10px] text-gray-500 font-bold mb-1 block">자동 첨부 이미지</span>
              <div className="w-full h-28 rounded-xl overflow-hidden border border-gray-800 bg-gray-950 flex items-center justify-center">
                <img src="/images/playground/luckybox_win_banner.png" alt="인증 배너" className="max-w-full max-h-full object-contain" />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 font-bold mb-1 block">제목</label>
              <input
                type="text"
                value={certTitle}
                onChange={(e) => setCertTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="w-full px-3.5 py-2.5 bg-gray-800/80 border border-gray-700/60 rounded-xl text-xs font-bold text-white outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="flex-1 flex flex-col min-h-[100px]">
              <label className="text-[10px] text-gray-500 font-bold mb-1 block">내용</label>
              <textarea
                value={certContent}
                onChange={(e) => setCertContent(e.target.value)}
                placeholder="내용을 입력하세요"
                className="w-full flex-1 p-3.5 bg-gray-800/80 border border-gray-700/60 rounded-xl text-xs font-medium text-gray-200 outline-none focus:border-purple-500 transition-colors resize-none leading-relaxed"
              />
            </div>

            <div className="flex gap-2 w-full justify-center pt-2">
              <button
                onClick={handleRegisterCert}
                disabled={isCertSubmitting}
                className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isCertSubmitting ? '등록 중...' : '등록하기'}
              </button>
              <button
                onClick={() => setShowCertModal(false)}
                disabled={isCertSubmitting}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-650 text-gray-300 hover:text-white font-black text-xs rounded-xl transition-all active:scale-95 cursor-pointer border border-gray-650 disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
