'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Smartphone, ChevronRight, CheckCircle } from 'lucide-react';
import { nvLog } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedData, setVerifiedData] = useState<any>(null);
  
  // 실시간 진행 상세 상태 트래킹 메시지
  const [statusMsg, setStatusMsg] = useState('인증 시작 전');
  const [statusError, setStatusError] = useState('');

  // 마운트 시점에 드림시큐리티 JS SDK 로드 및 전역 콜백 등록
  useEffect(() => {
    const isTest = process.env.NEXT_PUBLIC_KMC_TEST_MODE === 'true';
    const sdkUrl = isTest 
      ? 'https://scert.mobile-ok.com/resources/js/index.js' 
      : 'https://cert.mobile-ok.com/resources/js/index.js';

    // 중복 로드 방지
    const existingScript = document.querySelector(`script[src="${sdkUrl}"]`);
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = sdkUrl;
      script.async = true;
      document.body.appendChild(script);
      nvLog('FW', `드림시큐리티 SDK 스크립트 동적 로드 등록: [${sdkUrl}]`);
    }

    // 전역 콜백 함수 등록 (팝업 완료 시 호출됨)
    (window as any).result = async (resultDataStr: string) => {
      try {
        nvLog('FW', '드림시큐리티 표준창 인증 완료 콜백 수신');
        const resultObj = JSON.parse(resultDataStr);
        if (resultObj.success && resultObj.encryptMOKKeyToken) {
          setStatusMsg('인증 토큰 획득 완료: 서버에 검증 요청 중...');
          await handleConfirmStandardAuth(resultObj.encryptMOKKeyToken);
        } else {
          setStatusError('인증 데이터가 유효하지 않습니다.');
          alert('본인인증 결과가 올바르지 않습니다.');
        }
      } catch (err: any) {
        nvLog('FW', '인증 결과 파싱 오류', err.message);
        setStatusError('결과 처리 도중 에러가 발생했습니다.');
        alert('본인인증 결과 처리 중 오류가 발생했습니다.');
      }
    };

    return () => {
      // 컴포넌트 언마운트 시 콜백 제거는 Next.js 페이지 이동 및 팝업 대기 상태 등을 고려하여 유지합니다.
    };
  }, []);

  /**
   * 백엔드 API를 통한 결과 검증 및 게스트 세션 생성
   */
  const handleConfirmStandardAuth = async (encryptMOKKeyToken: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch('/api/auth/kmc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          isMock: isTestMode,
          encryptMOKKeyToken
        })
      });

      const result = await response.json();
      if (result.trace && Array.isArray(result.trace)) {
        result.trace.forEach((line: string) => nvLog('AT', `[SERVER_TRACE] ${line}`));
      }

      if (response.ok && result.success && result.data) {
        nvLog('FW', '본인인증 및 성인인증 최종 승인 성공', result.data);
        setStatusMsg('인증 완료: 성인 인증에 성공했습니다.');
        
        // 쿠키 굽기
        document.cookie = "age_verified=true; path=/; max-age=3600; SameSite=Lax";
        if (result.data && result.data.gender) {
          document.cookie = `guest_gender=${result.data.gender}; path=/; max-age=3600; SameSite=Lax`;
        }
        sessionStorage.setItem('foxmon_verified_user', JSON.stringify(result.data));

        setIsVerified(true);
        setVerifiedData(result.data);
      } else {
        setStatusError(result.message || '인증 결과 검증에 실패했습니다.');
        alert(result.message || '인증 확인에 실패했습니다.');
      }
    } catch (err: any) {
      setStatusError(`서버 통신 에러: ${err.message}`);
      alert(`서버 응답 확인 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * 본인확인 표준창 팝업 열기
   */
  const handleStartDreamStandardAuth = () => {
    if (isTestMode) {
      setIsVerifying(true);
      setStatusMsg('Mock 모드: 가상 인증창 활성화 중...');
      setStatusError('');
      nvLog('FW', '⚠️ Mock 모드로 인증 표준창 시뮬레이션을 실행합니다.');
      
      // 1.5초 후 가상 콜백 호출
      setTimeout(() => {
        const mockKeyToken = 'MOCK_KEY_TOKEN_' + Math.random().toString(36).substring(7);
        if ((window as any).result) {
          (window as any).result(JSON.stringify({
            success: true,
            encryptMOKKeyToken: mockKeyToken
          }));
        }
      }, 1500);
      return;
    }

    if (!(window as any).MOBILEOK) {
      alert('드림시큐리티 본인확인 모듈이 아직 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    try {
      // 1. 브라우저의 사용자 액션(User Activation) 보안 컨텍스트 보존을 위해 상태 업데이트 전에 SDK 함수를 최우선 동기 실행합니다.
      nvLog('FW', '드림시큐리티 표준창 process 호출 시작');
      (window as any).MOBILEOK.process('/api/auth/kmc', 'WB', 'result');

      // 2. 호출 후 트래커 상태 변경 적용
      setIsVerifying(true);
      setStatusMsg('본인확인 표준창이 실행되었습니다.');
      setStatusError('');
    } catch (err: any) {
      setStatusError(err.message || '인증 팝업 호출 실패');
      alert(err.message || '본인인증창을 띄우지 못했습니다.');
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

  return (
    <div className={cn("flex flex-col w-full", className)}>
      <div className="flex flex-col gap-3 relative">
        {!isVerified ? (
          <button 
            type="button"
            onClick={handleStartDreamStandardAuth}
            disabled={isVerifying}
            className="flex items-center justify-between py-3 px-4 bg-purple-50/50 border border-purple-200 rounded-2xl shadow-sm hover:border-purple-300 hover:bg-purple-50 transition-all group active:scale-[0.98] disabled:opacity-50 w-full"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100/50 rounded-xl flex items-center justify-center group-hover:bg-purple-200/50 transition-colors">
                <Smartphone className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="text-[13px] sm:text-sm font-black text-purple-950">휴대폰 본인 인증</div>
                <div className="text-[11px] text-purple-600/70 font-semibold">간편한 드림시큐리티 표준창 인증</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-400 group-hover:text-purple-600 transition-colors" />
          </button>
        ) : (
          <form onSubmit={handleEnterFoxmon} className="w-full">
            <div className="flex flex-col items-center justify-center p-6 bg-green-50 border border-green-200 rounded-2xl mb-4">
              <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
              <div className="text-sm font-black text-green-950">성인 인증이 완료되었습니다.</div>
              <div className="text-xs text-green-600 mt-1">{verifiedData?.name} 님 환영합니다.</div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              폭스몬 들어가기
            </Button>
          </form>
        )}

        {isTestMode && !isVerified && (
          <div className="mt-2 text-center text-xs text-blue-500 font-bold bg-blue-50 py-1.5 rounded-lg border border-blue-100">
            ⚡ 현재 임시 테스트(Mock) 모드가 활성화되었습니다.
          </div>
        )}

        {/* 인증 진행 상태 로그 보드 */}
        {process.env.NEXT_PUBLIC_ENABLE_LOGS !== 'false' && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-mono text-gray-500 space-y-1.5 animate-in fade-in duration-300">
            <div className="font-bold text-gray-700 border-b border-gray-200/60 pb-1 mb-1 flex justify-between items-center">
              <span>🔄 본인인증 실시간 트래커</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded-full font-sans font-bold">Standard Window</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn("inline-block w-2 h-2 rounded-full", isVerifying || isVerified ? "bg-green-500" : "bg-gray-300")} />
              <span className={cn(isVerifying || isVerified ? "text-gray-700 font-semibold" : "text-gray-400")}>Step 1: 본인인증 표준창 호출 및 진행</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn("inline-block w-2 h-2 rounded-full", isVerified ? "bg-green-500" : "bg-gray-300")} />
              <span className={cn(isVerified ? "text-gray-700 font-semibold" : "text-gray-400")}>Step 2: 토큰 검증 및 게스트 세션 승인</span>
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
      </div>
    </div>
  );
}

export function AgeVerificationBox(props: AgeVerificationBoxProps) {
  return (
    <Suspense fallback={<div className="h-20 flex items-center justify-center text-xs text-gray-400">로딩 중...</div>}>
      <AgeVerificationBoxContent {...props} />
    </Suspense>
  );
}

