-- biz_ads 테이블에 고정 배너 여부 컬럼 추가
ALTER TABLE biz_ads ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN DEFAULT false;
