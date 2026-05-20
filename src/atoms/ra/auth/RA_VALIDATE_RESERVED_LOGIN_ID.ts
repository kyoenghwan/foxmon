/** 운영/내부 전용 login_id 접두·포함 문자열 (DB에서 직접 생성) */
export const RESERVED_LOGIN_ID_MARKER = 'foxmon';

/**
 * RA_VALIDATE_RESERVED_LOGIN_ID: 회원가입 시 운영 전용 아이디 패턴 차단
 */
export function RA_VALIDATE_RESERVED_LOGIN_ID(loginId?: string): {
  isValid: boolean;
  error?: string;
} {
  const id = (loginId || '').trim();
  if (!id) {
    return { isValid: false, error: '아이디를 입력해주세요.' };
  }
  if (id.toLowerCase().includes(RESERVED_LOGIN_ID_MARKER)) {
    return {
      isValid: false,
      error:
        '「foxmon」이 포함된 아이디는 회원가입으로 만들 수 없습니다. 운영 계정은 관리자가 DB에서 직접 생성합니다.',
    };
  }
  return { isValid: true };
}
