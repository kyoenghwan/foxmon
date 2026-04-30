-- ==============================================================================
-- [ 폭스몬 구인 공고 (jobs) 테이블 확장 스크립트 ]
-- 기존 jobs 테이블에 폼 데이터 저장을 위한 상세 컬럼들을 일괄 추가합니다.
-- Supabase의 SQL Editor 에 복사하여 RUN 하시면 됩니다.
-- ==============================================================================

BEGIN;

-- 1. 작성자 ID (User 연동용, 혹시 없을 경우를 대비해 추가)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. 회사 및 기본 정보
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_type TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_amount TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 3. 연락처 정보
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS kakao_id TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS line_id TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS telegram_id TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS wechat_id TEXT;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 4. 채용 조건 및 분류
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS employment_type TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS category1 TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS category2 TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_time TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS amenities TEXT[];
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS keywords TEXT[];

-- 5. 디자인 및 상세 요강
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS design_mode TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS detail_content TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS detail_bg_color TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS detail_bg_image TEXT;

COMMIT;

-- 완료 후 SELECT * FROM jobs LIMIT 1; 로 컬럼들이 잘 추가되었는지 확인해 보세요!
