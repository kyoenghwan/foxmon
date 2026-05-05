-- 포인트 충전 신청 내역 테이블 생성
CREATE TABLE IF NOT EXISTS public.point_recharge_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    depositor_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING(대기), APPROVED(승인), REJECTED(반려)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 설정 (필요 시)
ALTER TABLE public.point_recharge_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 신청 내역만 볼 수 있음"
    ON public.point_recharge_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 신청 내역을 생성할 수 있음"
    ON public.point_recharge_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "관리자는 모든 내역을 보고 수정할 수 있음"
    ON public.point_recharge_requests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'SUPER_ADMIN')
        )
    );
