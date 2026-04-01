-- ==========================================
-- Foxmon 고객센터 DB 마이그레이션
-- Version: v1.0
-- Date: 2026-04-01
-- Supabase SQL Editor에서 실행하세요.
-- ==========================================

-- 1. notices (공지사항)
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT '공지',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT '영자',
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notices_public_read" ON public.notices FOR SELECT USING (true);

-- 2. faqs (자주 묻는 질문)
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faqs_public_read" ON public.faqs FOR SELECT USING (is_active = true);

-- 3. inquiries (1:1 문의)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  reply TEXT,
  replied_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT inquiries_status_check CHECK (status IN ('PENDING', 'ANSWERED', 'CLOSED'))
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inquiry_own_read" ON public.inquiries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "inquiry_own_insert" ON public.inquiries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_notices_pinned ON public.notices(is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category, sort_order);
CREATE INDEX IF NOT EXISTS idx_inquiries_user ON public.inquiries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
