import { nvLog } from '../../../../lib/logger';

/**
 * RA_VALIDATE_LOGIN: 로그인 입력값(아이디, 비밀번호)의 유효성을 검사합니다.
 * Domain: Auth
 * Type: Rule Atom (Pure Function)
 */
export const RA_VALIDATE_LOGIN = (input: { loginId?: string; password?: string }) => {
  const { loginId, password } = input;
  
  if (!loginId || loginId.trim() === '') {
    return { isValid: false, error: '아이디를 입력해주세요.' };
  }
  
  if (!password || password.trim() === '') {
    return { isValid: false, error: '비밀번호를 입력해주세요.' };
  }

  return { isValid: true, error: null };
};
