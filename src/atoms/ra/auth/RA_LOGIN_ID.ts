import { RA_VALIDATE_RESERVED_LOGIN_ID } from '@/src/atoms/ra/auth/RA_VALIDATE_RESERVED_LOGIN_ID';

export const LOGIN_ID_MIN_LENGTH = 4;
export const LOGIN_ID_MAX_LENGTH = 15;
/** 회원가입·로그인 아이디: 영문 소문자 + 숫자만 */
export const LOGIN_ID_PATTERN = /^[a-z0-9]{4,15}$/;

/**
 * 회원가입 입력 정규화 (소문자, 영문·숫자만 — 언더스코어 제거)
 */
export function normalizeLoginId(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, LOGIN_ID_MAX_LENGTH);
}

/**
 * 로그인·비밀번호 찾기 조회용 (운영 계정 foxmon_cs 등 언더스코어 유지)
 */
export function normalizeLoginIdForAuth(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, LOGIN_ID_MAX_LENGTH);
}

export function RA_VALIDATE_LOGIN_ID_FORMAT(loginId: string): {
  isValid: boolean;
  error?: string;
  normalized: string;
} {
  const normalized = normalizeLoginId(loginId);

  if (!normalized) {
    return { isValid: false, error: '아이디를 입력해주세요.', normalized };
  }
  if (normalized.length < LOGIN_ID_MIN_LENGTH) {
    return {
      isValid: false,
      error: `아이디는 ${LOGIN_ID_MIN_LENGTH}~${LOGIN_ID_MAX_LENGTH}자의 영문 소문자·숫자만 사용할 수 있습니다.`,
      normalized,
    };
  }
  if (!LOGIN_ID_PATTERN.test(normalized)) {
    return {
      isValid: false,
      error: `아이디는 ${LOGIN_ID_MIN_LENGTH}~${LOGIN_ID_MAX_LENGTH}자의 영문 소문자·숫자만 사용할 수 있습니다.`,
      normalized,
    };
  }

  return { isValid: true, normalized };
}

/** 형식 + foxmon 예약어 통합 검증 (회원가입·중복확인용) */
export function RA_VALIDATE_LOGIN_ID(loginId: string): {
  isValid: boolean;
  error?: string;
  normalized: string;
} {
  const format = RA_VALIDATE_LOGIN_ID_FORMAT(loginId);
  if (!format.isValid) return format;

  const reserved = RA_VALIDATE_RESERVED_LOGIN_ID(format.normalized);
  if (!reserved.isValid) {
    return { isValid: false, error: reserved.error, normalized: format.normalized };
  }

  return { isValid: true, normalized: format.normalized };
}
