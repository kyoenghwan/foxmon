'use server';

import { auth } from '@/auth';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import { format } from 'date-fns';

export type PublicNotice = {
  id: string;
  category: string;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
  view_count: number;
  is_pinned: boolean;
};

export type PublicFaq = {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
};

export type UserInquiry = {
  id: string;
  category: string;
  title: string;
  content: string;
  status: string;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
};

export type HomeNoticeItem = {
  id: string;
  title: string;
  date: string;
  isNew?: boolean;
  isHot?: boolean;
};

function formatNoticeDate(iso: string) {
  try {
    return format(new Date(iso), 'yyyy-MM-dd');
  } catch {
    return iso;
  }
}

export async function getPublicNotices(category?: string): Promise<PublicNotice[]> {
  try {
    let q = supabase.from('notices').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    if (category && category !== '전체') {
      q = q.eq('category', category);
    }
    const { data, error } = await q;
    if (error) {
      nvLog('AT', '❌ getPublicNotices', error);
      return [];
    }
    return (data || []).map((n) => ({
      id: n.id,
      category: n.category,
      title: n.title,
      content: n.content,
      author_name: n.author_name,
      created_at: formatNoticeDate(n.created_at),
      view_count: n.view_count ?? 0,
      is_pinned: !!n.is_pinned,
    }));
  } catch (err) {
    nvLog('AT', '❌ getPublicNotices 예외', err);
    return [];
  }
}

export async function incrementNoticeViewCount(noticeId: string) {
  try {
    const { data } = await supabaseAdmin.from('notices').select('view_count').eq('id', noticeId).single();
    const next = (data?.view_count ?? 0) + 1;
    await supabaseAdmin.from('notices').update({ view_count: next }).eq('id', noticeId);
    return { success: true, view_count: next };
  } catch {
    return { success: false };
  }
}

export async function getPublicFaqs(category?: string): Promise<PublicFaq[]> {
  try {
    let q = supabase
      .from('faqs')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (category && category !== '전체') {
      q = q.eq('category', category);
    }
    const { data, error } = await q;
    if (error) {
      nvLog('AT', '❌ getPublicFaqs', error);
      return [];
    }
    return data || [];
  } catch (err) {
    nvLog('AT', '❌ getPublicFaqs 예외', err);
    return [];
  }
}

export async function getHomeNotices(limit = 5): Promise<HomeNoticeItem[]> {
  const rows = await getPublicNotices();
  const dayMs = 86400000;
  return rows.slice(0, limit).map((n) => ({
    id: n.id,
    title: `[${n.category}] ${n.title}`,
    date: n.created_at,
    isNew: Date.now() - new Date(n.created_at).getTime() < dayMs,
    isHot: n.is_pinned,
  }));
}

export async function getMyInquiries(): Promise<{ inquiries: UserInquiry[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { inquiries: [], error: '로그인이 필요합니다.' };
  }
  try {
    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (error) {
      return { inquiries: [], error: error.message };
    }
    return { inquiries: data || [] };
  } catch (err: unknown) {
    return { inquiries: [], error: (err as Error)?.message || '조회 실패' };
  }
}

export async function createInquiry(input: {
  category: string;
  title: string;
  content: string;
}): Promise<{ success: boolean; message: string; inquiry?: UserInquiry }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: '로그인 후 문의를 접수할 수 있습니다.' };
  }
  const category = input.category?.trim();
  const title = input.title?.trim();
  const content = input.content?.trim();
  if (!category || !title || !content) {
    return { success: false, message: '유형, 제목, 내용을 모두 입력해주세요.' };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .insert({
        user_id: session.user.id,
        category,
        title,
        content,
        status: 'PENDING',
      })
      .select('*')
      .single();
    if (error) {
      nvLog('AT', '❌ createInquiry', error);
      const hint =
        error.message?.includes('inquiries') || error.code === '42P01'
          ? ' (DB에 inquiries 테이블이 없을 수 있습니다. Supabase 마이그레이션을 적용해 주세요.)'
          : '';
      return { success: false, message: `문의 접수에 실패했습니다. (${error.message})${hint}` };
    }
    return {
      success: true,
      message: '문의가 접수되었습니다.',
      inquiry: data as UserInquiry,
    };
  } catch (err: unknown) {
    return { success: false, message: (err as Error)?.message || '시스템 오류' };
  }
}
