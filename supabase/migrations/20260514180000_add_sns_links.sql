-- Add sns_links JSONB column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS sns_links JSONB DEFAULT '[]'::jsonb;

-- Comment on column
COMMENT ON COLUMN public.users.sns_links IS '동적 SNS 연결 정보 목록 (예: [{"type": "kakao", "value": "id"}, {"type": "line", "value": "id"}])';
