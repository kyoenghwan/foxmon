import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ShieldCheck, Users, Headset, Megaphone, Clock, MessageSquare, Bot } from "lucide-react";
import { QA_GET_SUPPORT_STAFF_USERS } from "@/src/atoms/qa/admin/QA_GET_SUPPORT_STAFF_USERS";
import { isSupabaseServiceRoleConfigured } from "@/lib/supabase";
import { getSiteSettings, updateSiteSettings } from "@/actions/admin/siteSettings";
import { updateUserStaffTeam } from "@/actions/admin/staffTeams";
import {
  parseCsSettings,
  csSettingsToPayload,
  businessHoursLabel,
  DEFAULT_CS_SETTINGS,
} from "@/lib/cs-settings";
import { isAdminRole } from "@/lib/normalize-user-role";

function staffTeamLabel(v?: string | null) {
  if (v === "CS") return "고객응대";
  if (v === "AD") return "광고";
  return "운영";
}

type SessionUser = {
  role?: string;
  staff_team?: string;
};

type AdminUserRow = {
  id: string;
  login_id: string;
  name?: string | null;
  nickname?: string | null;
  role?: string | null;
  staff_team?: string | null;
};

type PageProps = {
  searchParams?: Promise<{ msg?: string; type?: string }>;
};

export default async function SupportStaffManagementPage({ searchParams }: PageProps) {
  const session = await auth();
  const sessionUser = session?.user as unknown as SessionUser | undefined;
  const role = sessionUser?.role;
  const sp = (await searchParams) || {};
  const flashMsg = sp.msg ? decodeURIComponent(sp.msg) : null;
  const flashType = sp.type === "ok" ? "ok" : sp.type === "error" ? "error" : null;
  const canEditStaff = isAdminRole(role);

  if (!session?.user || !canEditStaff) {
    redirect("/");
  }

  const [usersRes, settingsRes] = await Promise.all([
    QA_GET_SUPPORT_STAFF_USERS(),
    getSiteSettings(),
  ]);
  const staffUsers = usersRes.success ? ((usersRes.data as unknown) as AdminUserRow[]) : [];
  const usersFetchError = usersRes.success ? null : usersRes.error;

  const settings = settingsRes.success ? (settingsRes.data as Record<string, string>) : {};
  const primaryCsAdminUserId = settings?.cs_admin_user_id || "";
  const csSettings = parseCsSettings(settings);
  const dayOptions = [
    { v: 1, l: "월" },
    { v: 2, l: "화" },
    { v: 3, l: "수" },
    { v: 4, l: "목" },
    { v: 5, l: "금" },
    { v: 6, l: "토" },
    { v: 0, l: "일" },
  ];

  async function setPrimaryCsUser(formData: FormData) {
    "use server";
    const nextId = String(formData.get("cs_admin_user_id") || "").trim();
    const s = await auth();
    const r = (s?.user as unknown as SessionUser | undefined)?.role;
    if (!s?.user || !isAdminRole(r)) {
      redirect("/fox-office/support/staff?type=error&msg=" + encodeURIComponent("권한이 없습니다."));
    }
    const res = await updateSiteSettings({ cs_admin_user_id: nextId });
    revalidatePath("/fox-office/support/staff");
    if (!res.success) {
      redirect(
        "/fox-office/support/staff?type=error&msg=" +
          encodeURIComponent(res.error || "대표 상담원 저장에 실패했습니다.")
      );
    }
    redirect("/fox-office/support/staff?type=ok&msg=" + encodeURIComponent("대표 상담원이 저장되었습니다."));
  }

  async function setStaffTeam(formData: FormData) {
    "use server";
    const userId = String(formData.get("user_id") || "").trim();
    const staffTeam = String(formData.get("staff_team") || "OPS").trim() as "OPS" | "AD" | "CS";
    if (!userId) {
      redirect("/fox-office/support/staff?type=error&msg=" + encodeURIComponent("계정을 선택해 주세요."));
    }
    const res = await updateUserStaffTeam({ userId, staffTeam });
    revalidatePath("/fox-office/support/staff");
    if (!res.success) {
      redirect(
        "/fox-office/support/staff?type=error&msg=" +
          encodeURIComponent(
            res.error === "Unauthorized"
              ? "담당 역할 변경 권한이 없습니다."
              : "담당 역할 저장에 실패했습니다."
          )
      );
    }
    redirect("/fox-office/support/staff?type=ok&msg=" + encodeURIComponent("담당 역할이 저장되었습니다."));
  }

  async function saveCsPolicy(formData: FormData) {
    "use server";
    const s = await auth();
    const r = (s?.user as unknown as SessionUser | undefined)?.role;
    if (!s?.user || !isAdminRole(r)) {
      redirect("/fox-office/support/staff?type=error&msg=" + encodeURIComponent("권한이 없습니다."));
    }
    const days = formData.getAll("cs_days").map((d) => String(d));
    const payload = csSettingsToPayload({
      hoursStart: String(formData.get("cs_hours_start") || DEFAULT_CS_SETTINGS.hoursStart),
      hoursEnd: String(formData.get("cs_hours_end") || DEFAULT_CS_SETTINGS.hoursEnd),
      days: days.length
        ? days.map((d) => parseInt(d, 10)).filter((n) => !Number.isNaN(n))
        : DEFAULT_CS_SETTINGS.days,
      timezone: String(formData.get("cs_timezone") || DEFAULT_CS_SETTINGS.timezone),
      messageInHours: String(formData.get("cs_msg_in_hours") || DEFAULT_CS_SETTINGS.messageInHours),
      messageAfterHours: String(
        formData.get("cs_msg_after_hours") || DEFAULT_CS_SETTINGS.messageAfterHours
      ),
      automationEnabled: formData.get("cs_automation_enabled") === "on",
      automationRulesJson: String(
        formData.get("cs_automation_rules") || DEFAULT_CS_SETTINGS.automationRulesJson
      ),
    });
    const res = await updateSiteSettings(payload);
    revalidatePath("/fox-office/support/staff");
    revalidatePath("/fox-office/support/inbox");
    if (!res.success) {
      redirect(
        "/fox-office/support/staff?type=error&msg=" +
          encodeURIComponent(res.error || "고객센터 정책 저장에 실패했습니다.")
      );
    }
    redirect("/fox-office/support/staff?type=ok&msg=" + encodeURIComponent("업무시간·응대 메시지가 저장되었습니다."));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            고객센터 관리
          </h2>
          <p className="text-[13px] text-gray-500 font-medium mt-1">
            담당자 지정, 업무시간·자동 응답 메시지, 키워드 자동 응답 봇을 한곳에서 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-black text-gray-600 bg-gray-100 px-3 py-2 rounded-xl">
            내 권한: {role}
          </span>
          {sessionUser?.staff_team ? (
            <span className="text-[12px] font-black text-gray-600 bg-gray-100 px-3 py-2 rounded-xl">
              내 담당: {staffTeamLabel(sessionUser?.staff_team)}
            </span>
          ) : null}
        </div>
      </div>

      {flashMsg && flashType ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-[13px] font-bold ${
            flashType === "ok"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {flashMsg}
        </div>
      ) : null}

      {usersFetchError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-800">
          {usersFetchError}
          {!isSupabaseServiceRoleConfigured ? (
            <p className="mt-2 font-medium text-red-700">
              Vercel/서버 환경 변수에 <code className="font-mono text-[12px]">SUPABASE_SERVICE_ROLE_KEY</code>를
              넣은 뒤 재배포하면 ADMIN 계정이 모두 표시됩니다.
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="text-[12px] text-gray-500 font-medium">
        표시 조건: <span className="font-black">ADMIN</span> / <span className="font-black">SUPER_ADMIN</span>,{" "}
        <span className="font-black">staff_team=CS</span>, 또는{" "}
        <span className="font-black">login_id가 foxmon_ 로 시작</span> 하는 계정 (현재 {staffUsers.length}명)
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 lg:col-span-1">
          <div className="flex items-center gap-2">
            <Headset className="w-5 h-5 text-primary" />
            <h3 className="font-black text-gray-900">대표 상담원(고객센터 기본 수신)</h3>
          </div>
          <p className="text-[12px] text-gray-500 font-medium mt-1">
            폭스톡 위젯 CS 진입 시 방에 자동으로 참가(수신)되는 1차 담당 계정입니다.
          </p>

          <form action={setPrimaryCsUser} className="mt-4 space-y-3">
            <select
              name="cs_admin_user_id"
              defaultValue={primaryCsAdminUserId}
              className="w-full h-11 px-3 border border-gray-200 rounded-xl text-[13px] font-bold bg-white focus:outline-none focus:border-primary"
            >
              <option value="">(미지정)</option>
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nickname || u.name || u.login_id} ({u.login_id}) · {u.role} · {staffTeamLabel(u.staff_team)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-primary text-black font-black shadow-lg shadow-primary/15 hover:opacity-90 transition"
            >
              대표 상담원 저장
            </button>
            <p className="text-[11px] text-gray-400 font-medium">
              참고: “담당 역할(고객응대)” 부여와 별개로, 이 값은 위젯 자동 참가/텔레그램 필터 등에 사용됩니다.
            </p>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-black text-gray-900">관리자 계정 담당 역할 지정</h3>
          </div>
          <p className="text-[12px] text-gray-500 font-medium mt-1">
            ADMIN · SUPER_ADMIN 계정에서 담당 역할(운영/광고/고객응대)을 변경할 수 있습니다.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#f8f9fa] border-b border-gray-100 text-[12px] font-bold text-gray-600">
                <tr>
                  <th className="p-3">계정</th>
                  <th className="p-3">이름/닉네임</th>
                  <th className="p-3">권한</th>
                  <th className="p-3">담당</th>
                  <th className="p-3">변경</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffUsers.map((u) => {
                  const isPrimary = primaryCsAdminUserId && u.id === primaryCsAdminUserId;
                  return (
                    <tr key={u.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-3">
                        <div className="font-black text-gray-900 text-[13px]">{u.login_id}</div>
                        {isPrimary ? (
                          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-black text-primary">
                            <Headset className="w-3 h-3" />
                            대표 상담원
                          </div>
                        ) : null}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-gray-900 text-[13px]">{u.name || "-"}</div>
                        <div className="text-[11px] text-gray-500 font-medium">{u.nickname || "-"}</div>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-[11px] font-black text-purple-700">
                          <ShieldCheck className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-black ${
                            u.staff_team === "CS"
                              ? "bg-orange-50 text-orange-700"
                              : u.staff_team === "AD"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-gray-50 text-gray-700"
                          }`}
                        >
                          {u.staff_team === "CS" ? (
                            <Headset className="w-3 h-3" />
                          ) : u.staff_team === "AD" ? (
                            <Megaphone className="w-3 h-3" />
                          ) : (
                            <ShieldCheck className="w-3 h-3" />
                          )}
                          {staffTeamLabel(u.staff_team)}
                        </span>
                      </td>
                      <td className="p-3">
                        <form action={setStaffTeam} className="flex items-center gap-2">
                          <input type="hidden" name="user_id" value={u.id} />
                          <select
                            name="staff_team"
                            defaultValue={u.staff_team || "OPS"}
                            disabled={!canEditStaff}
                            className="h-9 px-2 border border-gray-200 rounded-lg text-[12px] font-bold bg-white disabled:bg-gray-50 disabled:text-gray-400"
                          >
                            <option value="OPS">운영</option>
                            <option value="AD">광고</option>
                            <option value="CS">고객응대</option>
                          </select>
                          <button
                            type="submit"
                            disabled={!canEditStaff}
                            className="h-9 px-3 rounded-lg bg-gray-900 text-white text-[12px] font-black disabled:opacity-40"
                          >
                            저장
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}

                {staffUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-500 font-medium">
                      관리자 계정이 없습니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-black text-gray-900">업무시간 · 자동 응답 메시지</h3>
        </div>
        <p className="text-[12px] text-gray-500 font-medium -mt-2">
          고객이 <span className="font-black">첫 문의</span>를 남길 때만 자동 안내가 발송됩니다. 업무시간 안/밖 메시지가
          달라집니다. (현재 설정: {businessHoursLabel(csSettings)})
        </p>

        <form action={saveCsPolicy} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-[12px] font-black text-gray-700">시작 시각</span>
              <input
                type="time"
                name="cs_hours_start"
                defaultValue={csSettings.hoursStart}
                className="mt-1 w-full h-11 px-3 border border-gray-200 rounded-xl text-[13px] font-bold"
              />
            </label>
            <label className="block">
              <span className="text-[12px] font-black text-gray-700">종료 시각</span>
              <input
                type="time"
                name="cs_hours_end"
                defaultValue={csSettings.hoursEnd}
                className="mt-1 w-full h-11 px-3 border border-gray-200 rounded-xl text-[13px] font-bold"
              />
            </label>
            <label className="block">
              <span className="text-[12px] font-black text-gray-700">시간대</span>
              <input
                type="text"
                name="cs_timezone"
                defaultValue={csSettings.timezone}
                placeholder="Asia/Seoul"
                className="mt-1 w-full h-11 px-3 border border-gray-200 rounded-xl text-[13px] font-bold"
              />
            </label>
          </div>

          <div>
            <span className="text-[12px] font-black text-gray-700">업무 요일</span>
            <div className="mt-2 flex flex-wrap gap-3">
              {dayOptions.map((d) => (
                <label key={d.v} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-gray-700">
                  <input
                    type="checkbox"
                    name="cs_days"
                    value={String(d.v)}
                    defaultChecked={csSettings.days.includes(d.v)}
                    className="rounded border-gray-300"
                  />
                  {d.l}
                </label>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-[12px] font-black text-gray-700 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              업무시간 중 첫 문의 자동 안내
            </span>
            <textarea
              name="cs_msg_in_hours"
              rows={3}
              defaultValue={csSettings.messageInHours}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] font-medium resize-y"
            />
          </label>

          <label className="block">
            <span className="text-[12px] font-black text-gray-700 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              업무시간 외 첫 문의 자동 안내
            </span>
            <textarea
              name="cs_msg_after_hours"
              rows={3}
              defaultValue={csSettings.messageAfterHours}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] font-medium resize-y"
            />
          </label>

          <div className="border-t border-gray-100 pt-4 mt-2">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-5 h-5 text-primary" />
              <h4 className="font-black text-gray-800 text-[14px]">키워드 자동 응답 봇</h4>
            </div>
            <p className="text-[12px] text-gray-500 font-medium mb-3">
              고객 메시지에 키워드가 포함되면 아래 규칙의 답변을 자동 전송합니다. JSON 배열 형식입니다.
            </p>
            <label className="inline-flex items-center gap-2 text-[13px] font-bold text-gray-700 mb-2">
              <input
                type="checkbox"
                name="cs_automation_enabled"
                defaultChecked={csSettings.automationEnabled}
                className="rounded border-gray-300"
              />
              자동 응답 봇 사용
            </label>
            <textarea
              name="cs_automation_rules"
              rows={6}
              defaultValue={csSettings.automationRulesJson}
              placeholder='[{"keywords":["배너","광고"],"reply":"광고 문의 감사합니다. 담당자가 확인 후 답변드립니다."}]'
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] font-mono resize-y"
            />
          </div>

          <button
            type="submit"
            className="h-11 px-6 rounded-xl bg-gray-900 text-white text-[13px] font-black hover:bg-black transition"
          >
            업무시간·메시지·자동봇 저장
          </button>
        </form>
      </div>
    </div>
  );
}

