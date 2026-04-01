-- ==========================================
-- Foxmon 사업자 관리 시스템 DB 마이그레이션
-- Version: v2.0
-- Date: 2026-03-31
-- Supabase SQL Editor에서 실행하세요.
-- ==========================================

-- 1. jobs 테이블 확장 (신규 필드 추가)
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS detail_content TEXT,
  ADD COLUMN IF NOT EXISTS detail_images TEXT[],
  ADD COLUMN IF NOT EXISTS work_type TEXT,
  ADD COLUMN IF NOT EXISTS work_hours TEXT,
  ADD COLUMN IF NOT EXISTS benefits TEXT,
  ADD COLUMN IF NOT EXISTS contact_info TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- jobs 상태 컬럼 CHECK 제약추가
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_status_check CHECK (status IN ('ACTIVE', 'PAUSED', 'EXPIRED'));

-- 2. point_charge_requests 테이블 신규 생성
CREATE TABLE IF NOT EXISTS public.point_charge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_amount BIGINT NOT NULL,
  deposit_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  admin_note TEXT,
  processed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  CONSTRAINT charge_requests_status_check CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- RLS 활성화
ALTER TABLE public.point_charge_requests ENABLE ROW LEVEL SECURITY;

-- 사업자 본인 충전 내역만 조회 가능
CREATE POLICY "employer_own_charge_requests" ON public.point_charge_requests
  FOR SELECT USING (auth.uid() = user_id);

-- 사업자 충전 신청 가능
CREATE POLICY "employer_insert_charge_requests" ON public.point_charge_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_charge_requests_user_id ON public.point_charge_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_charge_requests_status ON public.point_charge_requests(status);
