"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { nvLog } from "../../../../lib/logger";

export type StaffTeam = "OPS" | "AD" | "CS";

export async function OA_UPDATE_USER_STAFF_TEAM(input: {
  user_id: string;
  staff_team: StaffTeam;
}) {
  nvLog("AT", "▶️ OA_UPDATE_USER_STAFF_TEAM 시작", input);

  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ staff_team: input.staff_team })
      .eq("id", input.user_id)
      .select("id, staff_team")
      .single();

    if (error) throw error;

    return { success: true, data, error: null as string | null };
  } catch (err: any) {
    nvLog("AT", "❌ OA_UPDATE_USER_STAFF_TEAM 에러", err.message);
    return { success: false, data: null, error: err.message as string };
  }
}

