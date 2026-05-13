-- 사장님(또는 구직자)의 텔레그램 연동을 위한 chat_id 필드 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(100) DEFAULT NULL;

-- 빠른 검색을 위한 인덱스 (웹훅 수신 시 chat_id로 유저를 찾거나 조인할 때 사용될 수 있음)
CREATE INDEX IF NOT EXISTS idx_users_telegram_chat_id ON public.users(telegram_chat_id);
