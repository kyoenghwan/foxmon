'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Smartphone, ShieldCheck, ChevronRight, X } from 'lucide-react';
import { nvLog } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

function AgeVerificationBoxContent({ onVerifySuccess, className }: AgeVerificationBoxProps) {
  const searchParams = useSearchParams();
  const isTestMode = searchParams?.get('test') === '1' || searchParams?.get('bypass') === '1' || searchParams?.get('mock') === '1';

  const [isVerifying, setIsVerifying] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '홍길동',
    birthDate: '19900101',
    gender: 'MALE',
    phoneNumber: '01012345678',
    nationality: 'KOREAN' as const,
  });

  const handleRealCertification = () => {
    const { IMP } = window as any;
    if (!IMP) {
      alert('본인인증 모듈이 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    const userImpCode = process.env.NEXT_PUBLIC_PORTONE_IMP_CODE || 'imp13555262';
    IMP.init(userImpCode);
    setIsVerifying(true);

    IMP.certification({
      pg: 'danal',
      merchant_uid: `cert_${Date.now()}`,
      popup: true
    }, function (rsp: any) {
      setIsVerifying(false);
      if (rsp.success) {
        document.cookie = "age_verified=true; path=/; max-age=3600; SameSite=Lax; Secure";
        const mockVerifiedData = {
          name: '심사자',
          birthDate: '19900101',
          gender: 'MALE',
          phoneNumber: '01012345678',
          nationality: 'KOREAN' as const
        };
        sessionStorage.setItem('foxmon_verified_user', JSON.stringify(mockVerifiedData));
        if (onVerifySuccess) {
          onVerifySuccess(mockVerifiedData);
        }
      } else {
        alert(`본인인증 실패: ${rsp.error_msg}`);
      }
    });
  };

  const handleVerifyClick = (type: string) => {
    nvLog('FW', `성인 인증 폼 열기: ${type}`);
    setShowForm(true);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    
    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authMethod: 'MOBILE',
          userRawData: formData
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        nvLog('FW', '성인 인증 완료 (Manual Mock)', formData);
        if (onVerifySuccess) onVerifySuccess(formData);
      } else {
        alert(result.message || '인증에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결 오류가 발생했습니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (showForm) {
    return (
      <div className={cn("flex flex-col w-full bg-white border border-gray-200 rounded-2xl p-5 shadow-sm animate-in fade-in zoom-in-95", className)}>
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
          <h3 className="text-sm font-black text-gray-800">PG 임시 테스트 폼</h3>
          <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-red-500">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-gray-600">이름</Label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="h-10 text-sm"
              required 
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold text-gray-600">생년월일 (YYYYMMDD)</Label>
            <Input 
              value={formData.birthDate} 
              onChange={e => setFormData({...formData, birthDate: e.target.value})} 
              className="h-10 text-sm"
              maxLength={8}
              required 
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold text-gray-600">성별</Label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="gender" 
                  checked={formData.gender === 'MALE'} 
                  onChange={() => setFormData({...formData, gender: 'MALE'})} 
                  className="text-purple-600"
                />
                <span className="text-sm font-bold">남성</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="gender" 
                  checked={formData.gender === 'FEMALE'} 
                  onChange={() => setFormData({...formData, gender: 'FEMALE'})} 
                  className="text-purple-600"
                />
                <span className="text-sm font-bold">여성</span>
              </label>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold text-gray-600">휴대폰 번호</Label>
            <Input 
              value={formData.phoneNumber} 
              onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
              className="h-10 text-sm"
              required 
            />
          </div>
          <Button 
            type="submit" 
            disabled={isVerifying} 
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black mt-2"
          >
            {isVerifying ? '처리 중...' : '인증 완료 처리하기'}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col w-full", className)}>
      {/* Verification Options */}
      <div className="flex flex-col gap-3 relative">
        {/* 실제 다날 인증 버튼 */}
        <button 
          onClick={handleRealCertification}
          disabled={isVerifying}
          className="flex items-center justify-between py-2.5 px-4 bg-purple-50/50 border border-purple-200 rounded-2xl shadow-sm hover:border-purple-300 hover:bg-purple-50 transition-all group active:scale-[0.98] disabled:opacity-50 w-full"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100/50 rounded-xl flex items-center justify-center group-hover:bg-purple-200/50 transition-colors">
              <Smartphone className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <div className="text-[13px] sm:text-sm font-black text-purple-950">휴대폰 본인 인증</div>
              <div className="text-[11px] text-purple-600/70 font-semibold">휴대폰을 통한 만 19세 이상 성인 인증</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-purple-400 group-hover:text-purple-600 transition-colors" />
        </button>

        {/* 임시 테스트용 버튼 (URL 쿼리 ?test=1 혹은 ?mock=1 진입 시에만 제한적으로 노출) */}
        {isTestMode && (
          <button 
            onClick={() => handleVerifyClick('MOBILE')}
            disabled={isVerifying}
            className="flex items-center justify-between py-2.5 px-4 bg-white border border-[#eee] rounded-2xl shadow-sm hover:border-blue-200 hover:bg-blue-50/30 transition-all group active:scale-[0.98] disabled:opacity-50 w-full"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Smartphone className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-left">
                <div className="text-[13px] sm:text-sm font-black text-[#333]">휴대폰 인증 (임시 테스트용)</div>
                <div className="text-[11px] text-[#999]">개발 및 회원가입 테스트용 간편 폼</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#ccc] group-hover:text-blue-400 transition-colors" />
          </button>
        )}

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

export function AgeVerificationBox(props: AgeVerificationBoxProps) {
  return (
    <Suspense fallback={<div className="h-20 flex items-center justify-center text-xs text-gray-400">로딩 중...</div>}>
      <AgeVerificationBoxContent {...props} />
    </Suspense>
  );
}
