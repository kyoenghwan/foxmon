/** 브라우저에만 저장. 켜면 무동작 자동 로그아웃 타이머를 사용하지 않습니다. */
export const STAY_LOGGED_IN_STORAGE_KEY = 'foxmon_stay_logged_in';

export const STAY_LOGGED_IN_CHANGED_EVENT = 'foxmon-stay-logged-in';

export function getStayLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STAY_LOGGED_IN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setStayLoggedIn(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) {
      window.localStorage.setItem(STAY_LOGGED_IN_STORAGE_KEY, '1');
    } else {
      window.localStorage.removeItem(STAY_LOGGED_IN_STORAGE_KEY);
    }
    window.dispatchEvent(new Event(STAY_LOGGED_IN_CHANGED_EVENT));
  } catch {
    // private mode 등
  }
}
