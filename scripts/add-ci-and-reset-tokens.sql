-- CI(연계정보) 컬럼 추가 - 본인인증 기반 계정 복구용
-- KMC 본인인증 시 발급되는 고유 식별값 (동일인이면 항상 동일)
ALTER TABLE users ADD COLUMN IF NOT EXISTS ci TEXT UNIQUE;

-- 비밀번호 재설정 토큰 테이블
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 만료된 토큰 자동 정리용 인덱스
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires 
  ON password_reset_tokens(expires_at) WHERE used = false;
