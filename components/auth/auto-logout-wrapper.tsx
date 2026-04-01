'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { signOut, useSession, SessionProvider } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const WARNING_TIME_MS = 4 * 60 * 1000; // 4분 경과 시 경고창
const LOGOUT_TIME_MS = 5 * 60 * 1000; // 5분 경과 시 자동 로그아웃 (경고창 후 1분)

function AutoLogoutLogic({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  const resetTimer = useCallback(() => {
    if (showWarning) return; 

    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    if (status === 'authenticated') {
      timerRef.current = setTimeout(() => {
        setShowWarning(true);
        setRemainingSeconds(60);
      }, WARNING_TIME_MS);
    }
  }, [showWarning, status]);

  // 카운트다운 로직
  useEffect(() => {
    if (showWarning && status === 'authenticated') {
      countdownRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            signOut({ callbackUrl: '/login' });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [showWarning, status]);

  // 활동 감지 이벤트 리스너
  useEffect(() => {
    if (status !== 'authenticated') {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    resetTimer();
    
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [resetTimer, status, pathname]); 

  // Option A: 탭 닫힘 시 로그아웃 처리 (beforeunload)
  useEffect(() => {
    if (status !== 'authenticated') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        // 브라우저 또는 탭 종료 시, sessionStorage를 통해 종료되었음을 마킹하고
        // 최신 브라우저 정책 내에서 최대한 강제 로그아웃 힌트를 줍니다.
        // 완벽한 파기를 원하면 여기서 sync 형태의 api 호출을 할 수 있지만 브라우저가 자주 차단합니다.
        sessionStorage.setItem('foxmon_last_closed', Date.now().toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status]);

  const handleExtendSession = () => {
    setShowWarning(false);
    resetTimer();
  };

  const handleLogoutNow = () => {
    setShowWarning(false);
    signOut({ callbackUrl: '/login' });
  };

  if (status !== 'authenticated') {
    return <>{children}</>;
  }

  return (
    <>
      <Dialog open={showWarning} onOpenChange={(open) => {
        // 사용자가 외부 클릭으로 모달을 닫는 것을 방지
        if (!open) return; 
      }}>
        <DialogContent className="sm:max-w-md" aria-describedby="auto-logout-desc">
          <DialogHeader>
            <DialogTitle>자동 로그아웃 안내</DialogTitle>
            <DialogDescription id="auto-logout-desc">
              아무런 작업이 감지되지 않아 보호를 위해 <strong className="text-red-500 font-bold">{remainingSeconds}초</strong> 후 자동으로 로그아웃 됩니다.<br/>
              계속 이용하시려면 연장 버튼을 눌러주세요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end space-x-2 sm:space-x-2">
            <Button variant="outline" onClick={handleLogoutNow}>
              로그아웃
            </Button>
            <Button onClick={handleExtendSession}>
               연장하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {children}
    </>
  );
}

// SessionProvider를 감싼 메인 Wrapper 컴포넌트
export function AutoLogoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AutoLogoutLogic>
        {children}
      </AutoLogoutLogic>
    </SessionProvider>
  );
}
