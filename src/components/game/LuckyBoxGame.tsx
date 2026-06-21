'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Gift } from 'lucide-react';
import { createCommunityPost } from '@/lib/actions/community';

const CONFETTI_COUNT = 45;
const CONFETTI_PIECES = Array.from({ length: CONFETTI_COUNT }).map((_, i) => {
  const minAngle = -170;
  const maxAngle = -10;
  const angleDeg = minAngle + ((maxAngle - minAngle) / (CONFETTI_COUNT - 1)) * i + (Math.random() * 10 - 5);
  const angleRad = (angleDeg * Math.PI) / 180;
  
  const distance = 120 + Math.random() * 160;
  
  const tx = Math.cos(angleRad) * distance;
  const ty = Math.sin(angleRad) * distance;
  
  const tx15 = Math.cos(angleRad) * (distance * 0.25);
  const ty15 = Math.sin(angleRad) * (distance * 0.25);

  const colors = [
    '#ff2a6d', '#05d9e8', '#01012b', '#f5a623', '#f8e71c', 
    '#7ed321', '#b8e986', '#bd10e0', '#9013fe', '#4a90e2',
    '#ff4081', '#00e676', '#2979ff', '#ffee58', '#ff3d00'
  ];
  const color = colors[i % colors.length];
  
  const rand = Math.random();
  let type = 'rect';
  let w = 6;
  let h = 6;
  if (rand < 0.3) {
    type = 'rect';
    w = 10 + Math.floor(Math.random() * 8); // 10px ~ 17px
    h = 12 + Math.floor(Math.random() * 15); // 12px ~ 26px
  } else if (rand < 0.55) {
    type = 'circle';
    w = 12 + Math.floor(Math.random() * 10); // 12px ~ 21px
    h = w;
  } else if (rand < 0.8) {
    type = 'streamer';
    w = 14 + Math.floor(Math.random() * 8); // 14px ~ 21px
    h = 45 + Math.floor(Math.random() * 30); // 45px ~ 74px
  } else {
    type = 'star';
    w = 18 + Math.floor(Math.random() * 12); // 18px ~ 29px
    h = w;
  }
  
  const dur = 1.3 + Math.random() * 0.9;
  const delay = Math.random() * 1.8;
  const rotEnd = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720);

  return {
    type,
    color,
    w,
    h,
    tx,
    ty,
    tx15,
    ty15,
    rotEnd,
    dur: `${dur.toFixed(2)}s`,
    delay: `${delay.toFixed(2)}s`,
  };
});

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
      const bannerImg = `/images/playground/luckybox_win_banner_${reward?.amount ?? 10}.png`;
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
        /* 컨페티 상자에서 뿜어져 나오는 부채꼴 애니메이션 */
        @keyframes confetti-burst {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) rotate(0deg) scale(0);
            opacity: 0;
          }
          1% {
            opacity: 1;
          }
          15% {
            transform: translate(-50%, -50%) translate(var(--tx-15), var(--ty-15)) rotate(30deg) scale(1.5);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) rotate(var(--rot-end)) scale(0.6);
            opacity: 0;
          }
        }
        /* 폭죽 줄기 퍼지는 애니메이션 */
        @keyframes firework-line {
          0% { transform: scaleY(0); opacity: 1; }
          50% { transform: scaleY(1); opacity: 1; }
          100% { transform: scaleY(0.3); opacity: 0; }
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
            {/* 선물 상자 이미지 (SVG 대체) */}
            <div className="relative w-44 h-48 select-none overflow-visible mt-6">
              {/* 상자 몸통 (항상 표시) */}
              <img 
                src="/images/playground/random_box_bottom.png" 
                alt="상자 몸통" 
                className="absolute inset-0 w-full h-full object-contain z-0" 
              />
              {/* 상자 뚜껑 (열리지 않았을 때만 표시) */}
              {status !== 'opened' && (
                <img 
                  src="/images/playground/random_box_top.png" 
                  alt="상자 뚜껑" 
                  className="absolute inset-0 w-full h-full object-contain z-10 animate-in fade-in duration-300" 
                />
              )}
            </div>

            {/* ═══ 컨페티/폭죽 오버레이 (HTML - SVG 위에 absolute, z-index: 10) ═══ */}
            {status === 'opened' && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                {/* 색종이 조각들 - 상자 중심에서 뿜어져 나오는 부채꼴 폭죽 */}
                {CONFETTI_PIECES.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '42%',
                      width: c.w,
                      height: c.h,
                      // 커스텀 CSS 변수를 전달하여 transform에 사용
                      '--tx': `${c.tx}px`,
                      '--ty': `${c.ty}px`,
                      '--tx-15': `${c.tx15}px`,
                      '--ty-15': `${c.ty15}px`,
                      '--rot-end': `${c.rotEnd}deg`,
                      animation: `confetti-burst ${c.dur} cubic-bezier(0.1, 0.8, 0.3, 1) infinite`,
                      animationDelay: c.delay,
                      opacity: 0,
                    } as React.CSSProperties}
                  >
                    {/* 타입별 렌더링 분기 */}
                    {c.type === 'streamer' && (
                      <svg viewBox="0 0 10 30" className="w-full h-full">
                        <path
                          d="M 5,0 Q 9,5 5,10 Q 1,15 5,20 Q 9,25 5,30"
                          fill="none"
                          stroke={c.color}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                    {c.type === 'star' && (
                      <svg viewBox="0 0 24 24" className="w-full h-full" style={{ fill: c.color }}>
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    )}
                    {(c.type === 'rect' || c.type === 'circle') && (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundColor: c.color,
                          borderRadius: c.type === 'circle' ? '50%' : '2px',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ═══ 상자 열림: 당첨 코인 (HTML 오버레이 - z-index: 20으로 폭죽보다 위) ═══ */}
            {status === 'opened' && reward && (
              <div 
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center justify-center animate-in zoom-in duration-300"
                style={{
                  top: '20%', // 상자 바로 위에 둥실 떠오르도록 Y축 설정
                }}
              >
                {reward.amount > 0 ? (
                  <div className="w-[74px] h-[74px] rounded-full bg-gradient-to-b from-yellow-300 to-yellow-600 border-[3.5px] border-yellow-500 shadow-[0_10px_25px_rgba(0,0,0,0.85),_0_0_20px_rgba(234,179,8,0.45)] flex flex-col items-center justify-center bg-[#1e1b4b]">
                    <span className="text-yellow-400 font-extrabold text-[11px] leading-tight drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">당첨</span>
                    <span className="text-white font-black text-[15px] leading-tight drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">{reward.amount}P</span>
                  </div>
                ) : (
                  <div className="w-[70px] h-[70px] rounded-full bg-gray-700 border-[3px] border-gray-600 shadow-[0_10px_25px_rgba(0,0,0,0.8)] flex items-center justify-center">
                    <span className="text-gray-400 font-black text-[18px]">꽝</span>
                  </div>
                )}
              </div>
            )}

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
                <img src={`/images/playground/luckybox_win_banner_${reward?.amount ?? 10}.png`} alt="인증 배너" className="max-w-full max-h-full object-contain" />
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
