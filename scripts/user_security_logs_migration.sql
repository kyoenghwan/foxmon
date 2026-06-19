-- 1. CI 가입/탈퇴 이력 로그 테이블 생성
CREATE TABLE IF NOT EXISTS user_ci_history_logs (
    ci VARCHAR PRIMARY KEY, -- KMC 본인인증 고유 CI
    first_registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_withdrawn_at TIMESTAMP WITH TIME ZONE,
    last_registered_at TIMESTAMP WITH TIME ZONE,
    signup_count INTEGER DEFAULT 1 NOT NULL,
    is_eligible_for_referral_points BOOLEAN DEFAULT true NOT NULL
);

-- 2. 로그인 접속 로그 테이블 생성
CREATE TABLE IF NOT EXISTS user_connection_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(100) NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_connection_logs_user_id ON user_connection_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connection_logs_created_at ON user_connection_logs(created_at);

-- 3. RLS (Row Level Security) 설정
ALTER TABLE user_ci_history_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connection_logs ENABLE ROW LEVEL SECURITY;

-- CI 로그는 민감하므로 일반 유저 직접 조회 및 수정 전면 차단 (어드민/Service Role만 가능)
-- 접속 로그는 본인의 로그만 조회 가능하도록 설정
CREATE POLICY select_own_connection_logs ON user_connection_logs
    FOR SELECT
    USING (auth.uid() = user_id);
