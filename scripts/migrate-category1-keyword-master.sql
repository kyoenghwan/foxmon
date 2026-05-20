-- ==============================================================================
-- Foxmon: 희망 업종(CATEGORY_1/2) · 키워드(KEYWORD) 마스터 관리 전환
-- 목적: 사용하지 않는 JOB_INDUSTRY(직종/업종) 대신 실제 화면에서 쓰는 코드로 관리
-- 실행: Supabase SQL Editor 또는 psql에서 1회 실행
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1) 마스터 관리 사이드바 (SYSTEM_LIST_TYPES) 등록/정리
-- ------------------------------------------------------------------------------

-- 기존 JOB_INDUSTRY(일반 직종 IT/디자인 등) — 마스터 목록에서 숨김
UPDATE public.common_codes
SET is_active = false,
    description = COALESCE(description, '') || ' [deprecated: CATEGORY_1 사용]',
    updated_at = NOW()
WHERE list_type = 'SYSTEM_LIST_TYPES'
  AND code_value = 'JOB_INDUSTRY';

-- 실제 서비스에서 사용하는 분류를 마스터에 등록
INSERT INTO public.common_codes (list_type, code_value, code_name, sort_order, is_active, description)
VALUES
  ('SYSTEM_LIST_TYPES', 'CATEGORY_1', '희망 업종 (1차)', 3, true, '이력서 희망 업종, 구인 1차 업종'),
  ('SYSTEM_LIST_TYPES', 'CATEGORY_2', '희망 업종 (2차)', 4, true, '구인 2차 업종 (1차 업종 하위)'),
  ('SYSTEM_LIST_TYPES', 'KEYWORD', '키워드', 5, true, '이력서·구인 키워드'),
  ('SYSTEM_LIST_TYPES', 'AMENITY', '구인 혜택/조건', 6, true, '구인공고 혜택 체크 항목'),
  ('SYSTEM_LIST_TYPES', 'EMPLOYMENT_TYPE', '고용 형태(상세)', 7, true, '구인 고용 형태')
ON CONFLICT (list_type, code_value) DO UPDATE SET
  code_name = EXCLUDED.code_name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  description = EXCLUDED.description,
  updated_at = NOW();

-- WORK_TYPE / SALARY_TYPE / BENEFITS 등 기존 항목 sort_order만 정리 (선택)
UPDATE public.common_codes SET sort_order = 8, updated_at = NOW()
WHERE list_type = 'SYSTEM_LIST_TYPES' AND code_value = 'WORK_TYPE';
UPDATE public.common_codes SET sort_order = 9, updated_at = NOW()
WHERE list_type = 'SYSTEM_LIST_TYPES' AND code_value = 'SALARY_TYPE';
UPDATE public.common_codes SET sort_order = 10, updated_at = NOW()
WHERE list_type = 'SYSTEM_LIST_TYPES' AND code_value = 'BENEFITS';

-- ------------------------------------------------------------------------------
-- 2) JOB_INDUSTRY 데이터 비활성화 (삭제하지 않음 — 롤백 가능)
-- ------------------------------------------------------------------------------
UPDATE public.common_codes
SET is_active = false,
    updated_at = NOW()
WHERE list_type = 'JOB_INDUSTRY';

-- ------------------------------------------------------------------------------
-- 3) 희망 업종 1차 (CATEGORY_1) — seed-master-data.ts 와 동일
-- ------------------------------------------------------------------------------
INSERT INTO public.common_codes (list_type, code_value, parent_code_value, code_name, sort_order, is_active)
VALUES
  ('CATEGORY_1', 'CAT1_ROOM', NULL, '룸싸롱', 1, true),
  ('CATEGORY_1', 'CAT1_KARAOKE', NULL, '노래주점', 2, true),
  ('CATEGORY_1', 'CAT1_DANRAN', NULL, '단란주점', 3, true),
  ('CATEGORY_1', 'CAT1_MASSAGE', NULL, '마사지', 4, true),
  ('CATEGORY_1', 'CAT1_SWEDISH', NULL, '스웨디시', 5, true),
  ('CATEGORY_1', 'CAT1_1INSHOP', NULL, '1인샵', 6, true),
  ('CATEGORY_1', 'CAT1_WAXING', NULL, '왁싱', 7, true),
  ('CATEGORY_1', 'CAT1_BAR', NULL, 'BAR', 8, true),
  ('CATEGORY_1', 'CAT1_ROOMCAFE', NULL, '룸카페', 9, true),
  ('CATEGORY_1', 'CAT1_DABANG', NULL, '다방', 10, true),
  ('CATEGORY_1', 'CAT1_YOJUNG', NULL, '요정', 11, true),
  ('CATEGORY_1', 'CAT1_CAFE', NULL, '카페', 12, true),
  ('CATEGORY_1', 'CAT1_BJ', NULL, 'BJ', 13, true),
  ('CATEGORY_1', 'CAT1_OTHER', NULL, '기타', 14, true)
ON CONFLICT (list_type, code_value) DO UPDATE SET
  code_name = EXCLUDED.code_name,
  parent_code_value = EXCLUDED.parent_code_value,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ------------------------------------------------------------------------------
