-- ==========================================
-- Foxmon 커뮤니티 게시판 DB 마이그레이션
-- Version: v1.0
-- Date: 2026-04-01
-- Supabase SQL Editor에서 실행하세요.
-- ==========================================

CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  thumbnail TEXT,
  price TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  is_hot BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT community_posts_board_check CHECK (
    board_id IN ('free', 'foxtalk', 'foxmarket', 'reviews', 'tips', 'report', 'business')
  )
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 게시글 읽기 가능
CREATE POLICY "community_posts_public_read" ON public.community_posts
  FOR SELECT USING (true);

-- 본인 게시글만 작성 가능
CREATE POLICY "community_posts_own_insert" ON public.community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인 게시글만 수정 가능
CREATE POLICY "community_posts_own_update" ON public.community_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- 본인 게시글만 삭제 가능
CREATE POLICY "community_posts_own_delete" ON public.community_posts
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_community_posts_board ON public.community_posts(board_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_user ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_hot ON public.community_posts(board_id, is_hot DESC, created_at DESC);
