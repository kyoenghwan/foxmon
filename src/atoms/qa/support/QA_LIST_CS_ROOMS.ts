"use server";

import { supabaseAdmin } from "@/lib/supabase";
import {
  csDateRangeToIso,
  hasActiveCsSearch,
  type CsRoomSearchFilters,
} from "@/lib/cs-search";

export type CsRoomListItem = {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  last_message_at: string | null;
  customer_nickname: string | null;
  customer_login_id: string | null;
  customer_login_hint: string | null;
  last_message_preview: string | null;
  has_unread: boolean;
  last_sender_is_customer: boolean;
};


export async function QA_LIST_CS_ROOMS(
  csAdminUserId?: string | null,
  filters?: CsRoomSearchFilters
) {
  try {
    const { data: rooms, error } = await supabaseAdmin
      .from("foxtalk_rooms")
      .select("id, title, created_by, created_at, last_message_at")
      .eq("type", "CS")
      .eq("is_active", true)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) throw error;
    if (!rooms?.length) return { success: true, data: [] as CsRoomListItem[] };

    let roomIds = rooms.map((r) => r.id);
    const { fromIso, toIso } = csDateRangeToIso(filters || {});

    if (hasActiveCsSearch(filters)) {
      let matchIds: Set<string> | null = null;

      const mergeIds = (ids: string[]) => {
        const s = new Set(ids);
        if (matchIds === null) matchIds = s;
        else matchIds = new Set([...matchIds].filter((id) => s.has(id)));
      };

      if (filters?.content?.trim()) {
        const kw = `%${filters.content.trim()}%`;
        const { data: msgHits } = await supabaseAdmin
          .from("foxtalk_messages")
          .select("room_id")
          .in("room_id", roomIds)
          .ilike("content", kw);
        mergeIds((msgHits || []).map((m) => m.room_id));
      }

      if (fromIso || toIso) {
        let dateQ = supabaseAdmin
          .from("foxtalk_messages")
          .select("room_id")
          .in("room_id", roomIds);
        if (fromIso) dateQ = dateQ.gte("created_at", fromIso);
        if (toIso) dateQ = dateQ.lte("created_at", toIso);
        const { data: dateHits } = await dateQ;
        mergeIds((dateHits || []).map((m) => m.room_id));
      }

      if (matchIds !== null) {
        roomIds = [...matchIds];
      }
    }

    const filteredRooms = rooms.filter((r) => roomIds.includes(r.id));
    if (!filteredRooms.length) return { success: true, data: [] as CsRoomListItem[] };

    const activeRoomIds = filteredRooms.map((r) => r.id);

    const { data: participants } = await supabaseAdmin
      .from("foxtalk_participants")
      .select("id, room_id, session_id, nickname, last_read_at")
      .in("room_id", activeRoomIds);

    const { data: lastMessages } = await supabaseAdmin
      .from("foxtalk_messages")
      .select("room_id, content, created_at, participant_id")
      .in("room_id", activeRoomIds)
      .order("created_at", { ascending: false });

    const creatorIds = [
      ...new Set(filteredRooms.map((r) => r.created_by).filter(Boolean)),
    ];
    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id, login_id, nickname, name")
      .in("id", creatorIds);

    const userById = new Map((users || []).map((u) => [u.id, u]));

    const adminId = csAdminUserId?.trim() || "";

    const sessionByParticipantId = new Map<string, string>();
    for (const p of participants || []) {
      if (p.id) sessionByParticipantId.set(p.id, p.session_id);
    }

    const lastByRoom = new Map<string, { content: string; created_at: string }>();
    const lastCustomerByRoom = new Map<string, { content: string; created_at: string }>();
    const lastSenderIsCustomerByRoom = new Map<string, boolean>();

    for (const m of lastMessages || []) {
      const sid = m.participant_id
        ? sessionByParticipantId.get(m.participant_id)
        : undefined;
      const isCustomerMsg = !!sid && sid !== adminId;

      if (!lastByRoom.has(m.room_id)) {
        lastByRoom.set(m.room_id, { content: m.content, created_at: m.created_at });
        lastSenderIsCustomerByRoom.set(m.room_id, isCustomerMsg);
      }
      if (isCustomerMsg && !lastCustomerByRoom.has(m.room_id)) {
        lastCustomerByRoom.set(m.room_id, { content: m.content, created_at: m.created_at });
      }
    }

    const loginQ = filters?.loginId?.trim().toLowerCase() || "";

    let items: CsRoomListItem[] = filteredRooms.map((room) => {
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
      const userRow = userById.get(room.created_by);

      return {
        id: room.id,
        title: room.title,
        created_by: room.created_by,
        created_at: room.created_at,
        last_message_at: room.last_message_at,
        customer_nickname: cust?.nickname || userRow?.nickname || userRow?.name || null,
        customer_login_id: userRow?.login_id || null,
        customer_login_hint: room.created_by?.slice(0, 8) || null,
        last_message_preview: last?.content?.slice(0, 80) || null,
        has_unread,
        last_sender_is_customer: lastSenderIsCustomerByRoom.get(room.id) ?? false,
      };
    });

    if (loginQ) {
      items = items.filter(
        (item) =>
          item.customer_login_id?.toLowerCase().includes(loginQ) ||
          item.customer_nickname?.toLowerCase().includes(loginQ) ||
          item.title.toLowerCase().includes(loginQ) ||
          item.created_by.toLowerCase().includes(loginQ)
      );
    }

    return { success: true, data: items };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("QA_LIST_CS_ROOMS Error:", message);
    return { success: false, data: [] as CsRoomListItem[], error: message };
  }
}
