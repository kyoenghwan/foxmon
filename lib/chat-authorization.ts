import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { verifyGuestToken } from '@/lib/guest-session';
import { supabaseAdmin } from '@/lib/supabase';

export async function getChatActor() {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  const guest = await verifyGuestToken((await cookies()).get('foxmon_guest_session')?.value);
  if (!guest) throw new Error('로그인 또는 본인인증이 필요합니다.');
  return guest.sub;
}

export async function getChatAccess(roomId: string, actor: string, password?: string, joining = false) {
  const { data: room, error } = await supabaseAdmin.from('foxtalk_rooms')
    .select('id, type, created_by, employer_id, seeker_id, password_hash, is_active').eq('id', roomId).single();
  if (error || !room || !room.is_active) throw new Error('사용할 수 없는 대화방입니다.');
  const { data: participant, error: participantError } = await supabaseAdmin.from('foxtalk_participants')
    .select('id, session_id, nickname, left_at').eq('room_id', roomId).eq('session_id', actor).maybeSingle();
  if (participantError) throw new Error('참여 정보를 확인할 수 없습니다.');
  if (room.type === '1ON1') {
    if (actor !== room.employer_id && actor !== room.seeker_id) throw new Error('대화방 접근 권한이 없습니다.');
  } else if (room.type === 'SECRET') {
    if (room.created_by !== actor && (!participant || participant.left_at) &&
        (!joining || !password || password !== room.password_hash)) throw new Error('비밀번호를 확인해주세요.');
  } else if (room.type === 'LIVE') {
    const session = await auth();
    if (!session?.user?.id || session.user.id !== actor) throw new Error('여성 회원 전용 채팅방입니다.');
    const { data: user, error: userError } = await supabaseAdmin.from('users').select('gender').eq('id', actor).single();
    if (userError || !user || !['FEMALE', 'F'].includes(user.gender)) throw new Error('여성 회원 전용 채팅방입니다.');
  } else if (room.type !== 'OPEN') {
    throw new Error('지원하지 않는 대화방입니다.');
  }
  if (!joining && (!participant || participant.left_at)) throw new Error('대화방 참여가 필요합니다.');
  return { room, participant };
}
