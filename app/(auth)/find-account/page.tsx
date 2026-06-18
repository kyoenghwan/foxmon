'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Smartphone, Mail, ChevronRight, Loader2, Check, Eye, EyeOff, KeyRound, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AgeVerificationBox } from '@/src/components/auth/AgeVerificationBox';

type TabType = 'find-id' | 'find-pw';
type MethodType = 'phone' | 'email';

function FindAccountContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('find-id');
  const [method, setMethod] = useState<MethodType>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 아이디 찾기 결과
  const [foundAccounts, setFoundAccounts] = useState<Array<{ loginId: string; createdAt: string }>>([]);

  // 이메일 방식 폼
  const [emailForm, setEmailForm] = useState({ name: '', email: '', loginId: '' });

  // 비밀번호 재설정 폼
  const [resetForm, setResetForm] = useState({ loginId: '', newPassword: '', confirmPassword: '' });
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [verifiedCi, setVerifiedCi] = useState('');
  const [pwResetStep, setPwResetStep] = useState<'input-id' | 'verify' | 'new-password' | 'done'>('input-id');

  // 본인인증 결과 (아이디 찾기용)
  const [idFindStep, setIdFindStep] = useState<'verify' | 'result'>('verify');

  const resetState = () => {
    setMessage(null);
    setFoundAccounts([]);
    setEmailForm({ name: '', email: '', loginId: '' });
    setResetForm({ loginId: '', newPassword: '', confirmPassword: '' });
    setVerifiedCi('');
    setPwResetStep('input-id');
    setIdFindStep('verify');
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    resetState();
  };

  const handleMethodChange = (m: MethodType) => {
    setMethod(m);
    resetState();
  };

  // 본인인증 성공 → 아이디 찾기 (CI로 조회)
  const handleIdFindVerifySuccess = async (data: any) => {
    if (!data.ci) {
      setMessage({ type: 'error', text: 'CI 정보를 받을 수 없습니다. 관리자에게 문의해주세요.' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/find-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'phone', ci: data.ci }),
      });
      const result = await res.json();

      if (result.success && result.accounts) {
        setFoundAccounts(result.accounts);
        setIdFindStep('result');
      } else {
        setMessage({ type: 'error', text: result.message || '가입된 아이디가 없습니다.' });
      }
    } catch {
      setMessage({ type: 'error', text: '서버 통신 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  // 이메일로 아이디 찾기
  const handleEmailFindId = async () => {
    if (!emailForm.name || !emailForm.email) {
      setMessage({ type: 'error', text: '이름과 이메일을 모두 입력해주세요.' });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/find-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'email', name: emailForm.name, email: emailForm.email }),
      });
      const result = await res.json();
      setMessage({ type: 'success', text: result.message });
    } catch {
      setMessage({ type: 'error', text: '서버 통신 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  // 본인인증 성공 → 비밀번호 찾기 (CI 저장)
  const handlePwVerifySuccess = (data: any) => {
    if (!data.ci) {
      setMessage({ type: 'error', text: 'CI 정보를 받을 수 없습니다.' });
      return;
    }
    setVerifiedCi(data.ci);
    setPwResetStep('new-password');
  };

  // 본인인증으로 비밀번호 즉시 재설정
  const handlePhoneResetPassword = async () => {
    if (!resetForm.newPassword || resetForm.newPassword.length < 4) {
      setMessage({ type: 'error', text: '비밀번호는 4자 이상 입력해주세요.' });
      return;
    }
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setMessage({ type: 'error', text: '비밀번호가 일치하지 않습니다.' });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-and-reset',
          loginId: resetForm.loginId,
          ci: verifiedCi,
          newPassword: resetForm.newPassword,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setPwResetStep('done');
        setMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch {
      setMessage({ type: 'error', text: '서버 통신 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  // 이메일로 비밀번호 재설정 링크 발송
  const handleEmailResetPassword = async () => {
    if (!emailForm.loginId || !emailForm.email) {
      setMessage({ type: 'error', text: '아이디와 이메일을 모두 입력해주세요.' });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-reset-link',
          loginId: emailForm.loginId,
          email: emailForm.email,
        }),
      });
      const result = await res.json();
      setMessage({ type: 'success', text: result.message });
    } catch {
      setMessage({ type: 'error', text: '서버 통신 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 py-8 bg-[#f8f9fa]">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-500">

        {/* Back Button */}
        <button
          onClick={() => router.push('/age-gate')}
          type="button"
          className="absolute top-6 left-6 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 hover:bg-purple-100 text-gray-500 hover:text-purple-700 transition-all shadow-sm backdrop-blur-md border border-purple-100"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>

        {/* Brand Header */}
        <div className="bg-gradient-to-b from-purple-100/50 to-white px-8 pt-12 pb-6 flex flex-col items-center gap-2 border-b border-gray-50 relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
          <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
          <div className="relative z-10 w-[180px] flex justify-center">
            <Image src="/foxmon_log.png" alt="FOXMON" width={1600} height={400} priority className="w-full h-auto object-contain" />
          </div>
          <p className="text-purple-600 text-[10px] font-black tracking-widest uppercase relative z-10">계정 정보 찾기</p>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Tab Selector */}
          <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
            <button
              onClick={() => handleTabChange('find-id')}
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === 'find-id'
                  ? 'bg-white text-purple-700 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User size={16} /> 아이디 찾기
            </button>
            <button
              onClick={() => handleTabChange('find-pw')}
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === 'find-pw'
                  ? 'bg-white text-purple-700 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <KeyRound size={16} /> 비밀번호 찾기
            </button>
          </div>

          {/* Method Selector */}
          <div className="flex gap-3">
            <button
              onClick={() => handleMethodChange('phone')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all text-center ${
                method === 'phone'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
              }`}
            >
              <Smartphone className="mx-auto mb-2" size={24} />
              <span className="text-xs font-black block">본인인증</span>
              <span className="text-[10px] text-gray-400 font-medium block mt-0.5">즉시 확인</span>
            </button>
            <button
              onClick={() => handleMethodChange('email')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all text-center ${
                method === 'email'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
              }`}
            >
              <Mail className="mx-auto mb-2" size={24} />
              <span className="text-xs font-black block">이메일</span>
              <span className="text-[10px] text-gray-400 font-medium block mt-0.5">메일로 안내</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="min-h-[200px] animate-in fade-in duration-300">

            {/* ===== 아이디 찾기 — 본인인증 ===== */}
            {activeTab === 'find-id' && method === 'phone' && (
              <div className="space-y-4">
                {idFindStep === 'verify' && (
                  <>
                    <p className="text-gray-500 text-sm font-medium text-center mb-4">
                      휴대폰 본인인증으로 가입된 아이디를 찾습니다.
                    </p>
                    <AgeVerificationBox onVerifySuccess={handleIdFindVerifySuccess} />
                  </>
                )}
                {idFindStep === 'result' && foundAccounts.length > 0 && (
                  <div className="space-y-5">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-green-100">
                        <Check className="text-green-500" size={32} />
                      </div>
                      <p className="text-lg font-black text-gray-900">가입된 아이디를 찾았습니다</p>
                    </div>
                    <div className="bg-purple-50/80 border border-purple-100 rounded-2xl p-5 space-y-3">
                      {foundAccounts.map((acc, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-purple-100/50 last:border-b-0">
                          <span className="text-purple-700 font-black text-lg tracking-tight">{acc.loginId}</span>
                          <span className="text-gray-400 text-xs font-medium">
                            가입일: {new Date(acc.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={() => router.push('/age-gate')}
                      className="w-full h-13 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-lg shadow-purple-600/20 text-base"
                    >
                      로그인하러 가기
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ===== 아이디 찾기 — 이메일 ===== */}
            {activeTab === 'find-id' && method === 'email' && (
              <div className="space-y-4">
                <p className="text-gray-500 text-sm font-medium text-center mb-2">
                  가입 시 등록한 이메일로 아이디를 발송합니다.
                </p>
                <div className="space-y-3">
                  <div>
                    <Label className="text-gray-600 text-[13px] font-black mb-1.5 block">이름</Label>
                    <Input
                      placeholder="가입 시 인증한 이름"
                      value={emailForm.name}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-gray-50/50 border-gray-200 h-12 rounded-xl text-sm font-medium"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-600 text-[13px] font-black mb-1.5 block">이메일</Label>
                    <Input
                      type="email"
                      placeholder="가입 시 등록한 이메일"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-gray-50/50 border-gray-200 h-12 rounded-xl text-sm font-medium"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleEmailFindId}
                  disabled={isLoading}
                  className="w-full h-13 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-lg shadow-purple-600/20 text-base"
                >
                  {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : '아이디 찾기'}
                </Button>
              </div>
            )}

            {/* ===== 비밀번호 찾기 — 본인인증 ===== */}
            {activeTab === 'find-pw' && method === 'phone' && (
              <div className="space-y-4">
                {pwResetStep === 'input-id' && (
                  <>
                    <p className="text-gray-500 text-sm font-medium text-center mb-2">
                      비밀번호를 재설정할 아이디를 입력하세요.
                    </p>
                    <div>
                      <Label className="text-gray-600 text-[13px] font-black mb-1.5 block">아이디</Label>
                      <Input
                        placeholder="아이디 입력"
                        value={resetForm.loginId}
                        onChange={(e) => setResetForm(prev => ({ ...prev, loginId: e.target.value }))}
                        className="bg-gray-50/50 border-gray-200 h-12 rounded-xl text-sm font-medium"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        if (!resetForm.loginId) {
                          setMessage({ type: 'error', text: '아이디를 입력해주세요.' });
                          return;
                        }
                        setMessage(null);
                        setPwResetStep('verify');
                      }}
                      className="w-full h-13 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-lg shadow-purple-600/20 text-base flex items-center justify-center gap-2"
                    >
                      다음 <ChevronRight size={18} />
                    </Button>
                  </>
                )}
                {pwResetStep === 'verify' && (
                  <>
                    <p className="text-gray-500 text-sm font-medium text-center mb-4">
                      <strong className="text-purple-700">{resetForm.loginId}</strong> 계정의 본인인증을 진행하세요.
                    </p>
                    <AgeVerificationBox onVerifySuccess={handlePwVerifySuccess} />
                  </>
                )}
                {pwResetStep === 'new-password' && (
                  <>
                    <div className="text-center mb-3">
                      <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-green-100">
                        <Check className="text-green-500" size={28} />
                      </div>
                      <p className="text-sm font-black text-green-700">본인인증 완료</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-gray-600 text-[13px] font-black mb-1.5 block">새 비밀번호</Label>
                        <div className="relative">
                          <Input
                            type={showNewPw ? 'text' : 'password'}
                            placeholder="4~12자 입력"
                            value={resetForm.newPassword}
                            onChange={(e) => setResetForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="bg-gray-50/50 border-gray-200 h-12 rounded-xl text-sm pr-10 font-medium"
                          />
                          <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors" tabIndex={-1}>
                            {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-600 text-[13px] font-black mb-1.5 block">새 비밀번호 확인</Label>
                        <div className="relative">
                          <Input
                            type={showConfirmPw ? 'text' : 'password'}
                            placeholder="비밀번호 다시 입력"
                            value={resetForm.confirmPassword}
                            onChange={(e) => setResetForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="bg-gray-50/50 border-gray-200 h-12 rounded-xl text-sm pr-10 font-medium"
                          />
                          <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors" tabIndex={-1}>
                            {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handlePhoneResetPassword}
                      disabled={isLoading}
                      className="w-full h-13 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-lg shadow-purple-600/20 text-base"
                    >
                      {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : '비밀번호 변경하기'}
                    </Button>
                  </>
                )}
                {pwResetStep === 'done' && (
                  <div className="space-y-5 text-center py-4">
                    <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto border-4 border-purple-100">
                      <Check className="text-purple-600" size={40} />
                    </div>
                    <div>
                      <p className="text-xl font-black text-gray-900">비밀번호가 변경되었습니다</p>
                      <p className="text-gray-500 text-sm mt-1">새 비밀번호로 로그인해주세요.</p>
                    </div>
                    <Button
                      onClick={() => router.push('/age-gate')}
                      className="w-full h-13 bg-gray-800 hover:bg-black text-white font-black rounded-2xl shadow-xl text-base"
                    >
                      로그인하러 가기
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ===== 비밀번호 찾기 — 이메일 ===== */}
            {activeTab === 'find-pw' && method === 'email' && (
              <div className="space-y-4">
                <p className="text-gray-500 text-sm font-medium text-center mb-2">
                  가입 시 등록한 이메일로 비밀번호 재설정 링크를 발송합니다.
                </p>
                <div className="space-y-3">
                  <div>
                    <Label className="text-gray-600 text-[13px] font-black mb-1.5 block">아이디</Label>
                    <Input
                      placeholder="아이디 입력"
                      value={emailForm.loginId}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, loginId: e.target.value }))}
                      className="bg-gray-50/50 border-gray-200 h-12 rounded-xl text-sm font-medium"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-600 text-[13px] font-black mb-1.5 block">이메일</Label>
                    <Input
                      type="email"
                      placeholder="가입 시 등록한 이메일"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-gray-50/50 border-gray-200 h-12 rounded-xl text-sm font-medium"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleEmailResetPassword}
                  disabled={isLoading}
                  className="w-full h-13 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-lg shadow-purple-600/20 text-base"
                >
                  {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : '재설정 링크 발송'}
                </Button>
              </div>
            )}
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-2xl text-sm font-bold animate-in fade-in flex items-start gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {message.type === 'error' && <AlertCircle size={16} className="shrink-0 mt-0.5" />}
              {message.type === 'success' && <Check size={16} className="shrink-0 mt-0.5" />}
              {message.text}
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-100">
            <button
              onClick={() => router.push('/age-gate')}
              className="text-sm font-bold text-gray-400 hover:text-purple-600 transition-colors"
            >
              ← 로그인 화면으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FindAccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-purple-600">불러오는 중...</div>}>
      <FindAccountContent />
    </Suspense>
  );
}
