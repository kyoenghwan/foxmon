'use client';

import { useState, useEffect } from 'react';
import { requestDeviceRegistration } from '@/lib/actions/admin-devices';
import { ShieldAlert, Laptop, Loader2, CheckCircle2, XCircle } from 'lucide-react';

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

export default function CsUnauthorizedClient() {
  const [deviceToken, setDeviceToken] = useState<string>('');
  const [deviceName, setDeviceName] = useState<string>('');
  const [deviceStatus, setDeviceStatus] = useState<'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NONE');
  const [existingDeviceName, setExistingDeviceName] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

        const statusRes = await fetch(`/api/cs-device/status?token=${token}`);
        const statusJson = await statusRes.json();
        
        if (statusJson.success && statusJson.device) {
          setDeviceStatus(statusJson.device.status);
          setExistingDeviceName(statusJson.device.device_name);
        } else {
          setDeviceStatus('NONE');
        }
      } catch (err) {
        console.error('기기 초기화 실패', err);
      } finally {
        setIsLoading(false);
      }
    }

    initDevice();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) {
      alert('기기명을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestDeviceRegistration({
        deviceToken,
        deviceName: deviceName.trim()
      });

      if (res.success) {
        alert(res.message);
        setDeviceStatus('PENDING');
        setExistingDeviceName(deviceName.trim());
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('신청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-xs text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
        <span>보안 기기 식별 검사 중...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6 text-center">
        
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-black text-white">미인증 기기 접근 차단됨</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            보안 정책에 따라 사전에 승인된 관리자 기기만 실시간 CS 응대 터미널에 접속할 수 있습니다. 본 기기를 관리자용 CS 단말기로 등록 신청해 주세요.
          </p>
        </div>

        <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-4 text-left space-y-3 text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <Laptop className="w-4 h-4 text-blue-400" />
            <span>기기 고유 식별자 (Device Token)</span>
          </div>
          <div className="bg-gray-900 p-2.5 rounded-lg border border-gray-800 font-mono text-[9px] text-gray-500 select-all break-all text-center">
            {deviceToken}
          </div>
        </div>

        {deviceStatus === 'PENDING' && (
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>승인 심사 대기 중</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              기기명 <b>"{existingDeviceName}"</b>으로 승인 대기 중입니다.<br />
              PC 관리자 페이지의 <b>[고객센터 관리]</b> 메뉴 하단에서 이 기기를 승인 처리하시면 즉시 CS 터미널 접속이 가능해집니다.
            </p>
          </div>
        )}

        {deviceStatus === 'REJECTED' && (
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-3 text-xs">
            <div className="flex items-center justify-center gap-1.5 text-red-400 font-bold">
              <XCircle className="w-4 h-4" />
              <span>승인 반려(거절)됨</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              기기 등록이 거절되었습니다. 아래에서 기기명을 다시 확인하여 재신청을 접수해 주세요.
            </p>
          </div>
        )}

        {(deviceStatus === 'NONE' || deviceStatus === 'REJECTED') && (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-gray-400 block px-0.5">기기 설명 (별칭)</label>
              <input
                type="text"
                required
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="예: 홍길동 아이폰15, 대표자 맥북 등"
                className="w-full h-11 px-3.5 bg-gray-950 border border-gray-800 focus:border-blue-500 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  기기 등록 신청서 제출 중...
                </>
              ) : (
                '관리자 CS 기기 등록 신청'
              )}
            </button>
          </form>
        )}

        {deviceStatus === 'APPROVED' && (
          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-2xl space-y-3 text-xs">
            <div className="flex items-center justify-center gap-1.5 text-green-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>기기 승인 완료</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              본 기기는 승인된 안전 단말기입니다. 아래 버튼을 눌러 로그인 및 CS 대시보드로 즉시 진입하실 수 있습니다.
            </p>
            <button
              onClick={() => window.location.href = '/cs'}
              className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all"
            >
              CS 대시보드로 이동
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
