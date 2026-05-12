-- jobs 테이블에 구독 여부 컬럼 추가
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN DEFAULT false;

-- biz_ads 테이블에 구독 여부 및 더블 슬롯(연속 노출) 컬럼 추가
ALTER TABLE public.biz_ads ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN DEFAULT false;
ALTER TABLE public.biz_ads ADD COLUMN IF NOT EXISTS option_double_slot BOOLEAN DEFAULT false;
ALTER TABLE public.biz_ads ADD COLUMN IF NOT EXISTS option_double_slot_expires_at TIMESTAMPTZ;
