'use client';

import { useState } from 'react';
import { Smartphone, ShieldCheck, ChevronRight } from 'lucide-react';
import { nvLog } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface AgeVerificationBoxProps {
  onVerifySuccess?: (data: { 
    name: string; 
    birthDate: string;
    gender: string; 
    phoneNumber: string;
    nationality: 'KOREAN' | 'FOREIGNER';
  }) => void;
  className?: string;
}

export function AgeVerificationBox({ onVerifySuccess, className }: AgeVerificationBoxProps) {
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = (type: string) => {
    nvLog('FW', `성인 인증 시도: ${type}`);
    setIsVerifying(true);
    
    // Real Verification Process (hitting the backend FA_GUEST_AUTH Atom via API)
    setTimeout(async () => {
      try {
        alert('ℹ️ 개발/테스트 환경 안내\n\n현재 본인인증 대행사(PG) 정식 계약 전이므로 실제 인증창 대신 시스템 내부에서 가상 데이터로 인증을 통과시킵니다.');
        
        const mockData = {
          name: '민경환',
          birthDate: '19920104',
          gender: 'MALE',
          phoneNumber: '01039573425',
          nationality: 'KOREAN' as const,
        };

        const response = await fetch('/api/auth/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authMethod: type,
            userRawData: mockData
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          nvLog('FW', '성인 인증 완료 (Mock Backend)', mockData);
          if (onVerifySuccess) onVerifySuccess(mockData);
        } else {
          alert(result.message || '인증에 실패했습니다.');
        }
      } catch (err) {
        alert('서버 연결 오류가 발생했습니다.');
      } finally {
        setIsVerifying(false);
      }
    }, 1500);
  };

  return (
    <div className={cn("flex flex-col w-full", className)}>
      {/* Verification Options */}
      <div className="flex flex-col gap-4 relative">
        <button 
          onClick={() => handleVerify('MOBILE')}
          disabled={isVerifying}
          className="flex items-center justify-between py-3.5 px-5 bg-white border border-[#eee] rounded-2xl shadow-sm hover:border-blue-200 hover:bg-blue-50/30 transition-all group active:scale-[0.98] disabled:opacity-50"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Smartphone className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-left">
              <div className="text-[13px] sm:text-sm font-black text-[#333]">휴대폰 본인 인증</div>
              <div className="text-[11px] text-[#999]">본인 명의의 휴대폰으로 인증</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#ccc] group-hover:text-blue-400 transition-colors" />
        </button>

        <button 
          onClick={() => handleVerify('IPIN')}
          disabled={isVerifying}
          className="flex items-center justify-between py-3.5 px-5 bg-white border border-[#eee] rounded-2xl shadow-sm hover:border-blue-200 hover:bg-blue-50/30 transition-all group active:scale-[0.98] disabled:opacity-50"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <ShieldCheck className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
            </div>
            <div className="text-left">
              <div className="text-[13px] sm:text-sm font-black text-[#333]">아이핀(i-PIN) 인증</div>
              <div className="text-[11px] text-[#999]">아이핀 아이디/비밀번호로 인증</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#ccc] group-hover:text-blue-400 transition-colors" />
        </button>

        {isVerifying && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-10 animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-blue-600">인증 처리 중...</span>
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
