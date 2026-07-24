'use client';

import { useState, useEffect } from 'react';
import { loginCsTerminal } from '@/lib/actions/admin-cs-auth';
import { ShieldCheck, Loader2, KeyRound, User } from 'lucide-react';

export default function CsLoginClient() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [deviceToken, setDeviceToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 로컬 스토리지에서 기기 토큰 미리 가져오기
    const token = localStorage.getItem('cs_device_token') || '';
    setDeviceToken(token);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      alert('아이디와 비밀번호를 모두 입력해 주세요.');
      return;
    }
    if (!deviceToken) {
      alert('인증용 기기 식별자가 유실되었습니다. 새로고침 후 다시 시도해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginCsTerminal({
        username: username.trim(),
        password,
        deviceToken,
      });

      if (res.success) {
        // 로그인 성공 -> 메인 CS 터미널로 진입
        window.location.href = '/cs';
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6">
        
        {/* 헤더 심볼 */}
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-black text-white">CS 웹앱 보안 로그인</h2>
            <p className="text-[11px] text-gray-500">
              인증된 CS 단말기 전용 로그인 게이트웨이
            </p>
          </div>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-3 text-xs text-gray-400">
            {/* 아이디 입력 */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="관리자 로그인 아이디"
                className="w-full h-11 pl-10 pr-4 bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none"
              />
            </div>

            {/* 비밀번호 입력 */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="관리자 비밀번호"
                className="w-full h-11 pl-10 pr-4 bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                보안 토큰 인증 중...
              </>
            ) : (
              'CS 웹앱 로그인'
            )}
          </button>
        </form>

        <div className="text-center text-[10px] text-gray-600">
          본 시스템은 법적 권한이 없는 자의 접근을 엄격히 금지합니다.<br />
          기기 식별 보안 정보가 실시간 감시/기록되고 있습니다.
        </div>

      </div>
    </div>
  );
}
