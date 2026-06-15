'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Smartphone, ChevronRight, X, ArrowLeft } from 'lucide-react';
import { nvLog } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AgeVerificationBoxProps {
  onVerifySuccess?: (data: { 
    name: string; 
    birthDate: string;
    gender: 'MALE' | 'FEMALE'; 
    phoneNumber: string;
    nationality: 'KOREAN' | 'FOREIGNER';
  }) => void;
  className?: string;
}

function AgeVerificationBoxContent({ onVerifySuccess, className }: AgeVerificationBoxProps) {
  const searchParams = useSearchParams();
  
  // URL 파라미터나 환경 변수가 없을 때 Mock 작동 유도
  const [isTestMode, setIsTestMode] = useState(false);
  
  useEffect(() => {
    const isTest = searchParams?.get('test') === '1' || searchParams?.get('bypass') === '1' || searchParams?.get('mock') === '1';
    setIsTestMode(isTest);
  }, [searchParams]);

  const [step, setStep] = useState<'SELECT' | 'FORM'>('SELECT');
  const [isSmsSent, setIsSmsSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // 인증 성공 여부
  const [verifiedData, setVerifiedData] = useState<any>(null); // 인증 성공 데이터 캐시
  const [isVerifying, setIsVerifying] = useState(false);
  
  // KMC 연동 상태 정보
  const [kmcToken, setKmcToken] = useState('');
  const [kmcPublicKey, setKmcPublicKey] = useState('');
  const [smsTimer, setSmsTimer] = useState(180); // 3분 타이머
  const [timerActive, setTimerActive] = useState(false);

  // 실시간 진행 상세 상태 트래킹 메시지
  const [statusMsg, setStatusMsg] = useState('인증 시작 전');
  const [statusError, setStatusError] = useState('');

  // 본인인증 폼 데이터
  const [formData, setFormData] = useState({
    userName: '',
    userPhone: '',
    birthDate6: '', // 주민번호 앞 6자리 (YYMMDD)
    genderCode: '', // 주민번호 뒤 1자리 (1, 2, 3, 4, 5, 6, 7, 8)
    providerId: 'SKT', // SKT, KT, LGU, SKTMVNO, KTMVNO, LGUMVNO
    userNation: 'KOREAN' as 'KOREAN' | 'FOREIGNER',
    reqAuthType: 'SMS' as 'SMS' | 'PASS',
  });

  const [authNumber, setAuthNumber] = useState('');

  // 타이머 효과
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && smsTimer > 0) {
      interval = setInterval(() => {
        setSmsTimer(prev => prev - 1);
      }, 1000);
    } else if (smsTimer === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, smsTimer]);

  // 본인인증 팝업 활성화 시 뒷배경 스크롤 락 처리
  useEffect(() => {
    if (step === 'FORM') {
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyOverflow = document.body.style.overflow;

      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';

      return () => {
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.overflow = originalBodyOverflow;
      };
    }
  }, [step]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleCloseModal = () => {
    setStep('SELECT');
    setIsSmsSent(false);
    setIsVerified(false);
    setVerifiedData(null);
    setTimerActive(false);
    setSmsTimer(180);
    setAuthNumber('');
    setStatusMsg('인증 시작 전');
    setStatusError('');
  };

  /**
   * 본인확인 시작 - KMC 거래 토큰 발급
   */
  const handleStartKmcAuth = async () => {
    setIsVerifying(true);
    setStatusMsg('1단계: KMC 서버 토큰 발급 요청 중...');
    setStatusError('');
    try {
      nvLog('FW', 'KMC 토큰 발급 요청 시작');
      const response = await fetch('/api/auth/kmc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'token', 
          siteUrl: window.location.origin,
          isMock: isTestMode
        }),
      });

      const result = await response.json();
      if (response.ok && result.success && result.data) {
        setStatusMsg('1단계 완료: KMC 토큰 발급 성공');
        setKmcToken(result.data.encryptMOKToken);
        setKmcPublicKey(result.data.publicKey);
        setStep('FORM');
        setIsSmsSent(false);
        setIsVerified(false);
        setVerifiedData(null);
      } else {
        if (isTestMode) {
          nvLog('FW', '⚠️ KMC 테스트 모드 토큰 획득 실패로 Mock 모드로 폴백합니다.');
          setStatusMsg('1단계 완료: Mock 테스트 모드로 전환');
          setKmcToken('MOCK_TOKEN_' + Math.random().toString(36).substring(7));
          setKmcPublicKey('MOCK_PUBLIC_KEY');
          setStep('FORM');
          setIsSmsSent(false);
          setIsVerified(false);
          setVerifiedData(null);
        } else {
          nvLog('FW', '❌ KMC 실서버 토큰 획득 실패', result.message);
          setStatusError(`1단계 실패: ${result.message || '토큰 획득 오류'}`);
          alert(`본인인증 토큰 발급에 실패했습니다:\n${result.message || '알 수 없는 오류'}`);
        }
      }
    } catch (err: any) {
      if (isTestMode) {
        setStep('FORM');
        setIsSmsSent(false);
        setIsVerified(false);
        setVerifiedData(null);
        setStatusMsg('1단계 완료: 통신오류 복구 후 Mock 모드 진입');
      } else {
        nvLog('FW', '❌ KMC 토큰 발급 통신 오류', err.message);
        setStatusError(`1단계 통신에러: ${err.message}`);
        alert(`본인인증 서버 연결 중 오류가 발생했습니다:\n${err.message}`);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * SMS 인증번호 발송 요청
   */
  const handleRequestSms = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    
    // 생년월일 YYYYMMDD 파싱
    const is19xx = ['1', '2', '5', '6'].includes(formData.genderCode);
    const century = is19xx ? '19' : '20';
    const userBirthday = `${century}${formData.birthDate6}`;

    // 성별 판단
    const userGender = ['1', '3', '5', '7'].includes(formData.genderCode) ? 'MALE' : 'FEMALE';

    setIsVerifying(true);
    setIsVerified(false);
    setVerifiedData(null);
    setStatusMsg('2단계: SMS 인증번호 발송 요청 중...');
    setStatusError('');
    try {
      nvLog('FW', 'KMC SMS 인증 요청 전송', { userName: formData.userName });
      const response = await fetch('/api/auth/kmc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
          isMock: isTestMode,
          encryptMOKToken: kmcToken,
          publicKey: kmcPublicKey,
          providerId: formData.providerId,
          reqAuthType: formData.reqAuthType,
          userName: formData.userName,
          userPhone: formData.userPhone,
          userBirthday,
          userGender,
          userNation: formData.userNation,
          siteUrl: window.location.origin
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setStatusMsg('2단계 완료: SMS 인증번호 발송 완료 (인증 대기)');
        if (result.encryptMOKToken) {
          setKmcToken(result.encryptMOKToken);
        }
        setIsSmsSent(true);
        setSmsTimer(180);
        setTimerActive(true);
      } else {
        setStatusError(`2단계 실패: ${result.message || '인증번호 발송 실패'}`);
        alert(result.message || '인증번호 발송에 실패했습니다.');
      }
    } catch (err: any) {
      setStatusError(`2단계 통신에러: ${err.message || '연결 실패'}`);
      alert('인증 요청 처리 중 통신 에러가 발생했습니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * SMS 인증번호 확인 및 최종 성인 검증 완료
   */
  const handleConfirmSms = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (smsTimer === 0) {
      alert('입력 시간이 만료되었습니다. 다시 시도해 주세요.');
      return;
    }

    setIsVerifying(true);
    setStatusMsg('3단계: KMC 인증번호 검증 요청 중...');
    setStatusError('');
    try {
      nvLog('FW', 'KMC 인증번호 검증 시작');

      const is19xx = ['1', '2', '5', '6'].includes(formData.genderCode);
      const century = is19xx ? '19' : '20';
      const userBirthday = `${century}${formData.birthDate6}`;
      const userGender = ['1', '3', '5', '7'].includes(formData.genderCode) ? 'MALE' : 'FEMALE';

      const response = await fetch('/api/auth/kmc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          isMock: isTestMode,
          encryptMOKToken: kmcToken,
          publicKey: kmcPublicKey,
          authNumber,
          userName: formData.userName,
          userPhone: formData.userPhone,
          userBirthday,
          userGender,
          userNation: formData.userNation
        }),
      });

      const result = await response.json();
      if (response.ok && result.success && result.data) {
        nvLog('FW', 'KMC 본인인증 및 성인인증 검증 완료', result.data);
        setStatusMsg('3단계 완료: 본인확인 및 성인인증 성공');
        
        document.cookie = "age_verified=true; path=/; max-age=3600; SameSite=Lax";
        if (result.data && result.data.gender) {
          document.cookie = `guest_gender=${result.data.gender}; path=/; max-age=3600; SameSite=Lax`;
        }
        sessionStorage.setItem('foxmon_verified_user', JSON.stringify(result.data));

        setIsVerified(true);
        setVerifiedData(result.data);
        setTimerActive(false); // 타이머 멈춤
      } else {
        setStatusError(`3단계 실패: ${result.message || '인증번호 검증 불일치'}`);
        alert(result.message || '인증번호 확인에 실패했습니다.');
      }
    } catch (err: any) {
      setStatusError(`3단계 통신에러: ${err.message || '인증확인 요청 실패'}`);
      alert('서버 응답 확인 중 오류가 발생했습니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * 최종 폭스몬 입장 처리
   */
  const handleEnterFoxmon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified || !verifiedData) return;
    if (onVerifySuccess) {
      onVerifySuccess(verifiedData);
    }
  };

  /**
   * SELECT 단계: 본인인증 시작 화면
   */
  if (step === 'SELECT') {
    return (
      <div className={cn("flex flex-col w-full", className)}>
        <div className="flex flex-col gap-3 relative">
          <button 
            type="button"
            onClick={handleStartKmcAuth}
            disabled={isVerifying}
            className="flex items-center justify-between py-3 px-4 bg-purple-50/50 border border-purple-200 rounded-2xl shadow-sm hover:border-purple-300 hover:bg-purple-50 transition-all group active:scale-[0.98] disabled:opacity-50 w-full"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100/50 rounded-xl flex items-center justify-center group-hover:bg-purple-200/50 transition-colors">
                <Smartphone className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="text-[13px] sm:text-sm font-black text-purple-950">휴대폰 본인 인증</div>
                <div className="text-[11px] text-purple-600/70 font-semibold">KMC API V3를 통한 만 19세 이상 본인확인</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-400 group-hover:text-purple-600 transition-colors" />
          </button>

          {isTestMode && (
            <div className="mt-2 text-center text-xs text-blue-500 font-bold bg-blue-50 py-1.5 rounded-lg border border-blue-100">
              ⚡ 현재 임시 테스트(Mock) 모드가 강제 설정되었습니다.
            </div>
          )}

          {/* 인증 진행 상태 로그 보드 (ENABLE_LOGS 환경 변수 설정에 따라 켜고 끌 수 있음) */}
          {process.env.NEXT_PUBLIC_ENABLE_LOGS !== 'false' && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-mono text-gray-500 space-y-1.5 animate-in fade-in duration-300">
              <div className="font-bold text-gray-700 border-b border-gray-200/60 pb-1 mb-1 flex justify-between items-center">
                <span>🔄 본인인증 실시간 트래커</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded-full font-sans font-bold">KMC API V3</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn("inline-block w-2 h-2 rounded-full", step !== 'SELECT' ? "bg-green-500" : "bg-gray-300 animate-pulse")} />
                <span className={cn(step !== 'SELECT' ? "text-gray-700 font-semibold" : "text-gray-400")}>Step 1: KMC 거래 토큰 발급 및 세션 생성</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn("inline-block w-2 h-2 rounded-full", isSmsSent ? "bg-green-500" : "bg-gray-300")} />
                <span className={cn(isSmsSent ? "text-gray-700 font-semibold" : "text-gray-400")}>Step 2: SMS 인증번호 발송 요청</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn("inline-block w-2 h-2 rounded-full", isVerified ? "bg-green-500" : "bg-gray-300")} />
                <span className={cn(isVerified ? "text-gray-700 font-semibold" : "text-gray-400")}>Step 3: 인증번호 일치 검증 및 성인인증 완료</span>
              </div>
              <div className="mt-2 pt-1.5 border-t border-gray-200/60 text-[10px] space-y-0.5">
                <div className="text-gray-600 font-semibold flex gap-1 items-start">
                  <span className="text-purple-600 shrink-0">➔ Status:</span>
                  <span className="break-all">{statusMsg}</span>
                </div>
                {statusError && (
                  <div className="text-red-600 font-semibold flex gap-1 items-start">
                    <span className="shrink-0">⚠️ Error:</span>
                    <span className="break-all">{statusError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {isVerifying && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-purple-600">인증 세션 생성 중...</span>
              </div>
            </div>
          )}
        </div>
        <p className="mt-5 text-center text-[11px] text-gray-400 font-medium">
          ※ 내국인 및 국내 체류 외국인 모두 동일하게 인증 가능합니다.
        </p>
      </div>
    );
  }

  /**
   * FORM 단계: 본인정보 입력 화면 (일체형 모달)
   */
  if (step === 'FORM') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className={cn("flex flex-col w-full max-w-md bg-white border border-gray-200 rounded-[2rem] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 relative", className)}>
          
          {/* 우측 상단 닫기 X 버튼 */}
          <button 
            type="button" 
            onClick={handleCloseModal}
            className="absolute top-5 right-5 text-xs font-black text-gray-400 hover:text-gray-600 transition-all active:scale-95 focus:outline-none"
          >
            닫기
          </button>

          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 pr-8">
            <button type="button" onClick={handleCloseModal} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800">
              <ArrowLeft size={14} /> 이전
            </button>
            <h3 className="text-sm font-black text-gray-800">본인 정보 입력 {isTestMode && <span className="text-blue-500 font-mono">(Mock)</span>}</h3>
            <span className="w-8" />
          </div>

          <form onSubmit={handleEnterFoxmon} className="space-y-4">
            {/* 내외국인 구분 */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({...formData, userNation: 'KOREAN'})}
                className={cn(
                  "flex-1 py-2 text-xs font-black rounded-lg border transition-all",
                  formData.userNation === 'KOREAN' 
                    ? "bg-purple-600 border-purple-600 text-white" 
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
                disabled={isVerified}
              >
                내국인
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, userNation: 'FOREIGNER'})}
                className={cn(
                  "flex-1 py-2 text-xs font-black rounded-lg border transition-all",
                  formData.userNation === 'FOREIGNER' 
                    ? "bg-purple-600 border-purple-600 text-white" 
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
                disabled={isVerified}
              >
                외국인
              </button>
            </div>

            {/* 이름 */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-600">이름</Label>
              <Input 
                placeholder="이름을 입력해 주세요"
                value={formData.userName} 
                onChange={e => setFormData({...formData, userName: e.target.value})} 
                className="h-10 text-sm font-bold focus-visible:ring-purple-500/50"
                required 
                disabled={isVerified}
              />
            </div>

            {/* 주민등록번호 앞자리 + 뒷자리 1번째 */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-600">주민등록번호 앞 7자리</Label>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="YYMMDD"
                  value={formData.birthDate6} 
                  onChange={e => setFormData({...formData, birthDate6: e.target.value.replace(/[^0-9]/g, '')})} 
                  className="h-10 text-sm font-bold text-center flex-1 focus-visible:ring-purple-500/50"
                  maxLength={6}
                  required 
                  disabled={isVerified}
                />
                <span className="text-gray-400 font-bold">-</span>
                <Input 
                  placeholder="●"
                  value={formData.genderCode} 
                  onChange={e => setFormData({...formData, genderCode: e.target.value.replace(/[^1-8]/g, '')})} 
                  className="h-10 text-sm font-bold text-center w-12 focus-visible:ring-purple-500/50"
                  maxLength={1}
                  required 
                  disabled={isVerified}
                />
                <span className="text-gray-300 font-bold text-sm tracking-widest flex-1">●●●●●●</span>
              </div>
            </div>

            {/* 통신사 선택 */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-600">통신사</Label>
              <select
                value={formData.providerId}
                onChange={e => setFormData({...formData, providerId: e.target.value})}
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isVerified}
              >
                <option value="SKT">SKT</option>
                <option value="KT">KT</option>
                <option value="LGU">LGU+</option>
                <option value="SKTMVNO">SKT 알뜰폰</option>
                <option value="KTMVNO">KT 알뜰폰</option>
                <option value="LGUMVNO">LGU+ 알뜰폰</option>
              </select>
            </div>

            {/* 휴대폰 번호 */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-600">휴대폰 번호</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="01012345678"
                  value={formData.userPhone} 
                  onChange={e => setFormData({...formData, userPhone: e.target.value.replace(/[^0-9]/g, '')})} 
                  className="h-10 text-sm font-bold flex-1 focus-visible:ring-purple-500/50"
                  required 
                  disabled={isVerified}
                />
                <button
                  type="button"
                  onClick={handleRequestSms}
                  disabled={isVerifying || !formData.userPhone || !formData.userName || !formData.birthDate6 || !formData.genderCode || isVerified}
                  className={cn(
                    "px-4 h-10 text-xs font-black rounded-lg border transition-all shrink-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                    isSmsSent
                      ? "bg-white border-purple-600 text-purple-600 hover:bg-purple-50"
                      : "bg-purple-600 border-purple-600 text-white hover:bg-purple-700"
                  )}
                >
                  {isVerifying && !isSmsSent ? '전송 중...' : isSmsSent ? '재전송' : '인증번호 받기'}
                </button>
              </div>
            </div>

            {/* 인증번호 입력 (isSmsSent === true 일 때만 노출) */}
            {isSmsSent && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-gray-600">인증번호 6자리 입력</Label>
                  <span className={cn("text-xs font-black", timerActive ? "text-purple-600" : "text-red-500")}>
                    {formatTime(smsTimer)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder={isTestMode ? "Mock 인증번호: 123456" : "인증번호 입력"}
                    value={authNumber} 
                    onChange={e => setAuthNumber(e.target.value.replace(/[^0-9]/g, ''))} 
                    className="h-10 text-lg font-black text-center tracking-widest flex-1 focus-visible:ring-purple-500/50"
                    maxLength={6}
                    required 
                    disabled={isVerified}
                  />
                  <button
                    type="button"
                    onClick={handleConfirmSms}
                    disabled={isVerifying || !authNumber || isVerified || smsTimer === 0}
                    className={cn(
                      "px-4 h-10 text-xs font-black rounded-lg border transition-all shrink-0 active:scale-95",
                      isVerified
                        ? "bg-green-50 border-green-600 text-green-600 cursor-default"
                        : "bg-purple-600 border-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isVerified ? '인증완료' : '인증확인'}
                  </button>
                </div>
              </div>
            )}

            {/* 맨 하단 폭스몬 들어가기 버튼 */}
            <Button 
              type="submit" 
              disabled={isVerifying || !isVerified} 
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-xl mt-4 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              폭스몬 들어가기
            </Button>

            {/* 입력 폼 내부 실시간 트래커 */}
            {process.env.NEXT_PUBLIC_ENABLE_LOGS !== 'false' && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-mono text-gray-500 space-y-1 animate-in fade-in duration-200">
                <div className="font-bold text-gray-700 border-b border-gray-200/40 pb-1 mb-1">
                  🔄 KMC 본인확인 실시간 상태
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn("inline-block w-1.5 h-1.5 rounded-full", step !== 'SELECT' ? "bg-green-500" : "bg-gray-300")} />
                  <span>1단계: KMC 세션 생성 완료</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn("inline-block w-1.5 h-1.5 rounded-full", isSmsSent ? "bg-green-500" : "bg-gray-300")} />
                  <span>2단계: SMS 발급 완료</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn("inline-block w-1.5 h-1.5 rounded-full", isVerified ? "bg-green-500" : "bg-gray-300")} />
                  <span>3단계: 성인인증 검증 완료</span>
                </div>
                <div className="mt-1.5 pt-1 border-t border-gray-200/40 text-[9px]">
                  <div className="text-gray-600 font-semibold break-all">
                    <span className="text-purple-600">➔ Status:</span> {statusMsg}
                  </div>
                  {statusError && (
                    <div className="text-red-600 font-semibold mt-0.5 break-all">
                      <span>⚠️ Error:</span> {statusError}
                    </div>
                  )}
                </div>
              </div>
            )}

            {isTestMode && isSmsSent && !isVerified && (
              <p className="text-[11px] text-center text-blue-500 font-bold bg-blue-50 p-2 rounded-lg mt-2">
                💡 Mock 모드 인증 성공 번호는 [123456] 입니다.
              </p>
            )}
          </form>
        </div>
      </div>
    );
  }

  return null;
}

export function AgeVerificationBox(props: AgeVerificationBoxProps) {
  return (
    <Suspense fallback={<div className="h-20 flex items-center justify-center text-xs text-gray-400">로딩 중...</div>}>
      <AgeVerificationBoxContent {...props} />
    </Suspense>
  );
}
