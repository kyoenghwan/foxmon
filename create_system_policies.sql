-- ==========================================
-- 1. Create system_policies table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.system_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_type VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'resume_privacy', 'terms_of_service'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. Insert Default Resume Privacy Policy
-- ==========================================
INSERT INTO public.system_policies (policy_type, title, content, is_required)
VALUES (
    'resume_privacy', 
    '이력서 개인정보 수집 및 이용 동의', 
    'Foxmon(폭스몬)은 구직 서비스 제공을 위해 아래와 같이 개인정보를 수집 및 이용합니다.
    
1. 수집하는 개인정보 항목
- 필수항목: 이름, 성별, 연락처, 이메일, 생년월일, 희망근무조건 등 이력서 작성 시 입력한 정보
- 선택항목: 경력사항, 자격증, 자기소개서 내용 등

2. 개인정보 수집 및 이용 목적
- 구직자와 구인자 간의 매칭 및 연락
- 이력서 등록 및 입사지원 서비스 제공
- 맞춤형 구인정보 제공 및 알림 서비스

3. 개인정보의 보유 및 이용 기간
- 회원의 동의 하에 수집된 개인정보는 회원 탈퇴 시까지 보유 및 이용됩니다.
- 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우, 해당 기간 동안 보관합니다.

4. 동의를 거부할 권리 및 거부 시 불이익
- 귀하는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다.
- 단, 필수 항목에 대한 동의를 거부하실 경우 이력서 등록 및 구직 서비스 이용이 제한될 수 있습니다.',
    true
)
ON CONFLICT (policy_type) 
DO UPDATE SET 
    title = EXCLUDED.title,
    content = EXCLUDED.content;

-- ==========================================
-- 3. Setup RLS (Row Level Security)
-- ==========================================
ALTER TABLE public.system_policies ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Enable read access for all users" 
ON public.system_policies FOR SELECT 
USING (true);

-- Allow full access to admins only (assuming role = 'ADMIN' or 'SUPER_ADMIN')
-- If you don't have a secure way to check role in RLS yet, you can leave this open or manage via API (server-side check)
-- For now, we will rely on server-side checks in the API routes.
CREATE POLICY "Enable all access for authenticated users temporarily" 
ON public.system_policies FOR ALL 
USING (auth.role() = 'authenticated');
