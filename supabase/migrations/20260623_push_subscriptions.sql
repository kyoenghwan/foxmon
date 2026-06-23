-- Web Push 구독 정보 테이블
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    subscription_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);

-- RLS 정책
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 서비스 역할만 접근 가능 (서버 액션에서만 사용)
CREATE POLICY "Service role can manage push subscriptions"
    ON public.push_subscriptions
    FOR ALL
    USING (true)
    WITH CHECK (true);
