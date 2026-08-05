'use client';

import { useState, useEffect } from 'react';
import { nvLog } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { normalizeLoginIdForAuth } from '@/src/atoms/ra/auth/RA_LOGIN_ID';
import { Loader2 } from 'lucide-react';
import { FindAccountModal } from '@/components/auth/FindAccountModal';

interface LoginFormProps {
  simpleStyle?: boolean;
}

const INITIAL_FORM = {
  loginId: '',
  password: '',
  autoLogin: false,
};

export function LoginForm({ simpleStyle = false }: LoginFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 계정 정보 찾기 모달 상태
  const [isFindModalOpen, setIsFindModalOpen] = useState(false);
  const [findModalTab, setFindModalTab] = useState<'find-id' | 'find-pw'>('find-id');

  const openFindModal = (tab: 'find-id' | 'find-pw') => {
    setFindModalTab(tab);
    setIsFindModalOpen(true);
  };

  useEffect(() => {
    localStorage.removeItem('foxmon_saved_id');
    setFormData(INITIAL_FORM);
    setError(null);
    setIsLoading(false);
  }, [pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loginId = normalizeLoginIdForAuth(formData.loginId);
    nvLog('FW', '로그인 시도', { loginId });
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        loginId,
        password: formData.password,
        autoLogin: formData.autoLogin ? 'true' : 'false',
        redirect: false,
      });

      if (result?.error) {
        setError('아이디 또는 비밀번호가 일치하지 않습니다.');
        nvLog('FW', '로그인 실패', result.error);
        setIsLoading(false);
      } else {
        nvLog('FW', '로그인 성공 -> 메인 이동 (Hard Refresh)');

        if (!formData.autoLogin) {
            // Set session cookie for PC Bang security. Max-age deleted on browser close.
            document.cookie = "foxmon_auto_login=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "foxmon_transient=1; path=/;";
            document.cookie = "age_verified=true; path=/; SameSite=Lax";
        } else {
            // Keep persistent cookie
            document.cookie = "foxmon_auto_login=1; path=/; max-age=2592000"; // 30 days
            document.cookie = "foxmon_transient=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "age_verified=true; path=/; max-age=2592000; SameSite=Lax";
        }
        
        // Use hard navigation to prevent race condition between router.refresh() and router.push()
        // And keep the loading spinner spinning until the page unmounts
        window.location.href = '/';
      }
    } catch (err) {
      setError('시스템 오류가 발생했습니다. 나중에 다시 시도해 주세요.');
      setIsLoading(false);
    }
  };

  // 회원가입 전 본인인증 선제 실행 핸들러
  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('foxmon_verified_user');
    }
    router.push('/register');
  };

  // --- 1. [Age-Gate 용] Simple Style (Compact & Unified) ---
  if (simpleStyle) {
    return (
      <>
        <form onSubmit={handleSubmit} className="w-full max-w-[320px] mx-auto flex flex-col items-center animate-in fade-in duration-500">
          
          {/* Unified Input - No Toggle needed */}
          <div className="w-full space-y-3 mb-2 mt-0">
            <div className="flex items-center gap-3">
              <Label className="w-[60px] text-right text-[13px] font-black text-[#333] tracking-tight shrink-0">아이디</Label>
              <input
                id="loginId"
                name="foxmon-id"
                type="text"
                inputMode="text"
                placeholder="아이디를 입력하세요"
                value={formData.loginId}
                onChange={(e) => setFormData(prev => ({...prev, loginId: e.target.value}))}
                autoComplete="off"
                className="flex-1 bg-white border border-[#e5e7eb] rounded-xl h-10 text-[13px] px-3 focus:outline-none focus:ring-1 focus:ring-purple-500/30 shadow-sm"
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-[60px] text-right text-[13px] font-black text-[#333] tracking-tight shrink-0">비밀번호</Label>
              <input
                id="foxmon-pw"
                name="foxmon-pw"
                type="text"
                inputMode="text"
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                autoComplete="off"
                style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
                className="flex-1 bg-white border border-[#e5e7eb] rounded-xl h-10 text-[13px] px-3 focus:outline-none focus:ring-1 focus:ring-purple-500/30 shadow-sm"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-[10px] font-bold mb-5 animate-bounce">⚠️ {error}</p>}

          <div className="w-full flex justify-center mb-4 mt-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white h-10 rounded-xl font-black text-[13px] transition-all shadow-lg active:scale-95"
            >
              {isLoading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : '로그인'}
            </Button>
          </div>

          {/* Links Layout */}
          <div className="flex flex-col items-center gap-3 pt-4 border-t border-gray-100 w-full">
            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={() => openFindModal('find-id')}
                className="text-[12px] font-bold text-gray-400 hover:text-purple-600 transition-colors bg-transparent border-none cursor-pointer p-0"
              >
                아이디 찾기
              </button>
              <div className="w-[1px] h-3 bg-gray-200" />
              <button 
                type="button"
                onClick={() => openFindModal('find-pw')}
                className="text-[12px] font-bold text-gray-400 hover:text-purple-600 transition-colors bg-transparent border-none cursor-pointer p-0"
              >
                비밀번호 찾기
              </button>
            </div>

            <div className="flex items-center gap-2 text-[12px] font-bold mt-1.5">
              <span className="text-gray-400">아직 회원이 아니신가요?</span>
              <button 
                type="button"
                onClick={handleRegisterClick}
                className="text-[14px] text-purple-600 hover:text-purple-800 transition-all font-black underline underline-offset-4 decoration-purple-200 decoration-2 bg-transparent border-none cursor-pointer p-0"
              >
                신규 회원가입
              </button>
            </div>
          </div>
        </form>

        {/* 계정 정보 찾기 모달 */}
        <FindAccountModal
          isOpen={isFindModalOpen}
          onClose={() => setIsFindModalOpen(false)}
          defaultTab={findModalTab}
        />
      </>
    );
  }

  // --- 2. [Login Page 용] Premium Style (Unified & Modern) ---
  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Unified Inputs Section */}
        <div className="flex flex-col gap-4 w-full mb-5 mt-2">
          <div className="flex items-center gap-6">
              <Label className="w-24 text-right text-gray-500 text-[13px] font-black uppercase tracking-wider shrink-0">아이디</Label>
              <input
                id="loginId"
                name="foxmon-id"
                type="text"
                inputMode="text"
                placeholder="아이디를 입력하세요"
                value={formData.loginId}
                onChange={(e) => setFormData(prev => ({...prev, loginId: e.target.value}))}
                autoComplete="off"
                className="flex-1 bg-gray-50/50 border border-gray-200 text-gray-900 placeholder:text-gray-400 h-13 rounded-2xl px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-sm transition-all"
                required
              />
          </div>

          <div className="flex items-center gap-6">
              <Label className="w-24 text-right text-gray-500 text-[13px] font-black uppercase tracking-wider shrink-0">비밀번호</Label>
              <input
                id="foxmon-pw"
                name="foxmon-pw"
                type="text"
                inputMode="text"
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                autoComplete="off"
                style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
                className="flex-1 bg-gray-50/50 border border-gray-200 text-gray-900 placeholder:text-gray-400 h-13 rounded-2xl px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-sm transition-all"
                required
              />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-500 text-[11px] font-bold mb-5">
            ⚠️ {error}
          </div>
        )}

        {/* Perfectly sized and centered login button with equal top/bottom spacing */}
        <div className="w-full flex justify-center mb-5 mt-3">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full max-w-[280px] h-14 bg-purple-600 hover:bg-purple-700 text-white font-black text-base rounded-[1rem] transition-all shadow-[0_4px_20px_-4px_rgba(147,51,234,0.4)] hover:shadow-[0_6px_24px_-6px_rgba(147,51,234,0.6)] active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : "로그인"}
          </Button>
        </div>

        {/* Links Layout - Increased font size and perfectly aligned spacing */}
        <div className="flex flex-col items-center gap-4 pt-5 border-t border-gray-100 w-full">
          <div className="flex items-center gap-6">
            <button 
              type="button"
              onClick={() => openFindModal('find-id')}
              className="text-[14px] font-bold text-gray-400 hover:text-purple-600 transition-all bg-transparent border-none cursor-pointer p-0"
            >
              아이디 찾기
            </button>
            <div className="w-[1px] h-3 bg-gray-200" />
            <button 
              type="button"
              onClick={() => openFindModal('find-pw')}
              className="text-[14px] font-bold text-gray-400 hover:text-purple-600 transition-all bg-transparent border-none cursor-pointer p-0"
            >
              비밀번호 찾기
            </button>
          </div>
          
          <div className="flex items-center gap-2.5 text-[15px] font-bold mt-1">
            <span className="text-gray-400">아직 회원이 아니신가요?</span>
            <button 
              type="button"
              onClick={handleRegisterClick}
              className="text-[18px] text-purple-600 hover:text-purple-800 transition-all font-black underline underline-offset-4 decoration-purple-200 decoration-2 tracking-tight bg-transparent border-none cursor-pointer p-0"
            >
              신규 회원가입
            </button>
          </div>
        </div>
      </form>

      {/* 계정 정보 찾기 모달 */}
      <FindAccountModal
        isOpen={isFindModalOpen}
        onClose={() => setIsFindModalOpen(false)}
        defaultTab={findModalTab}
      />
    </>
  );
}
