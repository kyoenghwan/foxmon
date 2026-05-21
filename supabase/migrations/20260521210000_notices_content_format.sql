-- 공지사항 Markdown 형식 필드
ALTER TABLE public.notices
    ADD COLUMN IF NOT EXISTS content_format VARCHAR(20) NOT NULL DEFAULT 'markdown';

UPDATE public.notices SET content_format = 'markdown' WHERE content_format IS NULL;
