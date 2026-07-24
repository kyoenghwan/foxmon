"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { QA_GET_CS_MESSAGES } from "@/src/atoms/qa/support/QA_GET_CS_MESSAGES";
import {
  QA_LIST_CS_ROOMS,
} from "@/src/atoms/qa/support/QA_LIST_CS_ROOMS";
import type { CsRoomSearchFilters } from "@/lib/cs-search";
import { OA_INSERT_CS_MESSAGE } from "@/src/atoms/oa/support/OA_INSERT_CS_MESSAGE";
import { getSiteSettings } from "@/actions/admin/siteSettings";
import { isAdminRole } from "@/lib/normalize-user-role";
import { supabaseAdmin } from "@/lib/supabase";
import { OA_INSERT_CHAT_PARTICIPANT } from "@/src/atoms/oa/foxtalk/OA_INSERT_CHAT_PARTICIPANT";

type SessionUser = { role?: string; id?: string; nickname?: string; login_id?: string };

/**
 * NextAuth 세션 및 CS 독립 기기 세션 모두에서 관리자 권한을 검증하는 헬퍼
 */
async function verifyAdminPermission(): Promise<{ success: boolean; userId?: string; loginId?: string }> {
  // 1. NextAuth 세션 검증
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const loginId = String(user?.login_id || "").trim().toLowerCase();
  
  if (user?.id && (isAdminRole(user.role) || loginId.startsWith("foxmon_"))) {
    return { success: true, userId: user.id, loginId };
  }

  // 2. 독립 CS 세션 쿠키 검증
  const cookieStore = await cookies();
  const csSessionToken = cookieStore.get('cs_session_token')?.value;
  if (csSessionToken && csSessionToken.startsWith('CS_SESSION_')) {
    const adminUserId = csSessionToken.split('_')[2];
    if (adminUserId) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('role, login_id')
        .eq('id', adminUserId)
        .single();

      if (userData) {
        const adminLoginId = String(userData.login_id || "").trim().toLowerCase();
        if (isAdminRole(userData.role) || adminLoginId.startsWith("foxmon_")) {
          return { success: true, userId: adminUserId, loginId: adminLoginId };
        }
      }
    }
  }

  return { success: false };
}

export async function listCsRoomsForAdmin(filters?: CsRoomSearchFilters) {
  const adminCheck = await verifyAdminPermission();
  if (!adminCheck.success) {
    return { success: false, error: "Unauthorized", data: [] };
  }

  const settings = await getSiteSettings();
  const csAdminId =
    (settings.success && settings.data?.cs_admin_user_id?.trim()) ||
    adminCheck.userId ||
    undefined;

  return QA_LIST_CS_ROOMS(csAdminId, filters);
}

export async function getCsRoomMessages(roomId: string) {
  const adminCheck = await verifyAdminPermission();
  if (!adminCheck.success) {
    return { success: false, error: "Unauthorized", data: [] };
  }
  return QA_GET_CS_MESSAGES(roomId);
}

export async function sendCsAdminReply(roomId: string, content: string) {
  const adminCheck = await verifyAdminPermission();
  if (!adminCheck.success) {
    return { success: false, error: "Unauthorized" };
  }

  const text = content.trim();
  if (!text) return { success: false, error: "내용을 입력해 주세요." };

  const settings = await getSiteSettings();
  const loginId = adminCheck.loginId || "";
  const senderId =
    (settings.success && settings.data?.cs_admin_user_id?.trim()) ||
    (loginId.startsWith("foxmon_") ? adminCheck.userId : "") ||
    adminCheck.userId ||
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
  const adminCheck = await verifyAdminPermission();
  if (!adminCheck.success) {
    return { success: false, error: "Unauthorized" };
  }

  const adminId = csAdminUserId?.trim() || adminCheck.userId || "";
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

/** 고객센터 상담 종료 (방 비활성화) */
export async function closeCsRoom(roomId: string) {
  const adminCheck = await verifyAdminPermission();
  if (!adminCheck.success) {
    return { success: false, error: "Unauthorized" };
  }

  if (!roomId) {
    return { success: false, error: "방 식별자가 없습니다." };
  }

  const { error } = await supabaseAdmin
    .from("foxtalk_rooms")
    .update({ is_active: false })
    .eq("id", roomId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/fox-office/support/inbox");
  return { success: true };
}
