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
    ci?: string;
  }) => void;
  className?: string;
}

function AgeVerificationBoxContent({ onVerifySuccess, className }: AgeVerificationBoxProps) {
  const searchParams = useSearchParams();
  
  // URL 파라미터나 환경 변수가 없을 때 Mock 작동 유도
  const [isTestMode, setIsTestMode] = useState(false);
  
  useEffect(() => {
    const isTest = searchParams?.get('test') === '1' || 
                   searchParams?.get('bypass') === '1' || 
                   searchParams?.get('mock') === '1';
    setIsTestMode(isTest);
  }, [searchParams]);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

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
        const resultObj = JSON.parse(resultDataStr);
        if (resultObj.success && resultObj.encryptMOKKeyToken) {
          await handleConfirmStandardAuth(resultObj.encryptMOKKeyToken);
        } else {
          setIsVerifying(false);
          alert('본인인증 결과가 올바르지 않습니다.');
        }
      } catch (err: any) {
        setIsVerifying(false);
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

      if (response.ok && result.success && result.data) {
        document.cookie = "age_verified=true; path=/; SameSite=Lax";
        if (result.data && result.data.gender) {
          document.cookie = `guest_gender=${result.data.gender}; path=/; SameSite=Lax`;
        }
        const { phoneNumber: _phone, ...safeData } = result.data;
        sessionStorage.setItem('foxmon_verified_user', JSON.stringify(safeData));

        setIsVerified(true);
        setVerifiedData(result.data);

        if (onVerifySuccess) {
          onVerifySuccess(result.data);
        }
      } else {
        const msg = result.message || '인증 확인에 실패했습니다.';
        if (msg.includes('19세 미만')) {
          setBlockedMessage(msg);
        } else {
          alert(msg);
        }
      }
    } catch (err: any) {
      alert(`서버 응답 확인 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleStartDreamStandardAuth = () => {
    if (isTestMode) {
      setIsVerifying(true);
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
      (window as any).MOBILEOK.process('/api/auth/kmc', 'WB', 'result');

      setIsVerifying(true);

      const handleWindowFocus = () => {
        setTimeout(() => {
          setIsVerifying((prev) => {
            if (prev && !isVerified) {
              return false;
            }
            return prev;
          });
        }, 2000);
        window.removeEventListener('focus', handleWindowFocus);
      };
      window.addEventListener('focus', handleWindowFocus);
    } catch (err: any) {
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
        {blockedMessage ? (
          <div className="flex flex-col items-center justify-center p-6 bg-red-50 border-2 border-red-300 rounded-2xl text-center">
            <div className="w-16 h-16 rounded-full border-[5px] border-red-200 flex items-center justify-center mb-3">
              <span className="text-2xl font-black text-red-500">19</span>
            </div>
            <div className="text-sm font-black text-red-700 mb-1">접속이 제한되었습니다</div>
            <div className="text-xs text-red-600 font-semibold leading-relaxed">
              {blockedMessage}
            </div>
            <p className="text-[10px] text-red-400 mt-3 leading-relaxed">
              청소년 보호법에 의거하여 만 19세 미만은<br/>본 서비스를 이용할 수 없습니다.
            </p>
          </div>
        ) : !isVerified ? (
          <>
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
            {isTestMode && (
              <p className="text-[10px] text-center text-purple-600 font-bold mt-1">
                ⚙️ 개발자 테스트 모드: 모의(Mock) 본인인증이 진행됩니다.
              </p>
            )}
          </>
        ) : null}
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
