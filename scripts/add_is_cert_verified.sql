-- 2차 인증(사업자등록증 수동 검수) 완료 여부 컬럼 추가
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_cert_verified BOOLEAN NOT NULL DEFAULT false;
