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
      
      {/* 커스텀 애니메이션 스타일 주입 */}
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
        @keyframes box-float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        .box-float-animation {
          animation: box-float 3s ease-in-out infinite;
        }
        @keyframes sparkle-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .sparkle-effect {
          transform-origin: 100px 95px;
          animation: sparkle-rotate 15s linear infinite;
        }
      `}</style>

      {/* 선물 상자 그래픽 영역 (유연한 최소 높이 설정) */}
      <div className="relative w-full min-h-[17rem] py-4 flex items-center justify-center">
        
        {/* 아우라 빛 효과 */}
        <div className={`absolute w-44 h-44 rounded-full bg-purple-500/10 blur-3xl transition-all duration-1000 ${
          status === 'shaking' ? 'scale-125 bg-pink-500/20' : status === 'opened' ? 'scale-150 bg-yellow-500/20' : ''
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

        {!showConfirm && (
          <div 
            className={`flex flex-col items-center select-none w-full ${
              status === 'idle' ? 'cursor-pointer group box-float-animation' : ''
            } ${status === 'shaking' ? 'box-shake-animation' : ''}`}
            onClick={status === 'idle' ? handleOpenBox : undefined}
          >
            {/* SVG 입체 상자 */}
            <svg viewBox="0 0 200 240" className="w-48 h-56 select-none relative overflow-visible">
              <defs>
                {/* 리본 그라데이션 */}
                <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffee58" stopOpacity={1} />
                  <stop offset="50%" stopColor="#fbc02d" stopOpacity={1} />
                  <stop offset="100%" stopColor="#f57f17" stopOpacity={1} />
                </linearGradient>
                
                {/* 금빛/노란색 그라데이션 (보상용) */}
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffee58" />
                  <stop offset="100%" stopColor="#fbc02d" />
                </linearGradient>

                {/* 그림자 필터 */}
                <filter id="boxShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#000" floodOpacity="0.4" />
                </filter>
              </defs>

              {/* 바닥 그림자 */}
              <ellipse 
                cx="100" 
                cy="205" 
                rx="60" 
                ry="12" 
                fill="#000" 
                opacity="0.3" 
                className={`transition-all duration-700 ${
                  status === 'opened' ? 'scale-90 opacity-20' : ''
                }`} 
              />

              {/* [상자 열림 연출용 콘텐츠] 보상 아이템 / 물음표 */}
              <g className={`transition-all duration-700 ease-out origin-center ${
                status === 'opened' ? 'translate-y-[-50px] opacity-100 scale-110' : 'translate-y-[20px] opacity-0 scale-50 pointer-events-none'
              }`}>
                {/* 보상 뒤의 빛 광채 */}
                <circle cx="100" cy="95" r="45" fill="url(#goldGrad)" opacity="0.15" className="animate-pulse" />
                
                {/* 꽝인 경우 */}
                {reward && reward.amount === 0 && (
                  <g>
                    <circle cx="100" cy="95" r="30" fill="#374151" stroke="#4b5563" strokeWidth="3" filter="url(#boxShadow)" />
                    <text x="100" y="104" textAnchor="middle" fill="#9ca3af" fontSize="24" fontWeight="900">?</text>
                  </g>
                )}
                {/* 당첨인 경우 */}
                {reward && reward.amount > 0 && (
                  <g className="sparkle-effect">
                    {/* 회전하며 반짝이는 효과 */}
                    <circle cx="100" cy="95" r="32" fill="#1e1b4b" stroke="#eab308" strokeWidth="3" filter="url(#boxShadow)" />
                    
                    {/* 반짝이 별 장식 */}
                    <path d="M 80,75 L 82,80 L 87,81 L 82,82 L 80,87 L 78,82 L 73,81 L 78,80 Z" fill="#eab308" className="animate-ping" style={{ animationDuration: '2s' }} />
                    <path d="M 120,70 L 121,73 L 124,74 L 121,75 L 120,78 L 119,75 L 116,74 L 119,73 Z" fill="#ffee58" />
                    <path d="M 125,110 L 126,112 L 128,113 L 126,114 L 125,116 L 124,114 L 122,113 L 124,112 Z" fill="#eab308" />
                    
                    <text x="100" y="93" textAnchor="middle" fill="#facc15" fontSize="11" fontWeight="900" letterSpacing="-0.5">당첨!</text>
                    <text x="100" y="108" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">{reward.amount}P</text>
                  </g>
                )}
              </g>

              {/* 상자 몸체 (Box Body) */}
              <g className="box-body-group" filter="url(#boxShadow)">
                {/* 왼쪽 앞면 */}
                <path d="M 100,130 L 30,95 L 30,175 L 100,210 Z" fill="#b71c1c" />
                {/* 오른쪽 앞면 */}
                <path d="M 100,130 L 170,95 L 170,175 L 100,210 Z" fill="#d32f2f" />
                
                {/* 왼쪽 리본 세로 띠 */}
                <path d="M 65,112.5 L 65,192.5 L 75,197.5 L 75,117.5 Z" fill="url(#ribbonGrad)" />
                {/* 오른쪽 리본 세로 띠 */}
                <path d="M 125,117.5 L 125,197.5 L 135,192.5 L 135,112.5 Z" fill="url(#ribbonGrad)" />
                
                {/* 상자 입구 안쪽 어두운 그늘 (열렸을 때 보임) */}
                <path d="M 100,130 L 30,95 L 100,60 L 170,95 Z" fill="#4a0e0e" opacity="0.9" />
              </g>

              {/* 상자 뚜껑 (Box Lid) */}
              <g className={`box-lid-group origin-center transition-all duration-700 ease-out ${
                status === 'opened' ? 'translate-y-[-90px] rotate-[-15deg] opacity-0 scale-90 pointer-events-none' : ''
              }`} filter="url(#boxShadow)">
                {/* 뚜껑 윗면 마름모 */}
                <path d="M 100,55 L 20,88 L 100,121 L 180,88 Z" fill="#e53935" />
                {/* 뚜껑 왼쪽 옆면 */}
                <path d="M 20,88 L 100,121 L 100,133 L 20,100 Z" fill="#b71c1c" />
                {/* 뚜껑 오른쪽 옆면 */}
                <path d="M 100,121 L 180,88 L 180,100 L 100,133 Z" fill="#c62828" />

                {/* 뚜껑 윗면 리본 십자 띠 */}
                <path d="M 60,71.5 L 140,104.5 L 150,100.5 L 70,67.5 Z" fill="url(#ribbonGrad)" />
                <path d="M 140,71.5 L 60,104.5 L 50,100.5 L 130,67.5 Z" fill="url(#ribbonGrad)" />

                {/* 뚜껑 왼쪽 옆면 리본 세로 띠 */}
                <path d="M 56,103 L 56,115 L 66,119 L 66,107 Z" fill="url(#ribbonGrad)" />
                {/* 뚜껑 오른쪽 옆면 리본 세로 띠 */}
                <path d="M 134,107 L 134,119 L 144,115 L 144,103 Z" fill="url(#ribbonGrad)" />

                {/* 리본 매듭 (Top Bow) */}
                <path d="M 100,55 C 80,35 65,45 85,52 C 95,55.5 100,55 100,55 Z" fill="url(#ribbonGrad)" stroke="#f57f17" strokeWidth="1" />
                <path d="M 100,55 C 120,35 135,45 115,52 C 105,55.5 100,55 100,55 Z" fill="url(#ribbonGrad)" stroke="#f57f17" strokeWidth="1" />
                <circle cx="100" cy="55" r="7" fill="url(#ribbonGrad)" stroke="#e65100" strokeWidth="1.5" />
                
                {/* 흘러내리는 끈 */}
                <path d="M 96,57 C 85,63 75,75 80,80 C 82,82 85,78 82,75 C 79,72 88,63 96,57 Z" fill="url(#ribbonGrad)" />
                <path d="M 104,57 C 115,63 125,75 120,80 C 118,82 115,78 118,75 C 121,72 112,63 104,57 Z" fill="url(#ribbonGrad)" />
              </g>
            </svg>

            {/* 하단 텍스트 및 결과 설명 */}
            {status === 'idle' && (
              <span className="text-purple-300 text-[11px] font-black mt-3 tracking-wider group-hover:text-purple-200 transition-colors">
                상자를 눌러 열어보세요! {isPlayedToday ? '(100p 차감)' : '(무료)'}
              </span>
            )}

            {status === 'shaking' && (
              <span className="text-pink-300 text-[11px] font-black mt-3 tracking-widest animate-bounce">
                두구두구 흔들리는 중...
              </span>
            )}

            {status === 'opened' && reward && (
              <div className="flex flex-col items-center text-center mt-3 animate-in fade-in slide-in-from-top-2 duration-500 w-full px-4">
                {reward.amount > 0 ? (
                  <>
                    <h3 className="text-yellow-400 text-sm font-black">
                      보상 당첨! 🎉
                    </h3>
                    <p className="text-gray-300 text-xs font-semibold mt-1">
                      선물 상자에서 <span className="text-yellow-400 font-bold">{reward.label}</span>이 나왔습니다!
                    </p>
                    <div className="mt-3.5 flex items-center justify-center gap-2">
                      <button
                        onClick={handleOpenCertModal}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        📝 당첨 인증글 쓰기{isPostRewardAvailable ? ' (+50p 적립)' : ''}
                      </button>
                      <button
                        onClick={(e) => resetBox(e)}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-black text-xs rounded-xl border border-gray-700 transition-all active:scale-95 cursor-pointer"
                      >
                        다시 하기
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-gray-400 text-sm font-black">
                      아쉽지만 다음 기회에! 😢
                    </h3>
                    <p className="text-gray-300 text-xs mt-1">
                      빈 상자였습니다. 내일 새로운 상자에 도전하세요.
                    </p>
                    <button
                      onClick={(e) => resetBox(e)}
                      className="mt-3.5 px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-black text-xs rounded-xl border border-gray-700 transition-all active:scale-95 cursor-pointer"
                    >
                      다시 하기
                    </button>
                  </>
                )}
              </div>
            )}
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
