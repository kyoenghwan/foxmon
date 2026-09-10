import test from 'node:test';
import assert from 'node:assert/strict';
import { EncryptJWT } from 'jose';
import { createGuestToken, verifyGuestToken } from '../lib/guest-session';
import { RA_PARSE_EXTERNAL_AUTH_DATA } from '../src/atoms/ra/auth/RA_PARSE_EXTERNAL_AUTH_DATA';
import { RA_CALC_DEDUCTION_FIFO } from '../src/atoms/ra/points/RA_CALC_DEDUCTION_FIFO';

const identity = { name: '검증용', birthDate: '19900101', phoneNumber: '01000000000', gender: 'MALE',
  nationality: 'KOREAN' as const, ci: '테스트용-CI', verifiedMethod: 'MOBILE' };

test('게스트 인증: 정상 암호화 토큰과 CI 전달, 변조·기존 쿠키 차단', async () => {
  process.env.AUTH_SECRET = '테스트 전용 비밀값: 운영에 사용하지 않음';
  const token = await createGuestToken(identity);
  const verified = await verifyGuestToken(token);
  assert.equal(verified?.ci, identity.ci);
  assert.match(verified!.sub, /^[0-9a-f-]{36}$/);
  assert.ok(!token.includes(identity.name));
  assert.equal(await verifyGuestToken(token.slice(0, 20) + 'x' + token.slice(21)), null);
  assert.equal(await verifyGuestToken(Buffer.from(JSON.stringify(identity)).toString('base64')), null);
  assert.equal(await verifyGuestToken(), null);
});

test('게스트 인증: 만료·다른 버전·다른 키 거절', async () => {
  process.env.AUTH_SECRET = '테스트 전용 비밀값: 운영에 사용하지 않음';
  const key = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`foxmon-guest-v1:${process.env.AUTH_SECRET}`)));
  const expired = await new EncryptJWT({ ...identity, version: 1 }).setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setSubject('test').setIssuedAt().setIssuer('foxmon').setAudience('foxmon-guest').setExpirationTime(1).encrypt(key);
  assert.equal(await verifyGuestToken(expired), null);
  const wrongVersion = await new EncryptJWT({ ...identity, version: 2 }).setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setSubject('test').setIssuedAt().setIssuer('foxmon').setAudience('foxmon-guest').setExpirationTime('1d').encrypt(key);
  assert.equal(await verifyGuestToken(wrongVersion), null);
  const token = await createGuestToken(identity);
  process.env.AUTH_SECRET = '다른 테스트 키';
  assert.equal(await verifyGuestToken(token), null);
});

test('생년월일: 정상 성인 허용, 잘못된 날짜·미성년 차단', async () => {
  assert.equal((await RA_PARSE_EXTERNAL_AUTH_DATA('MOBILE', identity)).success, true);
  for (const birthDate of ['abcdefgh', '19900230', '20010229', '20200101', '19901301', '1990011']) {
    assert.equal((await RA_PARSE_EXTERNAL_AUTH_DATA('MOBILE', { ...identity, birthDate })).success, false, birthDate);
  }
});

test('차감: 보너스 우선·FIFO 순서·잔액 부족', () => {
  const base = { requiredPoints: 150, currentBonusBalance: 50, activeRecharges: [{ id: 'a', remained_point: 70 }, { id: 'b', remained_point: 100 }] };
  assert.deepEqual(RA_CALC_DEDUCTION_FIFO(base).data, { bonusDeduction: 50, paidDeductionList: [{ historyId: 'a', deductAmount: 70 }, { historyId: 'b', deductAmount: 30 }] });
  assert.equal(RA_CALC_DEDUCTION_FIFO({ ...base, requiredPoints: 1000 }).isValid, false);
});

test('차감: 음수·NaN·소수·무한대·중복 이력 거절', () => {
  for (const requiredPoints of [-1, 0, NaN, Infinity, 1.5]) {
    assert.equal(RA_CALC_DEDUCTION_FIFO({ requiredPoints, currentBonusBalance: 10, activeRecharges: [] }).isValid, false);
  }
  for (const remained_point of [-1, NaN, Infinity, 1.5]) {
    assert.equal(RA_CALC_DEDUCTION_FIFO({ requiredPoints: 1, currentBonusBalance: 0, activeRecharges: [{ id: 'a', remained_point }] }).isValid, false);
  }
  assert.equal(RA_CALC_DEDUCTION_FIFO({ requiredPoints: 2, currentBonusBalance: 0, activeRecharges: [{ id: 'a', remained_point: 1 }, { id: 'a', remained_point: 1 }] }).isValid, false);
});
