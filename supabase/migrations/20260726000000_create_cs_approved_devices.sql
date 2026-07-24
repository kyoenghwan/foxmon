-- CS 전용 기기 인증 관리 테이블 생성
CREATE TABLE IF NOT EXISTS public.cs_approved_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_token VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화 및 관리자 권한 제어
ALTER TABLE public.cs_approved_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "관리자는 모든 기기 데이터를 관리할 수 있음"
    ON public.cs_approved_devices FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'SUPER_ADMIN')
        )
    );
