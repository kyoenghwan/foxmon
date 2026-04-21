-- ==============================================================================
-- Foxmon Master Data Management (Common Codes) Schema
-- 목적: 시스템 전반에서 쓰이는 리스트 마스터 데이터들의 중앙 통합 관리 테이블
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.common_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_type VARCHAR NOT NULL,               -- e.g., 'NOTICE_TYPE', 'JOB_REGION', 'JOB_INDUSTRY'
    code_value VARCHAR NOT NULL,              -- e.g., 'SEOUL', 'IT', 'NOTICE', 'EVENT'
    code_name VARCHAR NOT NULL,               -- e.g., '서울', 'IT/스타트업', '공지사항', '이벤트'
    sort_order INT NOT NULL DEFAULT 0,        -- 정렬 우선순위
    is_active BOOLEAN NOT NULL DEFAULT true,  -- 활성/비활성 처리
    description TEXT,                         -- 관리자용 비고
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_common_codes_list_type ON public.common_codes (list_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_common_codes_unique_val ON public.common_codes (list_type, code_value);

-- Row Level Security 설정 (필요시 활성화)
-- ALTER TABLE public.common_codes ENABLE ROW LEVEL SECURITY;
-- 관리자만 삽입/수정 삭제 허용, 조회는 누구나 정책 예시:
-- CREATE POLICY "allow_read_all" ON public.common_codes FOR SELECT USING (true);

-- ==============================================================================
-- 초기 데모 데이터 (Migration용)
-- ==============================================================================
INSERT INTO public.common_codes (list_type, code_value, code_name, sort_order) VALUES
('NOTICE_TYPE', 'NOTICE', '공지', 1),
('NOTICE_TYPE', 'ETC', '기타', 2),
('NOTICE_TYPE', 'EVENT', '이벤트', 3)
ON CONFLICT (list_type, code_value) DO NOTHING;
