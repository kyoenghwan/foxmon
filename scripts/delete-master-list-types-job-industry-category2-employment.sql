-- ==============================================================================
-- Foxmon: 마스터 관리 제거 대상 common_codes 삭제
--
-- 삭제 대상 (마스터 사이드바 + 해당 list_type 전체 데이터):
--   1. JOB_INDUSTRY      — 직종/업종 (IT/디자인 등, 미사용)
--   2. CATEGORY_2        — 희망 업종 (2차) ※ 구인공고 2차 업종 UI 영향
--   3. EMPLOYMENT_TYPE   — 고용 형태(상세) ※ 구인공고 고용형태 UI 영향
--   4. WORK_TYPE         — 고용 형태 (정규직/아르바이트 등, 앱 미연동)
--
-- 유지: CATEGORY_1(희망 업종 1차), KEYWORD, AMENITY, SALARY_TYPE, BENEFITS …
--
-- ⚠️ 실행 전 Supabase에서 백업 권장 (Table Editor → common_codes export)
-- ⚠️ CATEGORY_2 항목(텐프로, 쩜오 등)을 이력서에서 계속 쓰려면
--    아래 [선택] 블록으로 CATEGORY_1에 옮긴 뒤 삭제하세요.
--
-- 실행: Supabase SQL Editor에서 1회 실행
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- [선택] CATEGORY_2 → CATEGORY_1 로 이전 후 2차 삭제 (필요 시 주석 해제)
-- 이미 CATEGORY_1에 같은 code_name이 있으면 건너뜀
-- ------------------------------------------------------------------------------
/*
INSERT INTO public.common_codes (list_type, code_value, parent_code_value, code_name, sort_order, is_active)
SELECT
  'CATEGORY_1',
  c2.code_value,
  NULL,
  c2.code_name,
  100 + c2.sort_order,
  c2.is_active
FROM public.common_codes c2
WHERE c2.list_type = 'CATEGORY_2'
  AND c2.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.common_codes c1
    WHERE c1.list_type = 'CATEGORY_1'
      AND (c1.code_name = c2.code_name OR c1.code_value = c2.code_value)
  )
ON CONFLICT (list_type, code_value) DO NOTHING;
*/

-- ------------------------------------------------------------------------------
-- 1) 마스터 관리 사이드바 메타(SYSTEM_LIST_TYPES) 제거
-- ------------------------------------------------------------------------------
DELETE FROM public.common_codes
WHERE list_type = 'SYSTEM_LIST_TYPES'
  AND code_value IN (
    'JOB_INDUSTRY',
    'CATEGORY_2',
    'EMPLOYMENT_TYPE',
    'WORK_TYPE'
  );

-- ------------------------------------------------------------------------------
-- 2) list_type 별 실제 코드 데이터 삭제
-- ------------------------------------------------------------------------------
DELETE FROM public.common_codes
WHERE list_type IN (
  'JOB_INDUSTRY',
  'CATEGORY_2',
  'EMPLOYMENT_TYPE',
  'WORK_TYPE'
);

COMMIT;

-- ==============================================================================
-- 실행 후 확인 (선택)
-- ==============================================================================
-- 남은 마스터 분류
-- SELECT code_value, code_name, sort_order
-- FROM public.common_codes
-- WHERE list_type = 'SYSTEM_LIST_TYPES'
-- ORDER BY sort_order;

-- 삭제 대상 잔여 여부 (0건이어야 함)
-- SELECT list_type, COUNT(*) AS cnt
-- FROM public.common_codes
-- WHERE list_type IN ('JOB_INDUSTRY', 'CATEGORY_2', 'EMPLOYMENT_TYPE', 'WORK_TYPE')
-- GROUP BY list_type;
