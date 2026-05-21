-- FAQ 카테고리(폴더) + FAQ category_id 연동

CREATE TABLE IF NOT EXISTS public.faq_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(80) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT faq_categories_name_unique UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_faq_categories_sort ON public.faq_categories (sort_order, created_at);

ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "faq_categories_public_read" ON public.faq_categories;
CREATE POLICY "faq_categories_public_read" ON public.faq_categories FOR SELECT USING (is_active = true);

ALTER TABLE public.faqs
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.faq_categories(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS answer_format VARCHAR(20) NOT NULL DEFAULT 'markdown';

-- 기본 카테고리 (없을 때만)
INSERT INTO public.faq_categories (name, sort_order)
SELECT * FROM (VALUES
    ('이용 안내', 1),
    ('포인트·결제', 2),
    ('광고 문의', 3),
    ('이력서·지원', 4),
    ('기타', 99)
) AS v(name, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.faq_categories LIMIT 1);

-- 기존 FAQ category 문자열 → category_id 매핑
UPDATE public.faqs f
SET category_id = c.id
FROM public.faq_categories c
WHERE f.category_id IS NULL AND f.category = c.name;

UPDATE public.faqs f
SET category_id = (SELECT id FROM public.faq_categories WHERE name = '기타' LIMIT 1)
WHERE f.category_id IS NULL;

-- Storage: FAQ 이미지 (Supabase 대시보드에서 public 버킷 생성 권장)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('help_assets', 'help_assets', true) ON CONFLICT DO NOTHING;
