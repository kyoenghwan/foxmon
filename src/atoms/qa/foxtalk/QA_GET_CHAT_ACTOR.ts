'use server';

import { getChatActor } from '@/lib/chat-authorization';

export async function QA_GET_CHAT_ACTOR() {
  try { return { success: true, id: await getChatActor() }; }
  catch { return { success: false, id: null }; }
}
