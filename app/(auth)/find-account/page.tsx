'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, KeyRound, Check, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AgeVerificationBox } from '@/src/components/auth/AgeVerificationBox';

type TabType = 'find-id' | 'find-pw';

function FindAccountContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('find-id');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 아이디 찾기 결과
  const [foundAccounts, setFoundAccounts] = useState<Array<{ loginId: string; createdAt: string }>>([]);
  const [idFindStep, setIdFindStep] = useState<'verify' | 'result'>('verify');

  // 비밀번호 찾기 (재설정) 폼 상태
  const [pwResetStep, setPwResetStep] = useState<'input-id' | 'verify' | 'new-password' | 'done'>('input-id');
  const [resetForm, setResetForm] = useState({ loginId: '', newPassword: '', confirmPassword: '' });
  const [verifiedCi, setVerifiedCi] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const resetAllState = () => {
    setMessage(null);
    setFoundAccounts([]);
    setIdFindStep('verify');
    setPwResetStep('input-id');
    setResetForm({ loginId: '', newPassword: '', confirmPassword: '' });
    setVerifiedCi('');
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    resetAllState();
  };

  // 1. [아이디 찾기] 본인인증 성공 시 CI 및 휴대폰 번호로 아이디 조회
  const handleIdFindVerifySuccess = async (data: any) => {
    if (!data.ci && !data.phoneNumber) {
      setMessage({ type: 'error', text: '인증 정보를 가져오지 못했습니다.' });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/find-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          method: 'phone', 
          ci: data.ci, 
          phoneNumber: data.phoneNumber 
        }),
      });
      const result = await res.json();

      if (result.success && result.accounts && result.accounts.length > 0) {
        setFoundAccounts(result.accounts);
        setIdFindStep('result');
      } else {
        setMessage({ type: 'error', text: result.message || '가입된 계정을 찾을 수 없습니다.' });
      }
    } catch {
      setMessage({ type: 'error', text: '서버 통신 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. [비밀번호 찾기] 1단계: 아이디 입력 제출
  const handlePwInputIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetForm.loginId.trim()) {
      setMessage({ type: 'error', text: '아이디를 입력해 주세요.' });
      return;
    }
    setMessage(null);
    setPwResetStep('verify');
  };

  // [비밀번호 찾기] 2단계: 본인인증 성공 시
  const handlePwVerifySuccess = (data: any) => {
    if (!data.ci) {
      setMessage({ type: 'error', text: '인증 정보(CI)를 가져오지 못했습니다.' });
      return;
    }
    setVerifiedCi(data.ci);
    setPwResetStep('new-password');
    setMessage(null);
  };

  // [비밀번호 찾기] 3단계: 비밀번호 변경
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetForm.newPassword || resetForm.newPassword.length < 4) {
      setMessage({ type: 'error', text: '비밀번호는 4자 이상 입력해 주세요.' });
      return;
    }
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setMessage({ type: 'error', text: '비밀번호 확인이 일치하지 않습니다.' });
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
          loginId: resetForm.loginId.trim(),
          ci: verifiedCi,
          newPassword: resetForm.newPassword,
        }),
      });
      const result = await res.json();

      if (result.success) {
        setPwResetStep('done');
        setMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' });
      } else {
        setMessage({ type: 'error', text: result.message || '비밀번호 변경 실패' });
      }
    } catch {
      setMessage({ type: 'error', text: '서버 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 py-8 bg-[#f8f9fa]">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-500">
        
        {/* 뒤로가기 버튼: 로그인 화면으로 직접 돌아가도록 처리 */}
        <button
          onClick={() => router.push('/login')}
          type="button"
          className="absolute top-6 left-6 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 hover:bg-purple-100 text-gray-500 hover:text-purple-700 transition-all shadow-sm backdrop-blur-md border border-purple-100"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>

        {/* 헤더 */}
        <div className="bg-gradient-to-b from-purple-100/50 to-white px-8 pt-12 pb-6 flex flex-col items-center gap-2 border-b border-gray-50 relative">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-1">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">계정 정보 찾기</h1>
          <p className="text-xs font-semibold text-gray-500">휴대폰 본인인증으로 안전하게 찾으실 수 있습니다</p>
        </div>

        {/* 본문 콘텐츠 */}
        <div className="p-6 md:p-8 space-y-4">
          {/* 탭 전환 */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-gray-100/80 rounded-2xl">
            <button
              type="button"
              onClick={() => handleTabChange('find-id')}
              className={`py-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'find-id'
                  ? 'bg-white text-purple-700 shadow-md'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>아이디 찾기</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('find-pw')}
              className={`py-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'find-pw'
                  ? 'bg-white text-purple-700 shadow-md'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>비밀번호 찾기</span>
            </button>
          </div>

          {/* 알림 메시지 */}
          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
              }`}
            >
              <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{message.text}</span>
            </div>
          )}

          {/* 1. 아이디 찾기 */}
          {activeTab === 'find-id' && (
            <div className="py-2">
              {idFindStep === 'verify' ? (
                <div className="flex flex-col items-center space-y-4">
                  <p className="text-xs text-center text-gray-500 font-medium leading-relaxed">
                    본인인증(드림시큐리티)을 완료하시면<br />가입되어 있는 아이디 목록을 바로 확인하실 수 있습니다.
                  </p>
                  <div className="w-full">
                    <AgeVerificationBox onVerifySuccess={handleIdFindVerifySuccess} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  <div className="text-center pb-2">
                    <p className="text-xs font-bold text-gray-500">본인인증으로 조회된 가입 계정입니다.</p>
                  </div>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {foundAccounts.map((acc, idx) => (
                      <div key={idx} className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-purple-600" />
                          </div>
                          <span className="text-base font-black text-purple-950">{acc.loginId}</span>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">
                          {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => router.push('/login')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12 font-black text-sm mt-2"
                  >
                    로그인하러 가기
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 2. 비밀번호 찾기 */}
          {activeTab === 'find-pw' && (
            <div className="py-2">
              {pwResetStep === 'input-id' && (
                <form onSubmit={handlePwInputIdSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-700">비밀번호를 찾을 아이디</Label>
                    <Input
                      type="text"
                      placeholder="가입한 아이디를 입력하세요"
                      value={resetForm.loginId}
                      onChange={(e) => setResetForm((prev) => ({ ...prev, loginId: e.target.value }))}
                      className="h-12 rounded-xl text-sm font-medium border-gray-200 focus:ring-2 focus:ring-purple-500/20"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 rounded-xl font-black text-sm"
                  >
                    다음 (본인인증 진행)
                  </Button>
                </form>
              )}

              {pwResetStep === 'verify' && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs font-bold text-purple-800 w-full text-center">
                    아이디: <span className="font-black underline">{resetForm.loginId}</span>의 소유자 확인을 위해 본인인증을 진행합니다.
                  </div>
                  <div className="w-full">
                    <AgeVerificationBox onVerifySuccess={handlePwVerifySuccess} />
                  </div>
                </div>
              )}

              {pwResetStep === 'new-password' && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4 animate-in fade-in">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 text-center">
                    본인인증이 완료되었습니다. 새 비밀번호를 설정하세요.
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-700">새 비밀번호</Label>
                    <div className="relative">
                      <Input
                        type={showNewPw ? 'text' : 'password'}
                        placeholder="새 비밀번호 입력 (4자 이상)"
                        value={resetForm.newPassword}
                        onChange={(e) => setResetForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                        className="h-12 rounded-xl text-sm font-medium border-gray-200 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-700">새 비밀번호 확인</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPw ? 'text' : 'password'}
                        placeholder="새 비밀번호 확인 입력"
                        value={resetForm.confirmPassword}
                        onChange={(e) => setResetForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        className="h-12 rounded-xl text-sm font-medium border-gray-200 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 rounded-xl font-black text-sm"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '비밀번호 변경하기'}
                  </Button>
                </form>
              )}

              {pwResetStep === 'done' && (
                <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <p className="text-base font-black text-gray-900">비밀번호가 정상 변경되었습니다.</p>
                  <p className="text-xs text-gray-500 font-medium">새 비밀번호로 로그인해 주세요.</p>
                  <Button
                    onClick={() => router.push('/login')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 rounded-xl font-black text-sm"
                  >
                    로그인하러 가기
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FindAccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-purple-600 font-bold">로딩 중...</div>}>
      <FindAccountContent />
    </Suspense>
  );
}
