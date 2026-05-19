CREATE TABLE IF NOT EXISTS public.site_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL UNIQUE, -- 'ABOUT', 'TERMS', 'PRIVACY', 'YOUTH'
    content TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.site_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.site_policies 
FOR SELECT USING (true);

CREATE POLICY "Enable write access for admins" ON public.site_policies 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
);

-- Initial Dummy Data
INSERT INTO public.site_policies (type, content) VALUES
('ABOUT', '회사소개 내용을 입력해주세요.'),
('TERMS', '이용약관 내용을 입력해주세요.'),
('PRIVACY', '개인정보처리방침 내용을 입력해주세요.'),
('YOUTH', '청소년보호정책 내용을 입력해주세요.')
ON CONFLICT (type) DO NOTHING;
