"use server";

import { auth } from "@/auth";
import { OA_UPDATE_USER_STAFF_TEAM, type StaffTeam } from "@/src/atoms/oa/admin/OA_UPDATE_USER_STAFF_TEAM";

export async function updateUserStaffTeam(payload: { userId: string; staffTeam: StaffTeam }) {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;

  // 담당자 지정(권한 부여)은 SUPER_ADMIN만 허용
  if (!session?.user || role !== "SUPER_ADMIN") {
    return { success: false, error: "Unauthorized" as const };
  }

  const res = await OA_UPDATE_USER_STAFF_TEAM({
    user_id: payload.userId,
    staff_team: payload.staffTeam,
  });

  if (!res.success) return { success: false, error: res.error || "Failed" };
  return { success: true, data: res.data };
}

