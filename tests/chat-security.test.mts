import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

let room = { id: 'room', type: '1ON1', created_by: 'sender', employer_id: 'sender', seeker_id: 'receiver', password_hash: 'test-password', is_active: true };
let member: { id: string; session_id: string; nickname: string; left_at: string | null } | null = { id: 'participant', session_id: 'sender', nickname: '발신자', left_at: null };
let recipientFilter: string[] = [];
const sent: unknown[] = [];
let session: { user: { id: string } } | null = { user: { id: 'sender' } };
let gender = 'FEMALE';
mock.module('../auth.ts', { namedExports: { auth: async () => session } });
mock.module('web-push', { defaultExport: { setVapidDetails() {}, async sendNotification(subscription: unknown) { sent.push(subscription); } } });
mock.module('../lib/supabase.ts', { namedExports: { supabaseAdmin: { from(table: string) {
  const result = () => ({ error: null, data: table === 'users' ? { gender } : table === 'foxtalk_rooms' ? room : table === 'foxtalk_messages'
    ? { id: 'message', room_id: 'room', participant_id: 'participant', content: '저장된 메시지', message_type: 'TEXT' }
    : table === 'foxtalk_participants' ? [{ session_id: 'sender' }, { session_id: 'receiver' }, { session_id: 'outsider' }]
    : recipientFilter.map(id => ({ id, subscription_json: { id } })) });
  const chain = { select() { return chain; }, eq() { return chain; }, is() { return chain; },
    in(_column: string, ids: string[]) { recipientFilter = ids; return chain; },
    async single() { return result(); }, async maybeSingle() { return { data: member, error: null }; },
    then(resolve: (value: unknown) => unknown) { return Promise.resolve(result()).then(resolve); } };
  return chain;
} } } });
const { getChatAccess } = await import('../lib/chat-authorization');
const { sendChatMessagePush } = await import('../lib/chat-push');

test('1:1 접근: 위조 참여행이 있어도 실제 당사자 외 거절', async () => {
  await assert.rejects(getChatAccess('room', 'outsider'));
  assert.ok(await getChatAccess('room', 'sender'));
});

test('비밀방: 서버 비밀번호 확인과 퇴장 상태 검증', async () => {
  room = { ...room, type: 'SECRET', created_by: 'owner' };
  member = null;
  await assert.rejects(getChatAccess('room', 'sender', 'wrong', true));
  assert.ok(await getChatAccess('room', 'sender', 'test-password', true));
  await assert.rejects(getChatAccess('room', 'sender'));
  member = { id: 'participant', session_id: 'sender', nickname: '발신자', left_at: '2026-01-01' };
  await assert.rejects(getChatAccess('room', 'sender'));
});

test('1:1 푸시: 발신자와 무관한 참여행 제외, 실제 상대만 발송', async () => {
  room = { ...room, type: '1ON1' };
  member = { id: 'participant', session_id: 'sender', nickname: '발신자', left_at: null };
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test';
  process.env.VAPID_PRIVATE_KEY = 'test';
  assert.deepEqual(await sendChatMessagePush('message', 'sender'), { sent: 1 });
  assert.deepEqual(recipientFilter, ['receiver']);
  assert.deepEqual(sent, [{ id: 'receiver' }]);
});

test('실시간 여성 회원 채팅: 여성만 허용, 남성·게스트·불명 성별 거절', async () => {
  room = { ...room, type: 'LIVE' };
  gender = 'FEMALE';
  assert.ok(await getChatAccess('room', 'sender', undefined, true));
  gender = 'MALE';
  await assert.rejects(getChatAccess('room', 'sender', undefined, true));
  gender = '';
  await assert.rejects(getChatAccess('room', 'sender', undefined, true));
  gender = 'FEMALE';
  session = null;
  await assert.rejects(getChatAccess('room', 'sender', undefined, true));
});
