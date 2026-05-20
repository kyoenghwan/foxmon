-- ==============================================================================
-- Foxmon: 구인 혜택(AMENITY) → 키워드(KEYWORD) 통합
-- 목적: 마스터·이력서·구인공고에서 태그를 KEYWORD 한 곳으로만 관리
-- 실행: Supabase SQL Editor에서 1회 실행 (운영 전 백업 권장)
-- ==============================================================================

BEGIN;

-- 1) AMENITY 항목을 KEYWORD로 복사 (동일 code_value가 없을 때만)
INSERT INTO public.common_codes (
  list_type, code_value, parent_code_value, code_name, sort_order, is_active, description
)
SELECT
  'KEYWORD',
  a.code_value,
  a.parent_code_value,
  a.code_name,
  100 + a.sort_order,
  a.is_active,
  COALESCE(a.description, '') || ' [from AMENITY]'
FROM public.common_codes a
WHERE a.list_type = 'AMENITY'
  AND a.is_active = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.common_codes k
    WHERE k.list_type = 'KEYWORD'
      AND k.code_value = a.code_value
  );

-- 이름만 같고 code_value가 다른 경우: KEYWORD에 없는 이름만 추가 (코드값은 AM_ 접두 유지)
INSERT INTO public.common_codes (
  list_type, code_value, parent_code_value, code_name, sort_order, is_active, description
)
SELECT
  'KEYWORD',
  a.code_value,
  a.parent_code_value,
  a.code_name,
  100 + a.sort_order,
  a.is_active,
  COALESCE(a.description, '') || ' [from AMENITY by name]'
FROM public.common_codes a
WHERE a.list_type = 'AMENITY'
  AND a.is_active = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.common_codes k
    WHERE k.list_type = 'KEYWORD'
      AND k.code_name = a.code_name
  );

-- 2) 구인공고: amenities → keywords 합침 (TEXT[] 컬럼)
UPDATE public.jobs j
SET keywords = (
  SELECT COALESCE(array_agg(DISTINCT t), ARRAY[]::text[])
  FROM unnest(
    COALESCE(j.keywords, ARRAY[]::text[]) || COALESCE(j.amenities, ARRAY[]::text[])
  ) AS t
),
amenities = ARRAY[]::text[]
WHERE j.amenities IS NOT NULL AND cardinality(j.amenities) > 0;

-- biz_ads / ads 테이블이 있으면 동일 패턴 적용 (없으면 주석 해제 후 실행)
-- UPDATE public.biz_ads ...

-- 3) AMENITY 마스터 비활성화
UPDATE public.common_codes
SET is_active = false,
    updated_at = NOW()
WHERE list_type = 'AMENITY';

-- 4) 마스터 관리 사이드바에서 AMENITY 숨김, KEYWORD 설명 갱신
UPDATE public.common_codes
SET is_active = false,
    description = COALESCE(description, '') || ' [deprecated: KEYWORD로 통합]',
    updated_at = NOW()
WHERE list_type = 'SYSTEM_LIST_TYPES'
  AND code_value = 'AMENITY';

UPDATE public.common_codes
SET code_name = '키워드·혜택',
    description = '이력서·구인공고 태그 (구인 혜택/조건 포함)',
    updated_at = NOW()
WHERE list_type = 'SYSTEM_LIST_TYPES'
  AND code_value = 'KEYWORD';

COMMIT;

-- 롤백 참고: AMENITY is_active 복구, jobs.keywords/amenities는 백업에서 복원
