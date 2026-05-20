'use client';

import { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
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
import {
  getStayLoggedIn,
  STAY_LOGGED_IN_CHANGED_EVENT,
  STAY_LOGGED_IN_STORAGE_KEY,
} from '@/lib/stay-logged-in';

const WARNING_TIME_MS = 5 * 60 * 1000; // 5분 무동작 시 경고
const LOGOUT_COUNTDOWN_SEC = 30; // 경고 후 30초 뒤 자동 로그아웃

function clearFoxmonSessionCookies() {
  document.cookie = 'foxmon_auto_login=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'foxmon_transient=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

function isAuthPath(pathname: string) {
  return (
    pathname === '/login' ||
    pathname.startsWith('/register') ||
    pathname === '/age-gate' ||
    pathname === '/find-account'
  );
}

function AutoLogoutLogic({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(LOGOUT_COUNTDOWN_SEC);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const logoutInProgressRef = useRef(false);
  const prevStatusRef = useRef(status);
  const pathname = usePathname();
  const skipIdleTimer = isAuthPath(pathname);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);

  useLayoutEffect(() => {
    setStayLoggedIn(getStayLoggedIn());
  }, []);

  useEffect(() => {
    const sync = () => setStayLoggedIn(getStayLoggedIn());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STAY_LOGGED_IN_STORAGE_KEY || e.key === null) sync();
    };
    window.addEventListener(STAY_LOGGED_IN_CHANGED_EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(STAY_LOGGED_IN_CHANGED_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const idleDisabled = skipIdleTimer || stayLoggedIn;

  const clearIdleTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
  }, []);

  const clearTimers = useCallback(() => {
    clearIdleTimer();
    clearCountdown();
  }, [clearIdleTimer, clearCountdown]);

  const resetIdleState = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    setRemainingSeconds(LOGOUT_COUNTDOWN_SEC);
    logoutInProgressRef.current = false;
  }, [clearTimers]);

  const performLogout = useCallback(async () => {
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;
    clearTimers();
    setShowWarning(false);
    setRemainingSeconds(LOGOUT_COUNTDOWN_SEC);

    clearFoxmonSessionCookies();
    await signOut({ redirect: false });
    // session_expired=1 없이 /login 이동 시 auth.config가 로그인 상태면 홈(/)으로 되돌림
    window.location.href = '/login?session_expired=1';
  }, [clearTimers]);

  const resetTimer = useCallback((force = false) => {
    if (idleDisabled || status !== 'authenticated') return;
    if (showWarning && !force) return;

    clearIdleTimer();

    timerRef.current = setTimeout(() => {
      // remainingSeconds를 먼저 세팅한 뒤 경고를 켜야 0초 상태에서 즉시 로그아웃되지 않음
      setRemainingSeconds(LOGOUT_COUNTDOWN_SEC);
      setShowWarning(true);
    }, WARNING_TIME_MS);
  }, [showWarning, status, idleDisabled, clearIdleTimer]);

  // 로그인/로그아웃 시 유휴 타이머 상태 완전 초기화
  useEffect(() => {
    const wasAuthenticated = prevStatusRef.current === 'authenticated';
    const isAuthenticated = status === 'authenticated';

    if (!isAuthenticated) {
      resetIdleState();
    } else if (!wasAuthenticated && isAuthenticated && !idleDisabled) {
      // 새 로그인 직후 이전 카운트다운(0초) 상태가 남지 않도록 초기화
      resetIdleState();
      resetTimer(true);
    }

    prevStatusRef.current = status;
  }, [status, idleDisabled, resetIdleState, resetTimer]);

  // 카운트다운 로직
  useEffect(() => {
    if (!showWarning || status !== 'authenticated') return;

    countdownRef.current = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [showWarning, status]);

  useEffect(() => {
    if (
      showWarning &&
      remainingSeconds <= 0 &&
      status === 'authenticated' &&
      !logoutInProgressRef.current &&
      !idleDisabled
    ) {
      void performLogout();
    }
  }, [showWarning, remainingSeconds, status, performLogout, idleDisabled]);

  const prevStayLoggedInRef = useRef<boolean | null>(null);

  // 로그인 유지 토글 시에만 타이머 정리 / 재시작 (마운트 직후 이중 resetTimer 방지)
  useEffect(() => {
    if (status !== 'authenticated' || skipIdleTimer) return;

    const prev = prevStayLoggedInRef.current;
    prevStayLoggedInRef.current = stayLoggedIn;

    if (prev === null) {
      if (stayLoggedIn) resetIdleState();
      return;
    }
    if (prev === stayLoggedIn) return;

    if (stayLoggedIn) {
      resetIdleState();
    } else {
      resetIdleState();
      resetTimer(true);
    }
  }, [stayLoggedIn, status, skipIdleTimer, resetIdleState, resetTimer]);

  // 활동 감지 이벤트 리스너
  useEffect(() => {
    if (status !== 'authenticated' || idleDisabled) {
      clearIdleTimer();
      return;
    }

    if (!showWarning) {
      resetTimer();
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      if (!showWarning) resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearIdleTimer();
    };
  }, [resetTimer, status, pathname, idleDisabled, clearIdleTimer, showWarning]);

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
    resetIdleState();
    resetTimer(true);
  };

  const handleLogoutNow = () => {
    void performLogout();
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
        <DialogContent className="sm:max-w-md !z-[99999]" overlayClassName="!z-[99999]" aria-describedby="auto-logout-desc">
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
