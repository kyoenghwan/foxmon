-- ==============================================================================
-- [ 폭스몬 구인 지역(JOB_REGION) 2-Depth 계층화 마이그레이션 스크립트 ]
-- 기존 'JOB_REGION' 데이터를 'JOB_REGION_1'(시/도)과 'JOB_REGION_2'(시/군/구)로 
-- 분리하고, parent_code_value 를 연결하는 스크립트입니다.
-- Supabase의 SQL Editor 에 복사하여 RUN 하시면 됩니다.
-- ==============================================================================

BEGIN;

-- 1. 시/군/구 (하위 지역) 업데이트
-- '_' 가 포함된 지역 코드(예: SEOUL_GANGNAM)를 JOB_REGION_2 로 변경하고,
-- '_' 앞의 문자열(SEOUL)을 parent_code_value 로 설정합니다.
UPDATE common_codes
SET 
  list_type = 'JOB_REGION_2',
  parent_code_value = split_part(code_value, '_', 1)
WHERE list_type = 'JOB_REGION' 
  AND code_value LIKE '%\_%';

-- 2. 시/도 (상위 지역) 업데이트
-- 위에서 업데이트 되지 않고 남은 JOB_REGION 항목들 (예: INCHEON, BUSAN)을
-- 최상위 계층인 JOB_REGION_1 로 변경합니다.
UPDATE common_codes
SET list_type = 'JOB_REGION_1'
WHERE list_type = 'JOB_REGION';

-- 3. (선택) 누락된 '서울(SEOUL)' 데이터가 있다면 강제 주입
-- 기존 데이터에 SEOUL 본체가 없다면 콤보박스 1차 항목에 서울이 안 뜰 수 있으므로 추가해 줍니다.
INSERT INTO common_codes (list_type, code_value, code_name, sort_order, is_active)
SELECT 'JOB_REGION_1', 'SEOUL', '서울', 1, true
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes WHERE list_type = 'JOB_REGION_1' AND code_value = 'SEOUL'
);

INSERT INTO common_codes (list_type, code_value, code_name, sort_order, is_active)
SELECT 'JOB_REGION_1', 'GYEONGGI', '경기', 2, true
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes WHERE list_type = 'JOB_REGION_1' AND code_value = 'GYEONGGI'
);

COMMIT;

-- 완료 후 SELECT * FROM common_codes WHERE list_type LIKE 'JOB_REGION%' ORDER BY list_type, code_value; 
-- 로 결과를 확인해 보세요!
