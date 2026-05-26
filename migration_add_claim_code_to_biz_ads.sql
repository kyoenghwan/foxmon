-- ==============================================================================
-- [Foxmon] 광고 소유권 양도용 Claim Code 필드 추가 마이그레이션
-- ==============================================================================

-- 1. biz_ads 테이블에 claim_code 컬럼 추가
ALTER TABLE public.biz_ads ADD COLUMN IF NOT EXISTS claim_code VARCHAR(10) NULL;

-- 2. 중복 수령 방지용 고유 인덱스 생성 (NULL 제외)
DROP INDEX IF EXISTS public.idx_biz_ads_claim_code;
CREATE UNIQUE INDEX idx_biz_ads_claim_code ON public.biz_ads (claim_code) WHERE claim_code IS NOT NULL;
