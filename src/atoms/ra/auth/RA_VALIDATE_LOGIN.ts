import { nvLog } from '../../../../lib/logger';

/**
 * RA_VALIDATE_LOGIN: 로그인 입력값(이메일, 비밀번호)의 유효성을 검사합니다.
 * Domain: Auth
 * Type: Rule Atom (Pure Function)
 */
export const RA_VALIDATE_LOGIN = (input: { email?: string; password?: string }) => {
  const { email, password } = input;
  
  if (!email || !email.includes('@')) {
    return { isValid: false, error: '유효한 이메일 형식이 아닙니다.' };
  }
  
  if (!password || password.length < 8) {
    return { isValid: false, error: '비밀번호는 최소 8자 이상이어야 합니다.' };
  }

  return { isValid: true, error: null };
};
