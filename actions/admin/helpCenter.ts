"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdminRole } from "@/lib/normalize-user-role";

function assertAdmin() {
  return auth().then((session) => {
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session?.user || !isAdminRole(role)) {
      return { ok: false as const, error: "Unauthorized" };
    }
    return { ok: true as const, userId: session.user.id as string };
  });
}

export async function adminListNotices() {
  const gate = await assertAdmin();
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
}) {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };
  const row = {
    category: input.category.trim() || "공지",
    title: input.title.trim(),
    content: input.content.trim(),
    is_pinned: input.is_pinned,
    author_name: input.author_name?.trim() || "영자",
    author_id: gate.userId,
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
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };
  const { error } = await supabaseAdmin.from("notices").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/help");
  revalidatePath("/fox-office/help");
  return { success: true };
}

export async function adminListFaqs() {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error, data: [] };
  const { data, error } = await supabaseAdmin
    .from("faqs")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function adminUpsertFaq(input: {
  id?: string;
  category: string;
  question: string;
  answer: string;
  sort_order?: number;
  is_active?: boolean;
}) {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };
  const row = {
    category: input.category.trim(),
    question: input.question.trim(),
    answer: input.answer.trim(),
    sort_order: input.sort_order ?? 0,
    is_active: input.is_active !== false,
  };
  if (!row.category || !row.question || !row.answer) {
    return { success: false, error: "카테고리, 질문, 답변을 입력해주세요." };
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
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };
  const { error } = await supabaseAdmin.from("faqs").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/help/faq");
  revalidatePath("/fox-office/help");
  return { success: true };
}

export async function adminListInquiries(status?: string) {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error, data: [] };
  let q = supabaseAdmin.from("inquiries").select("*").order("created_at", { ascending: false });
  if (status && status !== "ALL") {
    q = q.eq("status", status);
  }
  const { data, error } = await q;
  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function adminReplyInquiry(input: {
  id: string;
  reply: string;
  status?: "ANSWERED" | "CLOSED";
}) {
  const gate = await assertAdmin();
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
