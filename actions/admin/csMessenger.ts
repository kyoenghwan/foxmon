"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { QA_GET_CS_MESSAGES } from "@/src/atoms/qa/support/QA_GET_CS_MESSAGES";
import { QA_LIST_CS_ROOMS } from "@/src/atoms/qa/support/QA_LIST_CS_ROOMS";
import { OA_INSERT_CS_MESSAGE } from "@/src/atoms/oa/support/OA_INSERT_CS_MESSAGE";
import { getSiteSettings } from "@/actions/admin/siteSettings";
import { isAdminRole } from "@/lib/normalize-user-role";
import { supabaseAdmin } from "@/lib/supabase";
import { OA_INSERT_CHAT_PARTICIPANT } from "@/src/atoms/oa/foxtalk/OA_INSERT_CHAT_PARTICIPANT";

type SessionUser = { role?: string; id?: string; nickname?: string; login_id?: string };

function canAccessCsMessenger(user?: SessionUser) {
  if (!user) return false;
  const loginId = String(user.login_id || "").trim().toLowerCase();
  return isAdminRole(user.role) || loginId.startsWith("foxmon_");
}

export async function listCsRoomsForAdmin() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!session?.user || !canAccessCsMessenger(user)) {
    return { success: false, error: "Unauthorized", data: [] };
  }

  const settings = await getSiteSettings();
  const csAdminId =
    (settings.success && settings.data?.cs_admin_user_id?.trim()) ||
    user?.id ||
    undefined;

  return QA_LIST_CS_ROOMS(csAdminId);
}

export async function getCsRoomMessages(roomId: string) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!session?.user || !canAccessCsMessenger(user)) {
    return { success: false, error: "Unauthorized", data: [] };
  }
  return QA_GET_CS_MESSAGES(roomId);
}

export async function sendCsAdminReply(roomId: string, content: string) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!session?.user || !canAccessCsMessenger(user)) {
    return { success: false, error: "Unauthorized" };
  }

  const text = content.trim();
  if (!text) return { success: false, error: "내용을 입력해 주세요." };

  const settings = await getSiteSettings();
  const loginId = String(user?.login_id || "").trim().toLowerCase();
  const senderId =
    (settings.success && settings.data?.cs_admin_user_id?.trim()) ||
    (loginId.startsWith("foxmon_") ? user?.id : "") ||
    user?.id ||
    "";

  if (!senderId) {
    return { success: false, error: "대표 상담원이 지정되지 않았습니다. 담당자 관리에서 설정해 주세요." };
  }

  const res = await OA_INSERT_CS_MESSAGE({
    room_id: roomId,
    participant_id: senderId,
    content: text,
    sender_nickname: "폭스몬 고객센터",
    message_type: "TEXT",
  });

  if (res.success) {
    revalidatePath("/fox-office/support/inbox");
  }

  return res;
}

/** 상담원이 방을 열람했을 때 미확인(N) 표시 해제 */
export async function markCsRoomRead(roomId: string, csAdminUserId: string) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!session?.user || !canAccessCsMessenger(user)) {
    return { success: false, error: "Unauthorized" };
  }

  const adminId = csAdminUserId?.trim() || user?.id || "";
  if (!roomId || !adminId) {
    return { success: false, error: "잘못된 요청입니다." };
  }

  const { data: existing } = await supabaseAdmin
    .from("foxtalk_participants")
    .select("id")
    .eq("room_id", roomId)
    .eq("session_id", adminId)
    .maybeSingle();

  if (!existing?.id) {
    await OA_INSERT_CHAT_PARTICIPANT({
      room_id: roomId,
      session_id: adminId,
      nickname: "폭스몬 고객센터",
      avatar_type: "fox1",
    });
  }

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("foxtalk_participants")
    .update({ last_read_at: now })
    .eq("room_id", roomId)
    .eq("session_id", adminId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
