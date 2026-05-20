"use server";

import { supabaseAdmin } from "@/lib/supabase";

export type CsRoomListItem = {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  last_message_at: string | null;
  customer_nickname: string | null;
  customer_login_hint: string | null;
  last_message_preview: string | null;
  /** 고객 메시지 미확인 */
  has_unread: boolean;
};

export async function QA_LIST_CS_ROOMS(csAdminUserId?: string | null) {
  try {
    const { data: rooms, error } = await supabaseAdmin
      .from("foxtalk_rooms")
      .select("id, title, created_by, created_at, last_message_at")
      .eq("type", "CS")
      .eq("is_active", true)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) throw error;
    if (!rooms?.length) return { success: true, data: [] as CsRoomListItem[] };

    const roomIds = rooms.map((r) => r.id);

    const { data: participants } = await supabaseAdmin
      .from("foxtalk_participants")
      .select("id, room_id, session_id, nickname, last_read_at")
      .in("room_id", roomIds);

    const { data: lastMessages } = await supabaseAdmin
      .from("foxtalk_messages")
      .select("room_id, content, created_at, participant_id")
      .in("room_id", roomIds)
      .order("created_at", { ascending: false });

    const adminId = csAdminUserId?.trim() || "";

    const sessionByParticipantId = new Map<string, string>();
    for (const p of participants || []) {
      if (p.id) sessionByParticipantId.set(p.id, p.session_id);
    }

    const lastByRoom = new Map<string, { content: string; created_at: string }>();
    const lastCustomerByRoom = new Map<string, { content: string; created_at: string }>();

    for (const m of lastMessages || []) {
      if (!lastByRoom.has(m.room_id)) {
        lastByRoom.set(m.room_id, { content: m.content, created_at: m.created_at });
      }
      const sid = m.participant_id
        ? sessionByParticipantId.get(m.participant_id)
        : undefined;
      const isCustomerMsg = !!sid && sid !== adminId;
      if (isCustomerMsg && !lastCustomerByRoom.has(m.room_id)) {
        lastCustomerByRoom.set(m.room_id, { content: m.content, created_at: m.created_at });
      }
    }

    const items: CsRoomListItem[] = rooms.map((room) => {
      const customer = (participants || []).find(
        (p) =>
          p.room_id === room.id &&
          p.session_id === room.created_by &&
          p.session_id !== adminId
      );
      const fallbackCustomer = (participants || []).find(
        (p) => p.room_id === room.id && p.session_id !== adminId
      );
      const cust = customer || fallbackCustomer;
      const last = lastByRoom.get(room.id);
      const lastCustomer = lastCustomerByRoom.get(room.id);
      const adminP = (participants || []).find(
        (p) => p.room_id === room.id && p.session_id === adminId
      );
      const lastReadMs = adminP?.last_read_at
        ? new Date(adminP.last_read_at).getTime()
        : 0;
      const customerMsgMs = lastCustomer?.created_at
        ? new Date(lastCustomer.created_at).getTime()
        : 0;
      const has_unread = customerMsgMs > 0 && customerMsgMs > lastReadMs;

      return {
        id: room.id,
        title: room.title,
        created_by: room.created_by,
        created_at: room.created_at,
        last_message_at: room.last_message_at,
        customer_nickname: cust?.nickname || null,
        customer_login_hint: room.created_by?.slice(0, 8) || null,
        last_message_preview: last?.content?.slice(0, 80) || null,
        has_unread,
      };
    });

    return { success: true, data: items };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("QA_LIST_CS_ROOMS Error:", message);
    return { success: false, data: [] as CsRoomListItem[], error: message };
  }
}
