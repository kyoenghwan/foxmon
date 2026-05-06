-- ==============================================================================
-- [ 폭스몬 구인 지역 2차(JOB_REGION_2) '전체' 옵션 추가 스크립트 ]
-- 각 1차 지역(시/도)에 해당하는 2차 지역(시/군/구) 목록의 최상단에 
-- '전체'라는 공통 옵션을 일괄 삽입합니다.
-- ==============================================================================

BEGIN;

INSERT INTO common_codes (list_type, code_value, code_name, parent_code_value, sort_order, is_active)
SELECT 
    'JOB_REGION_2', 
    code_value || '_ALL', -- 예: SEOUL_ALL
    '전체', 
    code_value, 
    0, -- 가장 최상단에 정렬되도록 0으로 설정
    true
FROM common_codes 
WHERE list_type = 'JOB_REGION_1'
AND NOT EXISTS (
    SELECT 1 FROM common_codes c2 
    WHERE c2.list_type = 'JOB_REGION_2' 
      AND c2.parent_code_value = common_codes.code_value 
      AND c2.code_name = '전체'
);

COMMIT;
