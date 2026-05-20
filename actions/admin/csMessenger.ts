"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { QA_GET_CS_MESSAGES } from "@/src/atoms/qa/support/QA_GET_CS_MESSAGES";
import { QA_LIST_CS_ROOMS } from "@/src/atoms/qa/support/QA_LIST_CS_ROOMS";
import { OA_INSERT_CS_MESSAGE } from "@/src/atoms/oa/support/OA_INSERT_CS_MESSAGE";
import { getSiteSettings } from "@/actions/admin/siteSettings";
import { isAdminRole } from "@/lib/normalize-user-role";

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
