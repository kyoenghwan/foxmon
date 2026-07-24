'use client';

import { useState, useEffect } from 'react';
import { loginCsTerminal } from '@/lib/actions/admin-cs-auth';
import { requestDeviceRegistration } from '@/lib/actions/admin-devices';
import { ShieldCheck, Laptop, Loader2, KeyRound, User, CheckCircle2, AlertCircle } from 'lucide-react';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; path=/; expires=${expires}; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export default function CsLoginClient() {
  // 로그인 폼 스테이트
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 기기 정보 및 등록 폼 스테이트
  const [deviceToken, setDeviceToken] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [deviceStatus, setDeviceStatus] = useState<'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NONE');
  const [existingDeviceName, setExistingDeviceName] = useState('');
  
  const [isLoadingDevice, setIsLoadingDevice] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  // 기기 식별자 초기화 및 상태 로드
  useEffect(() => {
    async function initDevice() {
      try {
        let token = localStorage.getItem('cs_device_token');
        if (!token) {
          token = getCookie('cs_device_token');
        }
        if (!token) {
          token = generateUUID();
          localStorage.setItem('cs_device_token', token);
        }
        setCookie('cs_device_token', token);
        setDeviceToken(token);

        // DB에서 해당 기기 승인 상태 체크
        const statusRes = await fetch(`/api/cs-device/status?token=${token}`);
        const statusJson = await statusRes.json();
        
        if (statusJson.success && statusJson.device) {
          setDeviceStatus(statusJson.device.status);
          setExistingDeviceName(statusJson.device.device_name);
        } else {
          setDeviceStatus('NONE');
        }
      } catch (err) {
        console.error('기기 식별자 세팅 실패', err);
      } finally {
        setIsLoadingDevice(false);
      }
    }

    initDevice();
  }, []);

  // 로그인 제출
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      alert('아이디와 비밀번호를 모두 입력해 주세요.');
      return;
    }
    if (deviceStatus !== 'APPROVED') {
      alert('승인 완료된 안전 기기에서만 로그인이 허용됩니다. 하단에서 [기기등록 요청]을 먼저 완료해 주세요.');
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

  // 기기등록 신청서 제출
  const handleDeviceRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) {
      alert('기기 별칭을 입력해 주세요.');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await requestDeviceRegistration({
        deviceToken,
        deviceName: deviceName.trim(),
      });

      if (res.success) {
        alert(res.message);
        setDeviceStatus('PENDING');
        setExistingDeviceName(deviceName.trim());
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('기기 등록 신청 중 오류가 발생했습니다.');
    } finally {
      setIsRegistering(false);
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
            <h2 className="text-base font-black text-white">CS 웹앱 로그인 및 기기관리</h2>
            <p className="text-[11px] text-gray-500">
              인증된 CS 전용 단말기 보안 접속 포털
            </p>
          </div>
        </div>

        {/* 1. CS 로그인 폼 */}
        <div className="space-y-4">
          <div className="border-b border-gray-800 pb-2 flex items-center justify-between">
            <span className="text-xs font-black text-white">CS 로그인</span>
            {deviceStatus === 'APPROVED' ? (
              <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                기기 인증 완료 (로그인 가능)
              </span>
            ) : (
              <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                기기 미인증 (접속 차단됨)
              </span>
            )}
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-2 text-xs text-gray-400">
              {/* ID */}
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
                  disabled={deviceStatus !== 'APPROVED'}
                  className="w-full h-11 pl-10 pr-4 bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>

              {/* PW */}
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
                  disabled={deviceStatus !== 'APPROVED'}
                  className="w-full h-11 pl-10 pr-4 bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || deviceStatus !== 'APPROVED'}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:text-gray-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  보안 로그인 진행 중...
                </>
              ) : (
                'CS 웹앱 로그인'
              )}
            </button>
          </form>
        </div>

        {/* 2. 기기등록 요청 폼 */}
        <div className="border-t border-gray-800 pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-white">단말기 기기등록 요청</span>
            {isLoadingDevice ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
            ) : (
              <span className={`text-[10px] font-bold ${
                deviceStatus === 'APPROVED' ? 'text-green-400' :
                deviceStatus === 'PENDING' ? 'text-amber-500' :
                deviceStatus === 'REJECTED' ? 'text-red-500' : 'text-gray-500'
              }`}>
                [ {deviceStatus === 'APPROVED' ? '승인완료' :
                   deviceStatus === 'PENDING' ? '승인 대기중' :
                   deviceStatus === 'REJECTED' ? '반려됨' : '미등록 기기'} ]
              </span>
            )}
          </div>

          <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-3.5 text-left space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Laptop className="w-3.5 h-3.5 text-blue-400" />
              <span>현재 접속 단말기 식별키</span>
            </div>
            <div className="bg-gray-900 p-2 rounded-lg border border-gray-800 font-mono text-[9px] text-gray-500 select-all break-all text-center">
              {isLoadingDevice ? '식별키 확인 중...' : deviceToken}
            </div>
          </div>

          {deviceStatus === 'PENDING' && (
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[10px] text-gray-400 leading-relaxed text-center">
              기기명 <b>"{existingDeviceName}"</b>으로 승인 대기 중입니다.<br />
              PC 관리자 페이지의 <b>[고객센터 관리]</b> 메뉴 하단에서 이 단말기 승인을 수락해 주세요.
            </div>
          )}

          {deviceStatus === 'REJECTED' && (
            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-[10px] text-gray-400 leading-relaxed text-center">
              기기 등록이 거절되었습니다. 아래에서 기기명을 다시 확인하여 재신청을 접수할 수 있습니다.
            </div>
          )}

          {/* 기기 미등록 또는 반려 시 신청 폼 제공 */}
          {(deviceStatus === 'NONE' || deviceStatus === 'REJECTED') && (
            <form onSubmit={handleDeviceRegister} className="space-y-3 text-left">
              <div className="space-y-1">
                <input
                  type="text"
                  required
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="예: 홍길동 핸드폰, 사무실 PC 등"
                  className="w-full h-10 px-3 bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-xl text-xs text-white placeholder-gray-700 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isRegistering || isLoadingDevice}
                className="w-full h-10 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 active:scale-[0.98] border border-gray-700/80"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    등록 심사 신청 중...
                  </>
                ) : (
                  '본 단말기 기기등록 요청'
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
