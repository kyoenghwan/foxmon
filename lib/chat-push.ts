import { supabaseAdmin } from '@/lib/supabase';
import { getChatAccess } from '@/lib/chat-authorization';
import webpush from 'web-push';

/** 저장된 메시지만 그 방의 실제 참여자에게 알립니다. */
export async function sendChatMessagePush(messageId: string, actor: string) {
  const { data: message, error } = await supabaseAdmin.from('foxtalk_messages')
    .select('id, room_id, participant_id, content, message_type').eq('id', messageId).single();
  if (error || !message || message.message_type !== 'TEXT') throw new Error('알림 대상 메시지가 없습니다.');
  const { room, participant } = await getChatAccess(message.room_id, actor);
  if (participant.id !== message.participant_id) throw new Error('본인 메시지만 알릴 수 있습니다.');
  const { data: members, error: memberError } = await supabaseAdmin.from('foxtalk_participants')
    .select('session_id').eq('room_id', message.room_id).is('left_at', null);
  if (memberError) throw new Error('알림 수신자를 확인할 수 없습니다.');
  const recipients = [...new Set((members || []).map(member => member.session_id))]
    .filter(id => id !== actor && (room.type !== '1ON1' || id === room.employer_id || id === room.seeker_id));
  if (!recipients.length) return { sent: 0 };
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error('푸시 알림 설정이 필요합니다.');
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@foxmon.co.kr', publicKey, privateKey);
  const { data: subscriptions, error: subscriptionError } = await supabaseAdmin.from('push_subscriptions')
    .select('id, subscription_json').in('user_id', recipients);
  if (subscriptionError) throw new Error('푸시 구독 조회에 실패했습니다.');
  const payload = JSON.stringify({ title: `🦊 ${participant.nickname}`, body: String(message.content).slice(0, 100),
    icon: '/icons/icon-192x192.png', badge: '/icons/icon-72x72.png', url: '/', room_id: message.room_id });
  const results = await Promise.allSettled((subscriptions || []).map(async sub => {
    try { await webpush.sendNotification(sub.subscription_json, payload); return true; }
    catch (error: unknown) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
      return false;
    }
  }));
  return { sent: results.filter(result => result.status === 'fulfilled' && result.value).length };
}
