'use client';

import { useState } from 'react';
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

export function AgeVerificationBox({ onVerifySuccess, className }: AgeVerificationBoxProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '홍길동',
    birthDate: '19900101',
    gender: 'MALE',
    phoneNumber: '01012345678',
    nationality: 'KOREAN' as const,
  });

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
          authMethod: 'MANUAL_MOCK',
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
        <button 
          onClick={() => handleVerifyClick('MOBILE')}
          disabled={isVerifying}
          className="flex items-center justify-between py-2.5 px-4 bg-white border border-[#eee] rounded-2xl shadow-sm hover:border-blue-200 hover:bg-blue-50/30 transition-all group active:scale-[0.98] disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Smartphone className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-left">
              <div className="text-[13px] sm:text-sm font-black text-[#333]">휴대폰 본인 인증</div>
              <div className="text-[11px] text-[#999]">본인 명의의 휴대폰으로 인증</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#ccc] group-hover:text-blue-400 transition-colors" />
        </button>

        <button 
          onClick={() => handleVerifyClick('IPIN')}
          disabled={isVerifying}
          className="flex items-center justify-between py-2.5 px-4 bg-white border border-[#eee] rounded-2xl shadow-sm hover:border-blue-200 hover:bg-blue-50/30 transition-all group active:scale-[0.98] disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <ShieldCheck className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
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