-- 4) 희망 업종 2차 (CATEGORY_2) — 구인공고 하위 업종
-- ------------------------------------------------------------------------------
INSERT INTO public.common_codes (list_type, code_value, parent_code_value, code_name, sort_order, is_active)
VALUES
  ('CATEGORY_2', 'CAT2_R_01', 'CAT1_ROOM', '텐프로', 1, true),
  ('CATEGORY_2', 'CAT2_R_02', 'CAT1_ROOM', '쩜오', 2, true),
  ('CATEGORY_2', 'CAT2_R_03', 'CAT1_ROOM', '퍼블릭', 3, true),
  ('CATEGORY_2', 'CAT2_R_04', 'CAT1_ROOM', '클럽', 4, true),
  ('CATEGORY_2', 'CAT2_R_05', 'CAT1_ROOM', '정통룸', 5, true),
  ('CATEGORY_2', 'CAT2_R_06', 'CAT1_ROOM', '풀싸롱', 6, true),
  ('CATEGORY_2', 'CAT2_K_01', 'CAT1_KARAOKE', '아가씨', 1, true),
  ('CATEGORY_2', 'CAT2_K_02', 'CAT1_KARAOKE', '초미씨A', 2, true),
  ('CATEGORY_2', 'CAT2_K_03', 'CAT1_KARAOKE', '초미씨B', 3, true),
  ('CATEGORY_2', 'CAT2_K_04', 'CAT1_KARAOKE', '미씨', 4, true),
  ('CATEGORY_2', 'CAT2_K_05', 'CAT1_KARAOKE', 'TC', 5, true),
  ('CATEGORY_2', 'CAT2_M_01', 'CAT1_MASSAGE', '휴게 마사지', 1, true),
  ('CATEGORY_2', 'CAT2_M_02', 'CAT1_MASSAGE', '아로마 마사지', 2, true),
  ('CATEGORY_2', 'CAT2_M_03', 'CAT1_MASSAGE', '피부 마사지', 3, true),
  ('CATEGORY_2', 'CAT2_M_04', 'CAT1_MASSAGE', '에스테틱', 4, true),
  ('CATEGORY_2', 'CAT2_M_05', 'CAT1_MASSAGE', '스포츠마사지', 5, true),
  ('CATEGORY_2', 'CAT2_M_06', 'CAT1_MASSAGE', '기타마사지', 6, true),
  ('CATEGORY_2', 'CAT2_O_01', 'CAT1_OTHER', '기타업종', 1, true),
  ('CATEGORY_2', 'CAT2_O_02', 'CAT1_OTHER', '직업소개소', 2, true)
ON CONFLICT (list_type, code_value) DO UPDATE SET
  code_name = EXCLUDED.code_name,
  parent_code_value = EXCLUDED.parent_code_value,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ------------------------------------------------------------------------------
-- 5) 키워드 (KEYWORD)
-- ------------------------------------------------------------------------------
INSERT INTO public.common_codes (list_type, code_value, parent_code_value, code_name, sort_order, is_active)
VALUES
  ('KEYWORD', 'KW_01', NULL, '신규업소', 1, true),
  ('KEYWORD', 'KW_02', NULL, '투잡알바', 2, true),
  ('KEYWORD', 'KW_03', NULL, '주점', 3, true),
  ('KEYWORD', 'KW_04', NULL, '마사지', 4, true),
  ('KEYWORD', 'KW_05', NULL, 'TC', 5, true),
  ('KEYWORD', 'KW_06', NULL, '타지역우대', 6, true),
  ('KEYWORD', 'KW_07', NULL, '초보가능', 7, true),
  ('KEYWORD', 'KW_08', NULL, '당일지급', 8, true),
  ('KEYWORD', 'KW_09', NULL, '비', 9, true),
  ('KEYWORD', 'KW_10', NULL, '아가씨', 10, true),
  ('KEYWORD', 'KW_11', NULL, '44사이즈우대', 11, true),
  ('KEYWORD', 'KW_12', NULL, '에이스우대', 12, true),
  ('KEYWORD', 'KW_13', NULL, '경력우대', 13, true),
  ('KEYWORD', 'KW_14', NULL, '생리휴무', 14, true),
  ('KEYWORD', 'KW_15', NULL, '요정', 15, true),
  ('KEYWORD', 'KW_16', NULL, '초미녀', 16, true),
  ('KEYWORD', 'KW_17', NULL, '박스환영', 17, true),
  ('KEYWORD', 'KW_18', NULL, '업소', 18, true),
  ('KEYWORD', 'KW_19', NULL, '주말알바', 19, true),
  ('KEYWORD', 'KW_20', NULL, '룸싸롱', 20, true),
  ('KEYWORD', 'KW_21', NULL, '다방', 21, true),
  ('KEYWORD', 'KW_22', NULL, '미씨', 22, true),
  ('KEYWORD', 'KW_23', NULL, '장기근무', 23, true),
  ('KEYWORD', 'KW_24', NULL, '기타 등등', 24, true)
ON CONFLICT (list_type, code_value) DO UPDATE SET
  code_name = EXCLUDED.code_name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

COMMIT;

-- ==============================================================================
-- 실행 후 확인용 (선택)
-- ==============================================================================
-- SELECT code_value, code_name, sort_order, is_active
-- FROM public.common_codes
-- WHERE list_type = 'SYSTEM_LIST_TYPES'
-- ORDER BY sort_order;

-- SELECT code_name, sort_order, is_active
-- FROM public.common_codes
-- WHERE list_type = 'CATEGORY_1'
-- ORDER BY sort_order;

-- SELECT code_name, sort_order, is_active
-- FROM public.common_codes
-- WHERE list_type = 'KEYWORD'
-- ORDER BY sort_order;
