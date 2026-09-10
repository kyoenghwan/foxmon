import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sendChatMessagePush } from '@/lib/chat-push';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false }, { status: 401 });
  try {
    const { message_id } = await req.json();
    if (typeof message_id !== 'string' || !message_id) return NextResponse.json({ success: false }, { status: 400 });
    const result = await sendChatMessagePush(message_id, session.user.id);
    return NextResponse.json({ success: true, ...result });
  } catch {
    return NextResponse.json({ success: false, message: '알림을 발송할 수 없습니다.' }, { status: 403 });
  }
}
