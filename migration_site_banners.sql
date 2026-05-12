-- ==============================================================================
-- [Foxmon] 사이트 배너 및 이벤트 팝업 테이블 (site_banners)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.site_banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'POPUP', -- 'POPUP', 'MAIN_BANNER'
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active BOOLEAN DEFAULT false,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;

-- 누구나 배너 조회 가능
CREATE POLICY "Enable read access for all users"
    ON public.site_banners FOR SELECT
    USING (true);

-- 관리자만 삽입/수정/삭제 가능 (RLS에서 role 확인이 복잡할 경우 서비스키로 우회)
CREATE POLICY "Enable all access for admin only"
    ON public.site_banners FOR ALL
    USING (auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN')));
