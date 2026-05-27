-- daily_visitors 테이블 생성
CREATE TABLE daily_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ip_address VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (visit_date, ip_address)
);

-- 인덱스 추가
CREATE INDEX idx_daily_visitors_date ON daily_visitors(visit_date);

-- RLS (Row Level Security) 활성화
ALTER TABLE daily_visitors ENABLE ROW LEVEL SECURITY;

-- 익명(anon) 및 인증 회원(authenticated) 전체에 대해 INSERT/SELECT 허용
CREATE POLICY "Allow public insert" ON daily_visitors FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public select" ON daily_visitors FOR SELECT TO anon, authenticated USING (true);
