'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Check, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async () => {
    if (!newPassword || newPassword.length < 4) {
      setResult({ success: false, message: '비밀번호는 4자 이상 입력해주세요.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setResult({ success: false, message: '비밀번호가 일치하지 않습니다.' });
      return;
    }
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-with-token', token, newPassword }),
      });
      const data = await res.json();
      setResult({ success: data.success, message: data.message });
    } catch {
      setResult({ success: false, message: '서버 통신 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
        {/* Header */}
        <div className="bg-gradient-to-b from-purple-100 via-purple-50/50 to-white px-4 pt-12 pb-6 flex flex-col items-center">
          <div className="w-[160px]">
            <Image src="/foxmon_log.png" alt="FOXMON" width={1600} height={400} priority className="w-full h-auto" />
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {!result?.success ? (
            <>
              <div className="text-center">
                <h2 className="text-xl font-black text-gray-900">비밀번호 재설정</h2>
                <p className="text-gray-500 text-sm mt-1">새로운 비밀번호를 입력해주세요.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-gray-600 text-[13px] font-black mb-1.5 block">새 비밀번호</Label>
                  <div className="relative">
                    <Input
                      type={showPw ? 'text' : 'password'}
                      placeholder="4~12자 입력"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm pr-10"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" tabIndex={-1}>
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600 text-[13px] font-black mb-1.5 block">비밀번호 확인</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPw ? 'text' : 'password'}
                      placeholder="비밀번호 다시 입력"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm pr-10"
                    />
                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" tabIndex={-1}>
                      {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {result && !result.success && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold flex items-center gap-2">
                  <AlertTriangle size={16} /> {result.message}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl"
              >
                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : '비밀번호 변경하기'}
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4 py-4">
              <Check className="mx-auto text-green-500" size={48} />
              <p className="text-lg font-black text-gray-900">비밀번호가 변경되었습니다.</p>
              <p className="text-gray-500 text-sm">새 비밀번호로 로그인해주세요.</p>
              <Button
                onClick={() => router.push('/age-gate')}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl"
              >
                로그인하러 가기
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
