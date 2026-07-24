'use server';

import { auth } from '@/auth';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import { format } from 'date-fns';
import { sendTelegramMessage } from '@/lib/telegram';

export type PublicNotice = {
  id: string;
  category: string;
  title: string;
  content: string;
  content_format?: string;
  author_name: string;
  created_at: string;
  view_count: number;
  is_pinned: boolean;
};

export type PublicFaqCategory = {
  id: string;
  name: string;
  sort_order: number;
};

export type PublicFaq = {
  id: string;
  category: string;
  category_id?: string | null;
  question: string;
  answer: string;
  answer_format?: string;
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

interface NoticeCacheItem {
  data: PublicNotice[];
  lastFetched: number;
}
const noticeCache: Record<string, NoticeCacheItem> = {};
const NOTICE_CACHE_TTL = 60 * 1000; // 60초 캐시 (1분)

export async function getPublicNotices(category?: string): Promise<PublicNotice[]> {
  const cacheKey = category || 'all';
  const now = Date.now();
  const cached = noticeCache[cacheKey];

  if (cached && (now - cached.lastFetched < NOTICE_CACHE_TTL)) {
    nvLog('AT', '⚡ [Cache Hit] getPublicNotices', { category });
    return cached.data;
  }

  try {
    let q = supabase.from('notices').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    if (category && category !== '전체') {
      q = q.eq('category', category);
    }
    const { data, error } = await q;
    if (error) {
      nvLog('AT', '❌ getPublicNotices', error);
      return cached?.data || [];
    }
    const formattedNotices = (data || []).map((n) => ({
      id: n.id,
      category: n.category,
      title: n.title,
      content: n.content,
      content_format: n.content_format || 'markdown',
      author_name: n.author_name,
      created_at: formatNoticeDate(n.created_at),
      view_count: n.view_count ?? 0,
      is_pinned: !!n.is_pinned,
    }));

    noticeCache[cacheKey] = {
      data: formattedNotices,
      lastFetched: Date.now()
    };

    return formattedNotices;
  } catch (err) {
    nvLog('AT', '❌ getPublicNotices 예외', err);
    return cached?.data || [];
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

export async function getPublicFaqCategories(): Promise<PublicFaqCategory[]> {
  try {
    const { data, error } = await supabase
      .from('faq_categories')
      .select('id, name, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) {
      nvLog('AT', '❌ getPublicFaqCategories', error);
      return [];
    }
    return data || [];
  } catch (err) {
    nvLog('AT', '❌ getPublicFaqCategories 예외', err);
    return [];
  }
}

export async function getPublicFaqs(categoryName?: string): Promise<PublicFaq[]> {
  try {
    let q = supabase
      .from('faqs')
      .select('id, category, category_id, question, answer, answer_format, sort_order, faq_categories(name)')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (categoryName && categoryName !== '전체') {
      q = q.eq('category', categoryName);
    }
    const { data, error } = await q;
    if (error) {
      nvLog('AT', '❌ getPublicFaqs', error);
      return [];
    }
    return (data || []).map((row: Record<string, unknown>) => {
      const joined = row.faq_categories as { name?: string } | null;
      return {
        id: row.id as string,
        category: joined?.name || (row.category as string) || '기타',
        category_id: row.category_id as string | null,
        question: row.question as string,
        answer: row.answer as string,
        answer_format: (row.answer_format as string) || 'markdown',
        sort_order: (row.sort_order as number) ?? 0,
      };
    });
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
    // 자동 답변(입금 계좌 안내) 대상인지 판단 (오직 '계좌 문의' 카테고리만 자동 답변 연동)
    const isAccountInquiry = category === '계좌 문의';

    let reply: string | null = null;
    let status = 'PENDING';
    let repliedAt: string | null = null;

    if (isAccountInquiry) {
      // DB에서 실시간 입금 계좌 설정 조회
      const { data: settings } = await supabaseAdmin
        .from('site_settings')
        .select('key_name, key_value')
        .in('key_name', ['bank_name', 'account_number', 'account_holder']);

      const settingsMap = (settings || []).reduce((acc, row) => {
        acc[row.key_name] = row.key_value;
        return acc;
      }, {} as Record<string, string>);

      const bankName = settingsMap['bank_name'] || '국민은행';
      const accountNumber = settingsMap['account_number'] || '123456-78-901234';
      const accountHolder = settingsMap['account_holder'] || '폭스몬';

      reply = `안녕하세요. 폭스몬 고객센터 자동 안내 시스템입니다.
요청하신 포인트 충전용 공식 무통장 입금 계좌를 아래와 같이 안내해 드립니다. 

- 은행명: ${bankName}
- 계좌번호: ${accountNumber}
- 예금주: ${accountHolder}

⚠️ 입금자명은 가입 시 등록된 대표자(본인) 명의 실명과 일치해야 하며, 타인 명의 계좌로 입금 시 충전 승인이 거부 및 자동 반송 처리될 수 있습니다. 

입금 완료 후 포인트 충전 신청 폼을 통해 신청서를 접수해 주시면 확인 후 신속하게 처리해 드리겠습니다.`;
      status = 'ANSWERED';
      repliedAt = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .insert({
        user_id: session.user.id,
        category,
        title,
        content,
        status,
        reply,
        replied_at: repliedAt,
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

    // 텔레그램 실시간 알림 전송 (비동기 처리)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://foxmon.co.kr';
    const nickname = session?.user?.name || '익명 회원';
    const messageText = `
<b>🔔 [폭스몬] 새로운 1:1 고객 문의가 접수되었습니다!</b>

• <b>작성자</b>: ${nickname}
• <b>카테고리</b>: ${category}
• <b>제목</b>: ${title}
• <b>내용 요약</b>: ${content.substring(0, 150)}${content.length > 150 ? '...' : ''}
• <b>답변 대기 여부</b>: ${isAccountInquiry ? '자동 답변완료' : '대기중 (수동 답변 필요)'}

👉 <a href="${appUrl}/cs">모바일 관리자 CS 페이지 바로가기</a>
`.trim();
    sendTelegramMessage(messageText).catch(e => nvLog('FW', '⚠️ 텔레그램 발송 오류', e));

    return {
      success: true,
      message: isAccountInquiry 
        ? '문의 접수와 동시에 입금 계좌번호 자동 답변이 완료되었습니다.' 
        : '문의가 접수되었습니다.',
      inquiry: data as UserInquiry,
    };
  } catch (err: unknown) {
    return { success: false, message: (err as Error)?.message || '오류 발생' };
  }
}
