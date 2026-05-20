-- 이력서 다중 SNS (JSONB). 1회 실행 후 OA_UPSERT_RESUME payload에 sns_links 포함 가능.
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS sns_links JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.resumes.sns_links IS 'SNS 목록 예: [{"type":"카카오톡","value":"id"}] — 레거시 sns_type/sns_id는 첫 항목과 동기화 권장';
