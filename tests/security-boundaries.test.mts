import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

let session: { user: { id: string } } | null = null;
let role = 'GENERAL';
let reads = 0;
mock.module('../auth.ts', { namedExports: { auth: async () => session } });
mock.module('../lib/supabase.ts', { namedExports: {
  isSupabaseServiceRoleConfigured: true,
  supabaseAdmin: { from: () => { reads++; return { select: () => ({ eq: () => ({ single: async () => ({ data: { role }, error: null }) }) }) }; } },
} });
const { requireMaintenanceAdmin, requireCronAuthorization } = await import('../lib/api-authorization');

test('운영 보정 API: 출처·세션·DB 관리자 역할 확인', async () => {
  const request = (origin?: string) => new Request('https://foxmon.test/api/fix-side-ads', { method: 'POST', headers: origin ? { origin } : {} });
  assert.equal((await requireMaintenanceAdmin(request()))?.status, 403);
  assert.equal((await requireMaintenanceAdmin(request('https://other.test')))?.status, 403);
  assert.equal((await requireMaintenanceAdmin(request('https://foxmon.test')))?.status, 401);
  assert.equal(reads, 0);
  session = { user: { id: 'test-user' } };
  assert.equal((await requireMaintenanceAdmin(request('https://foxmon.test')))?.status, 403);
  role = 'ADMIN';
  assert.equal(await requireMaintenanceAdmin(request('https://foxmon.test')), null);
});

test('Cron API: 설정 누락·잘못된 토큰 거절, 유효 토큰 허용', () => {
  const request = (authorization?: string) => new Request('https://foxmon.test/api/cron/auto-jump', { headers: authorization ? { authorization } : {} });
  delete process.env.CRON_SECRET;
  assert.equal(requireCronAuthorization(request())?.status, 503);
  process.env.CRON_SECRET = 'test-cron-secret';
  assert.equal(requireCronAuthorization(request())?.status, 401);
  assert.equal(requireCronAuthorization(request('Bearer wrong'))?.status, 401);
  assert.equal(requireCronAuthorization(request('Bearer test-cron-secret')), null);
});
