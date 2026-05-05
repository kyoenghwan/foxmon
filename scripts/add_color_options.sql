-- fa_jobs 테이블에 색상 저장을 위한 컬럼 추가
-- option_color_value: 제목 색상 값 (HEX 등)
-- option_bg_value: 배경색 값 (HEX 등)

ALTER TABLE fa_jobs 
ADD COLUMN IF NOT EXISTS option_color_value TEXT,
ADD COLUMN IF NOT EXISTS option_bg_value TEXT;
