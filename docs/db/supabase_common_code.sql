-- ==============================================================================
-- Foxmon Master Data Management (Common Codes) Schema
-- 목적: 시스템 전반에서 쓰이는 리스트 마스터 데이터들의 중앙 통합 관리 테이블
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.common_codes (
    list_type VARCHAR NOT NULL,               -- e.g., 'NOTICE_TYPE', 'JOB_REGION', 'JOB_INDUSTRY'
    code_value VARCHAR NOT NULL,              -- e.g., 'SEOUL', 'IT', 'NOTICE', 'EVENT'
    parent_code_value VARCHAR,                -- 2-Depth 계층 구조를 위한 부모 코드 
    code_name VARCHAR NOT NULL,               -- e.g., '서울', 'IT/스타트업', '공지사항', '이벤트'
    sort_order INT NOT NULL DEFAULT 0,        -- 정렬 우선순위
    is_active BOOLEAN NOT NULL DEFAULT true,  -- 활성/비활성 처리
    description TEXT,                         -- 관리자용 비고
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (list_type, code_value)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_common_codes_list_type ON public.common_codes (list_type);

-- Row Level Security 설정 (필요시 활성화)
-- ALTER TABLE public.common_codes ENABLE ROW LEVEL SECURITY;
-- 관리자만 삽입/수정 삭제 허용, 조회는 누구나 정책 예시:
-- CREATE POLICY "allow_read_all" ON public.common_codes FOR SELECT USING (true);

-- ==============================================================================
-- 초기 데모 데이터 (Migration용)
-- ==============================================================================
INSERT INTO public.common_codes (list_type, code_value, code_name, sort_order) VALUES
-- 시스템 자체 메타 리스트 (단일 테이블 관리를 위한 메타 분류)
('SYSTEM_LIST_TYPES', 'NOTICE_TYPE', '공지사항 분류', 1),
('SYSTEM_LIST_TYPES', 'JOB_REGION', '지역 (근무지)', 2),
('SYSTEM_LIST_TYPES', 'JOB_INDUSTRY', '직종/업종', 3),
('SYSTEM_LIST_TYPES', 'WORK_TYPE', '고용 형태', 4),
('SYSTEM_LIST_TYPES', 'SALARY_TYPE', '급여 종류', 5),
('SYSTEM_LIST_TYPES', 'BENEFITS', '복리후생 및 혜택', 6),

-- 공지사항 구분
('NOTICE_TYPE', 'NOTICE', '공지', 1),
('NOTICE_TYPE', 'ETC', '기타', 2),
('NOTICE_TYPE', 'EVENT', '이벤트', 3),

-- 지역 데이터는 하단 별도 INSERT 구문(5개 컬럼 스키마)에서 일괄 처리합니다.

-- 직종 / 업종
('JOB_INDUSTRY', 'IT', 'IT/인터넷', 1),
('JOB_INDUSTRY', 'DESIGN', '디자인', 2),
('JOB_INDUSTRY', 'MARKETING', '마케팅/광고/홍보', 3),
('JOB_INDUSTRY', 'SALES', '영업/고객상담', 4),
('JOB_INDUSTRY', 'SERVICE', '서비스/리테일', 5),
('JOB_INDUSTRY', 'MANAGEMENT', '경영/사무', 6),
('JOB_INDUSTRY', 'PRODUCTION', '생산/제조', 7),
('JOB_INDUSTRY', 'EDUCATION', '교육/강사', 8),
('JOB_INDUSTRY', 'MEDICAL', '의료/간호', 9),
('JOB_INDUSTRY', 'MEDIA', '미디어/문화', 10),
('JOB_INDUSTRY', 'CONSTRUCTION', '건설/노무', 11),

-- 고용 형태
('WORK_TYPE', 'FULL_TIME', '정규직', 1),
('WORK_TYPE', 'CONTRACT', '계약직', 2),
('WORK_TYPE', 'PART_TIME', '아르바이트', 3),
('WORK_TYPE', 'INTERN', '인턴', 4),
('WORK_TYPE', 'FREELANCE', '프리랜서', 5),
('WORK_TYPE', 'DISPATCH', '파견직', 6),

-- 급여 종류
('SALARY_TYPE', 'HOURLY', '시급', 1),
('SALARY_TYPE', 'DAILY', '일급', 2),
('SALARY_TYPE', 'WEEKLY', '주급', 3),
('SALARY_TYPE', 'MONTHLY', '월급', 4),
('SALARY_TYPE', 'YEARLY', '연봉', 5),
('SALARY_TYPE', 'PER_CASE', '건별', 6),

-- 복리후생 및 혜택
('BENEFITS', 'INSURANCE_4', '4대보험', 1),
('BENEFITS', 'SEVERANCE_PAY', '퇴직금', 2),
('BENEFITS', 'ANNUAL_LEAVE', '연차/반차', 3),
('BENEFITS', 'BONUS', '정기보너스', 4),
('BENEFITS', 'INCENTIVE', '인센티브/성과금', 5),
('BENEFITS', 'MEALS', '식사(식대)지원', 6),
('BENEFITS', 'TRANSPORTATION', '교통비지원', 7),
('BENEFITS', 'DORMITORY', '기숙사운영', 8),
('BENEFITS', 'FLEXIBLE_HOURS', '자율출퇴근제(탄력근무제)', 9),
('BENEFITS', 'FREE_DRESS', '자율복장', 10)
ON CONFLICT (list_type, code_value) DO NOTHING;

-- ==============================================================================
-- 지역 전용 2-Depth 계층 구조 데이터 (parent_code_value 사용)
-- ==============================================================================
INSERT INTO public.common_codes (list_type, code_value, parent_code_value, code_name, sort_order) VALUES
-- =================== 지역 (시/도) (Depth 1) ===================
('JOB_REGION', 'SEOUL', NULL, '서울', 1),
('JOB_REGION', 'GYEONGGI', NULL, '경기', 2),
('JOB_REGION', 'INCHEON', NULL, '인천', 3),
('JOB_REGION', 'BUSAN', NULL, '부산', 4),
('JOB_REGION', 'DAEGU', NULL, '대구', 5),
('JOB_REGION', 'GWANGJU', NULL, '광주', 6),
('JOB_REGION', 'DAEJEON', NULL, '대전', 7),
('JOB_REGION', 'ULSAN', NULL, '울산', 8),
('JOB_REGION', 'SEJONG', NULL, '세종', 9),
('JOB_REGION', 'GANGWON', NULL, '강원', 10),
('JOB_REGION', 'CHUNGBUK', NULL, '충북', 11),
('JOB_REGION', 'CHUNGNAM', NULL, '충남', 12),
('JOB_REGION', 'JEONBUK', NULL, '전북', 13),
('JOB_REGION', 'JEONNAM', NULL, '전남', 14),
('JOB_REGION', 'GYEONGBUK', NULL, '경북', 15),
('JOB_REGION', 'GYEONGNAM', NULL, '경남', 16),
('JOB_REGION', 'JEJU', NULL, '제주', 17),
('JOB_REGION', 'ALL', NULL, '전국', 99),

-- =================== 지역 (시/군/구) (Depth 2) ===================
-- [서울]
('JOB_REGION', 'SEOUL_GANGNAM', 'SEOUL', '강남구', 1),
('JOB_REGION', 'SEOUL_GANGDONG', 'SEOUL', '강동구', 2),
('JOB_REGION', 'SEOUL_GANGBUK', 'SEOUL', '강북구', 3),
('JOB_REGION', 'SEOUL_GANGSEO', 'SEOUL', '강서구', 4),
('JOB_REGION', 'SEOUL_GWANAK', 'SEOUL', '관악구', 5),
('JOB_REGION', 'SEOUL_GWANGJIN', 'SEOUL', '광진구', 6),
('JOB_REGION', 'SEOUL_GURO', 'SEOUL', '구로구', 7),
('JOB_REGION', 'SEOUL_GEUMCHEON', 'SEOUL', '금천구', 8),
('JOB_REGION', 'SEOUL_NOWON', 'SEOUL', '노원구', 9),
('JOB_REGION', 'SEOUL_DOBONG', 'SEOUL', '도봉구', 10),
('JOB_REGION', 'SEOUL_DONGDAEMUN', 'SEOUL', '동대문구', 11),
('JOB_REGION', 'SEOUL_DONGJAK', 'SEOUL', '동작구', 12),
('JOB_REGION', 'SEOUL_MAPO', 'SEOUL', '마포구', 13),
('JOB_REGION', 'SEOUL_SEODAEMUN', 'SEOUL', '서대문구', 14),
('JOB_REGION', 'SEOUL_SEOCHO', 'SEOUL', '서초구', 15),
('JOB_REGION', 'SEOUL_SEONGDONG', 'SEOUL', '성동구', 16),
('JOB_REGION', 'SEOUL_SEONGBUK', 'SEOUL', '성북구', 17),
('JOB_REGION', 'SEOUL_SONGPA', 'SEOUL', '송파구', 18),
('JOB_REGION', 'SEOUL_YANGCHEON', 'SEOUL', '양천구', 19),
('JOB_REGION', 'SEOUL_YEONGDEUNGPO', 'SEOUL', '영등포구', 20),
('JOB_REGION', 'SEOUL_YONGSAN', 'SEOUL', '용산구', 21),
('JOB_REGION', 'SEOUL_EUNPYEONG', 'SEOUL', '은평구', 22),
('JOB_REGION', 'SEOUL_JONGNO', 'SEOUL', '종로구', 23),
('JOB_REGION', 'SEOUL_JUNG', 'SEOUL', '중구', 24),
('JOB_REGION', 'SEOUL_JUNGNANG', 'SEOUL', '중랑구', 25),

-- [경기] (주요 예시)
('JOB_REGION', 'GYEONGGI_SUWON', 'GYEONGGI', '수원시', 1),
('JOB_REGION', 'GYEONGGI_SEONGNAM', 'GYEONGGI', '성남시', 2),
('JOB_REGION', 'GYEONGGI_GOYANG', 'GYEONGGI', '고양시', 3),
('JOB_REGION', 'GYEONGGI_YONGIN', 'GYEONGGI', '용인시', 4),
('JOB_REGION', 'GYEONGGI_BUCHEON', 'GYEONGGI', '부천시', 5),
('JOB_REGION', 'GYEONGGI_ANSAN', 'GYEONGGI', '안산시', 6),
('JOB_REGION', 'GYEONGGI_ANYANG', 'GYEONGGI', '안양시', 7),
('JOB_REGION', 'GYEONGGI_NAMYANGJU', 'GYEONGGI', '남양주시', 8),
('JOB_REGION', 'GYEONGGI_HWASEONG', 'GYEONGGI', '화성시', 9),
('JOB_REGION', 'GYEONGGI_PYEONGTAEK', 'GYEONGGI', '평택시', 10),
('JOB_REGION', 'GYEONGGI_UIJEONGBU', 'GYEONGGI', '의정부시', 11),
('JOB_REGION', 'GYEONGGI_SIHEUNG', 'GYEONGGI', '시흥시', 12),
('JOB_REGION', 'GYEONGGI_PAJU', 'GYEONGGI', '파주시', 13),
('JOB_REGION', 'GYEONGGI_GIMPO', 'GYEONGGI', '김포시', 14),
('JOB_REGION', 'GYEONGGI_GWANGMYEONG', 'GYEONGGI', '광명시', 15),

-- [부산]
('JOB_REGION', 'BUSAN_GANGSEO', 'BUSAN', '강서구', 1),
('JOB_REGION', 'BUSAN_GEUMJEONG', 'BUSAN', '금정구', 2),
('JOB_REGION', 'BUSAN_GIJANG', 'BUSAN', '기장군', 3),
('JOB_REGION', 'BUSAN_NAM', 'BUSAN', '남구', 4),
('JOB_REGION', 'BUSAN_DONG', 'BUSAN', '동구', 5),
('JOB_REGION', 'BUSAN_DONGNAE', 'BUSAN', '동래구', 6),
('JOB_REGION', 'BUSAN_BUSANJIN', 'BUSAN', '부산진구', 7),
('JOB_REGION', 'BUSAN_BUK', 'BUSAN', '북구', 8),
('JOB_REGION', 'BUSAN_SASANG', 'BUSAN', '사상구', 9),
('JOB_REGION', 'BUSAN_SAHA', 'BUSAN', '사하구', 10),
('JOB_REGION', 'BUSAN_SEO', 'BUSAN', '서구', 11),
('JOB_REGION', 'BUSAN_SUYEONG', 'BUSAN', '수영구', 12),
('JOB_REGION', 'BUSAN_YEONJE', 'BUSAN', '연제구', 13),
('JOB_REGION', 'BUSAN_YEONGDO', 'BUSAN', '영도구', 14),
('JOB_REGION', 'BUSAN_JUNG', 'BUSAN', '중구', 15),
('JOB_REGION', 'BUSAN_HAEUNDAE', 'BUSAN', '해운대구', 16),

-- [인천]
('JOB_REGION', 'INCHEON_GANGHWA', 'INCHEON', '강화군', 1),
('JOB_REGION', 'INCHEON_GYEYANG', 'INCHEON', '계양구', 2),
('JOB_REGION', 'INCHEON_MICHUHOL', 'INCHEON', '미추홀구', 3),
('JOB_REGION', 'INCHEON_NAMDONG', 'INCHEON', '남동구', 4),
('JOB_REGION', 'INCHEON_DONG', 'INCHEON', '동구', 5),
('JOB_REGION', 'INCHEON_BUPYEONG', 'INCHEON', '부평구', 6),
('JOB_REGION', 'INCHEON_SEO', 'INCHEON', '서구', 7),
('JOB_REGION', 'INCHEON_YEONSU', 'INCHEON', '연수구', 8),
('JOB_REGION', 'INCHEON_ONGJIN', 'INCHEON', '옹진군', 9),
('JOB_REGION', 'INCHEON_JUNG', 'INCHEON', '중구', 10)
ON CONFLICT (list_type, code_value) DO UPDATE SET parent_code_value = EXCLUDED.parent_code_value;
