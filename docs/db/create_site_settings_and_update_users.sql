-- 1. users 테이블에 무료 AI 로고 생성 잔여 횟수 컬럼 추가 (기본값 5)
ALTER TABLE users ADD COLUMN free_ai_logos_remaining INT NOT NULL DEFAULT 5;

-- 2. 시스템 전역 설정을 위한 site_settings 테이블 생성
CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(255) NOT NULL,
    key_name VARCHAR(255) NOT NULL UNIQUE,
    key_value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_site_settings_category ON site_settings(category);
CREATE INDEX idx_site_settings_key_name ON site_settings(key_name);

-- RLS (Row Level Security) 설정
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 관리자(SUPER_ADMIN)만 읽고 쓸 수 있도록 정책 설정 
CREATE POLICY "Admin All Access" ON site_settings
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM users WHERE role = 'SUPER_ADMIN')
    );
