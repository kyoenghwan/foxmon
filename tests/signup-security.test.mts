import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

let cookie: string | undefined;
let saved: Record<string, unknown> | undefined;
mock.module('next/headers', { namedExports: { cookies: async () => ({ get: () => cookie ? { value: cookie } : undefined }) } });
mock.module('../lib/supabase.ts', { namedExports: { supabaseAdmin: { from() { throw new Error('예상하지 않은 DB 호출'); } } } });
mock.module('../src/atoms/qa/auth/QA_CHECK_ID_NICKNAME_EXISTS.ts', { namedExports: {
  QA_CHECK_ID_NICKNAME_EXISTS: async () => ({ data: { idExists: false, nicknameExists: false }, error: null }),
} });
mock.module('../src/atoms/oa/auth/OA_CREATE_USER.ts', { namedExports: {
  OA_CREATE_USER: async (input: Record<string, unknown>) => { saved = input; return { success: false, error: '테스트 저장 경계에서 종료' }; },
} });
const { FA_REGISTER_FLOW } = await import('../src/atoms/fa/auth/FA_REGISTER_FLOW');
const { createGuestToken } = await import('../lib/guest-session');
const input = { loginId: 'testuser1', password: 'TestOnlyPassword1!', name: '위조된 이름', nickname: '테스트', role: 'GENERAL' as const,
  birthDate: '19000101', gender: 'FEMALE', phoneNumber: '000', nationality: 'FOREIGNER', is_age_verified: true, ci: '위조CI', smsConsent: false };

test('가입: 관리자 역할과 인증 없는 요청은 사용자 저장 전에 차단', async () => {
  assert.equal((await FA_REGISTER_FLOW({ ...input, role: 'ADMIN' as 'GENERAL' })).success, false);
  assert.equal((await FA_REGISTER_FLOW(input)).success, false);
  assert.equal(saved, undefined);
});

test('가입: 정상 역할은 서버 인증 신원·CI를 전달하고 본문 위조값 무시', async () => {
  process.env.AUTH_SECRET = '가입 테스트 전용 키';
  cookie = await createGuestToken({ name: '인증된 이름', birthDate: '19900101', gender: 'MALE', phoneNumber: '01000000000',
    nationality: 'KOREAN', verifiedMethod: 'MOBILE', ci: '서버인증CI' });
  await FA_REGISTER_FLOW(input);
  assert.ok(saved);
  assert.equal(saved.name, '인증된 이름');
  assert.equal(saved.ci, '서버인증CI');
  assert.equal(saved.birth_date, '19900101');
  assert.equal(saved.role, 'GENERAL');
  assert.equal(saved.is_age_verified, true);
});
