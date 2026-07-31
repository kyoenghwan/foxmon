"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { canManageHelpCenter } from "@/lib/help-center-auth";

function assertHelpCenterStaff() {
  return auth().then((session) => {
    const user = session?.user as
      | { id?: string; role?: string; login_id?: string; staff_team?: string }
      | undefined;
    if (!session?.user || !canManageHelpCenter(user)) {
      return { ok: false as const, error: "Unauthorized" };
    }
    return { ok: true as const, userId: session.user.id as string, user };
  });
}

export async function adminListNotices() {
  const gate = await assertHelpCenterStaff();
  if (!gate.ok) return { success: false, error: gate.error, data: [] };
  const { data, error } = await supabaseAdmin
    .from("notices")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function adminUpsertNotice(input: {
  id?: string;
  category: string;
  title: string;
  content: string;
  is_pinned: boolean;
  author_name?: string;
  content_format?: string;
  target_role?: "ALL" | "EMPLOYER" | "GENERAL";
}) {
  const gate = await assertHelpCenterStaff();
  if (!gate.ok) return { success: false, error: gate.error };
  const row = {
    category: input.category.trim() || "공지",
    title: input.title.trim(),
    content: input.content.trim(),
    content_format: input.content_format || "markdown",
    is_pinned: input.is_pinned,
    author_name: input.author_name?.trim() || "영자",
    author_id: gate.userId,
    target_role: input.target_role || "ALL",
    updated_at: new Date().toISOString(),
  };
  if (!row.title || !row.content) {
    return { success: false, error: "제목과 내용을 입력해주세요." };
  }

  const q = input.id
    ? supabaseAdmin.from("notices").update(row).eq("id", input.id)
    : supabaseAdmin.from("notices").insert(row);
  const { error } = await q;
  if (error) return { success: false, error: error.message };
  revalidatePath("/help");
  revalidatePath("/fox-office/help");
  return { success: true };
}

export async function adminDeleteNotice(id: string) {
  const gate = await assertHelpCenterStaff();
  if (!gate.ok) return { success: false, error: gate.error };
  const { error } = await supabaseAdmin.from("notices").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/help");
  revalidatePath("/fox-office/help");
  return { success: true };
}

export async function adminListFaqCategories() {
  const gate = await assertHelpCenterStaff();
  if (!gate.ok) return { success: false, error: gate.error, data: [] };
  const { data, error } = await supabaseAdmin
    .from("faq_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function adminUpsertFaqCategory(input: {
  id?: string;
  name: string;
  sort_order?: number;
  is_active?: boolean;
}) {
  const gate = await assertHelpCenterStaff();
  if (!gate.ok) return { success: false, error: gate.error };
  const name = input.name.trim();
  if (!name) return { success: false, error: "항목 이름을 입력해주세요." };
  const row = {
    name,
    sort_order: input.sort_order ?? 0,
    is_active: input.is_active !== false,
  };
  const q = input.id
    ? supabaseAdmin.from("faq_categories").update(row).eq("id", input.id)
    : supabaseAdmin.from("faq_categories").insert(row);
  const { error } = await q;
  if (error) return { success: false, error: error.message };
  revalidatePath("/help/faq");
  revalidatePath("/fox-office/help");
  return { success: true };
}

export async function adminDeleteFaqCategory(id: string) {
  const gate = await assertHelpCenterStaff();
  if (!gate.ok) return { success: false, error: gate.error };
  const { count } = await supabaseAdmin
    .from("faqs")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if ((count ?? 0) > 0) {
    return { success: false, error: "이 항목에 FAQ가 있어 삭제할 수 없습니다. FAQ를 먼저 옮기거나 삭제해 주세요." };
  }
  const { error } = await supabaseAdmin.from("faq_categories").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/help/faq");
  revalidatePath("/fox-office/help");
  return { success: true };
}

export async function adminListFaqs() {
  const gate = await assertHelpCenterStaff();
  if (!gate.ok) return { success: false, error: gate.error, data: [] };
  const { data, error } = await supabaseAdmin
    .from("faqs")
    .select("*, faq_categories(name)")
    .order("sort_order", { ascending: true });
  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function adminUpsertFaq(input: {
  id?: string;
  category_id: string;
  question: string;
  answer: string;
  sort_order?: number;
  is_active?: boolean;
  answer_format?: string;
  target_role?: "ALL" | "EMPLOYER" | "GENERAL";
}) {
  const gate = await assertHelpCenterStaff();
  if (!gate.ok) return { success: false, error: gate.error };

  const { data: cat } = await supabaseAdmin
    .from("faq_categories")
    .select("name")
    .eq("id", input.category_id)
    .maybeSingle();
  if (!cat?.name) return { success: false, error: "선택한 폴더(항목)를 찾을 수 없습니다." };

  const row = {
    category_id: input.category_id,
    category: cat.name,
    question: input.question.trim(),
    answer: input.answer.trim(),
    answer_format: input.answer_format || "markdown",
    sort_order: input.sort_order ?? 0,
    is_active: input.is_active !== false,
    target_role: input.target_role || "ALL",
  };
  if (!row.question || !row.answer) {
    return { success: false, error: "질문과 답변을 입력해주세요." };
  }
  const q = input.id
    ? supabaseAdmin.from("faqs").update(row).eq("id", input.id)
    : supabaseAdmin.from("faqs").insert(row);
  const { error } = await q;
  if (error) return { success: false, error: error.message };
  revalidatePath("/help/faq");
  revalidatePath("/fox-office/help");
  return { success: true };
}

export async function adminDeleteFaq(id: string) {
  const gate = await assertHelpCenterStaff();
  if (!gate.ok) return { success: false, error: gate.error };
  const { error } = await supabaseAdmin.from("faqs").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/help/faq");
  revalidatePath("/fox-office/help");
  return { success: true };
}

export async function adminListInquiries(status?: string) {
  const gate = await assertHelpCenterStaff();
  if (!gate.ok) return { success: false, error: gate.error, data: [] };
  let q = supabaseAdmin
    .from("inquiries")
    .select("*, users(login_id, nickname, name)")
    .order("created_at", { ascending: false });
  if (status && status !== "ALL") {
    q = q.eq("status", status);
  }
  let { data, error } = await q;
  if (error) {
    let fallback = supabaseAdmin.from("inquiries").select("*").order("created_at", { ascending: false });
    if (status && status !== "ALL") fallback = fallback.eq("status", status);
    const res = await fallback;
    data = res.data;
    error = res.error;
  }
  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function adminReplyInquiry(input: {
  id: string;
  reply: string;
  status?: "ANSWERED" | "CLOSED";
}) {
  const gate = await assertHelpCenterStaff();
  if (!gate.ok) return { success: false, error: gate.error };
  const reply = input.reply.trim();
  if (!reply) return { success: false, error: "답변 내용을 입력해주세요." };
  const { error } = await supabaseAdmin
    .from("inquiries")
    .update({
      reply,
      status: input.status || "ANSWERED",
      replied_by: gate.userId,
      replied_at: new Date().toISOString(),
    })
    .eq("id", input.id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/help/inquiry");
  revalidatePath("/fox-office/help");
  return { success: true };
}
