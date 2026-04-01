-- ==============================================
-- Foxmon 이력서 테이블(resumes) 생성 쿼리
-- Supabase SQL Editor 에 복사하여 실행하세요.
-- ==============================================

CREATE TABLE public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    nickname TEXT,
    gender TEXT CHECK (gender IN ('M', 'F')),
    contact_number TEXT,
    is_contact_public BOOLEAN DEFAULT false,
    sns_type TEXT,
    sns_id TEXT,
    desired_location TEXT,
    desired_industry TEXT,
    desired_pay_type TEXT,
    desired_pay_amount NUMERIC,
    contact_time TEXT,
    is_anytime_contact BOOLEAN DEFAULT false,
    photo_url TEXT,
    self_introduction TEXT,
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS(Row Level Security) 설정이 필요한 경우 (우선 비활성화로 모든 쿼리 허용)
-- 폭스몬은 NextAuth 커스텀 인증을 사용하므로, Supabase Native RLS (auth.uid()) 대신 서버 단(FA)에서 권한을 제어합니다.
ALTER TABLE public.resumes DISABLE ROW LEVEL SECURITY;

-- 테스트(Mock) 데이터를 원하실 경우 아래 주석을 풀고 실행하세요 (선택 사항)
-- INSERT INTO public.resumes (user_id, title, gender, contact_number, desired_location, desired_industry, self_introduction)
-- VALUES 
--   ((SELECT id FROM public.users LIMIT 1), '성실하고 밝은 20대 지원자입니다.', 'M', '010-1234-5678', '서울 강남구', '아로마마사지', '초보지만 열심히 배우겠습니다!');
