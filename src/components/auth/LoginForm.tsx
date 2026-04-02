'use client';

import { useState, useEffect } from 'react';
import { nvLog } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface LoginFormProps {
  simpleStyle?: boolean;
}

export function LoginForm({ simpleStyle = false }: LoginFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    autoLogin: false,
    rememberId: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem('foxmon_saved_id');
    if (savedId) {
      setFormData(prev => ({ ...prev, loginId: savedId, rememberId: true }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    nvLog('FW', '로그인 시도', { loginId: formData.loginId });
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        loginId: formData.loginId,
        password: formData.password,
        autoLogin: formData.autoLogin ? 'true' : 'false',
        redirect: false,
      });

      if (result?.error) {
        setError('아이디 또는 비밀번호가 일치하지 않습니다.');
        nvLog('FW', '로그인 실패', result.error);
      } else {
        nvLog('FW', '로그인 성공 -> 메인 이동 (Hard Refresh)');

        if (formData.rememberId) {
            localStorage.setItem('foxmon_saved_id', formData.loginId);
        } else {
            localStorage.removeItem('foxmon_saved_id');
        }

        if (!formData.autoLogin) {
            // Set session cookie for PC Bang security. Max-age deleted on browser close.
            document.cookie = "foxmon_auto_login=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "foxmon_transient=1; path=/;";
        } else {
            // Keep persistent cookie
            document.cookie = "foxmon_auto_login=1; path=/; max-age=2592000"; // 30 days
            document.cookie = "foxmon_transient=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
        
        // Fast client-side navigation instead of hard refresh
        router.refresh();
        router.push('/');
      }
    } catch (err) {
      setError('시스템 오류가 발생했습니다. 나중에 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 1. [Age-Gate 용] Simple Style (Compact & Unified) ---
  if (simpleStyle) {
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-[320px] mx-auto flex flex-col items-center animate-in fade-in duration-500">
        
        {/* Unified Input - No Toggle needed */}
        <div className="w-full space-y-3 mb-4 mt-2">
          <div className="flex items-center gap-3">
            <Label className="w-[60px] text-right text-[13px] font-black text-[#333] tracking-tight shrink-0">아이디</Label>
            <Input
              id="loginId"
              type="text"
              placeholder="아이디를 입력하세요"
              value={formData.loginId}
              onChange={(e) => setFormData(prev => ({...prev, loginId: e.target.value}))}
              className="flex-1 bg-white border-[#e5e7eb] rounded-xl h-10 text-[13px] focus-visible:ring-1 focus-visible:ring-purple-500/30 shadow-sm"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <Label className="w-[60px] text-right text-[13px] font-black text-[#333] tracking-tight shrink-0">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
              className="flex-1 bg-white border-[#e5e7eb] rounded-xl h-10 text-[13px] focus-visible:ring-1 focus-visible:ring-purple-500/30 shadow-sm"
              required
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-[10px] font-bold mb-5 animate-bounce">⚠️ {error}</p>}

        {/* Checkboxes Group */}
        <div className="w-full flex justify-center gap-8 mb-5 mt-1">
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={formData.rememberId}
              onChange={(e) => setFormData(prev => ({...prev, rememberId: e.target.checked}))}
              className="w-3.5 h-3.5 rounded text-purple-600 border-gray-300 focus:ring-purple-500 shadow-sm"
            />
            <span className="text-[11px] font-bold text-gray-500 group-hover:text-purple-600 transition-colors">
              아이디 저장
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={formData.autoLogin}
              onChange={(e) => setFormData(prev => ({...prev, autoLogin: e.target.checked}))}
              className="w-3.5 h-3.5 rounded text-purple-600 border-gray-300 focus:ring-purple-500 shadow-sm"
            />
            <span className="text-[11px] font-bold text-gray-500 group-hover:text-purple-600 transition-colors">
              자동 로그인
            </span>
          </label>
        </div>

        <div className="w-full flex justify-center mb-6">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white h-10 rounded-xl font-black text-[13px] transition-all shadow-lg active:scale-95"
          >
            {isLoading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : '로그인'}
          </Button>
        </div>

        {/* Links Layout */}
        <div className="flex flex-col items-center gap-4 pt-5 border-t border-gray-100 w-full">
          <div className="flex items-center gap-4">
            <Link 
              href="/find-account" 
              className="text-[12px] font-bold text-gray-400 hover:text-purple-600 transition-colors"
            >
              아이디 찾기
            </Link>
            <div className="w-[1px] h-3 bg-gray-200" />
            <Link 
              href="/find-account" 
              className="text-[12px] font-bold text-gray-400 hover:text-purple-600 transition-colors"
            >
              비밀번호 찾기
            </Link>
          </div>

          <div className="flex items-center gap-2 text-[12px] font-bold mt-1.5">
            <span className="text-gray-400">아직 회원이 아니신가요?</span>
            <Link 
              href="/register" 
              className="text-[14px] text-purple-600 hover:text-purple-800 transition-all font-black underline underline-offset-4 decoration-purple-200 decoration-2"
            >
              신규 회원가입
            </Link>
          </div>
        </div>
      </form>
    );
  }

  // --- 2. [Login Page 용] Premium Style (Unified & Modern) ---
  return (
    <form onSubmit={handleSubmit} className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Unified Inputs Section */}
      <div className="flex flex-col gap-5 w-full mb-7 mt-4">
        <div className="flex items-center gap-6">
            <Label className="w-24 text-right text-gray-500 text-[13px] font-black uppercase tracking-wider shrink-0">아이디</Label>
            <Input
              id="loginId"
              type="text"
              placeholder="아이디를 입력하세요"
              value={formData.loginId}
              onChange={(e) => setFormData(prev => ({...prev, loginId: e.target.value}))}
              className="flex-1 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 h-13 rounded-2xl px-5 text-sm font-medium focus-visible:ring-purple-500/50 shadow-sm transition-all"
              required
            />
        </div>

        <div className="flex items-center gap-6">
            <Label className="w-24 text-right text-gray-500 text-[13px] font-black uppercase tracking-wider shrink-0">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
              className="flex-1 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 h-13 rounded-2xl px-5 text-sm font-medium focus-visible:ring-purple-500/50 shadow-sm transition-all"
              required
            />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-500 text-[11px] font-bold mb-5">
          ⚠️ {error}
        </div>
      )}

      {/* Checkboxes Group */}
      <div className="flex justify-center gap-8 mb-6 mt-1 w-full max-w-[280px] mx-auto">
        <label className="flex items-center gap-1.5 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={formData.rememberId}
            onChange={(e) => setFormData(prev => ({...prev, rememberId: e.target.checked}))}
            className="w-4 h-4 rounded text-purple-600 border-gray-300 focus:ring-purple-500 shadow-sm"
          />
          <span className="text-[12px] font-bold text-gray-500 group-hover:text-purple-600 transition-colors">
            아이디 저장
          </span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={formData.autoLogin}
            onChange={(e) => setFormData(prev => ({...prev, autoLogin: e.target.checked}))}
            className="w-4 h-4 rounded text-purple-600 border-gray-300 focus:ring-purple-500 shadow-sm"
          />
          <span className="text-[12px] font-bold text-gray-500 group-hover:text-purple-600 transition-colors">
            자동 로그인
          </span>
        </label>
      </div>

      {/* Perfectly sized and centered login button with equal top/bottom spacing */}
      <div className="w-full flex justify-center mb-7">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full max-w-[280px] h-14 bg-purple-600 hover:bg-purple-700 text-white font-black text-base rounded-[1rem] transition-all shadow-[0_4px_20px_-4px_rgba(147,51,234,0.4)] hover:shadow-[0_6px_24px_-6px_rgba(147,51,234,0.6)] active:scale-[0.98]"
        >
          {isLoading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : "로그인"}
        </Button>
      </div>

      {/* Links Layout - Increased font size and perfectly aligned spacing */}
      <div className="flex flex-col items-center gap-5 pt-7 border-t border-gray-100 w-full">
        <div className="flex items-center gap-6">
          <Link 
            href="/find-account" 
            className="text-[14px] font-bold text-gray-400 hover:text-purple-600 transition-all"
          >
            아이디 찾기
          </Link>
          <div className="w-[1px] h-3 bg-gray-200" />
          <Link 
            href="/find-account" 
            className="text-[14px] font-bold text-gray-400 hover:text-purple-600 transition-all"
          >
            비밀번호 찾기
          </Link>
        </div>
        
        <div className="flex items-center gap-2.5 text-[15px] font-bold mt-1">
          <span className="text-gray-400">아직 회원이 아니신가요?</span>
          <Link 
            href="/register" 
            className="text-[18px] text-purple-600 hover:text-purple-800 transition-all font-black underline underline-offset-4 decoration-purple-200 decoration-2 tracking-tight"
          >
            신규 회원가입
          </Link>
        </div>
      </div>
    </form>
  );
}
