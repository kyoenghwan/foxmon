-- 시스템 마스터 리스트 그룹에 'AD_GENERAL_ICONS' 추가
INSERT INTO common_codes (list_type, code_value, code_name, sort_order, is_active, description)
VALUES ('SYSTEM_LIST_TYPES', 'AD_GENERAL_ICONS', '구인광고 일반 아이콘', 99, true, '구인광고 결제 시 선택할 수 있는 일반 아이콘 목록입니다.')
ON CONFLICT (list_type, code_value) DO NOTHING;

-- 기본 일반 아이콘들 추가
INSERT INTO common_codes (list_type, code_value, code_name, sort_order, is_active)
VALUES
  ('AD_GENERAL_ICONS', 'ICON_1', '💖초보환영', 1, true),
  ('AD_GENERAL_ICONS', 'ICON_2', '🏠원룸제공', 2, true),
  ('AD_GENERAL_ICONS', 'ICON_3', '✨최고급시설', 3, true),
  ('AD_GENERAL_ICONS', 'ICON_4', '🚫블랙관리', 4, true),
  ('AD_GENERAL_ICONS', 'ICON_5', '💰당일지급', 5, true),
  ('AD_GENERAL_ICONS', 'ICON_6', '👍숙식제공', 6, true),
  ('AD_GENERAL_ICONS', 'ICON_7', '💪열정페이', 7, true),
  ('AD_GENERAL_ICONS', 'ICON_8', '🤝가족같은', 8, true)
ON CONFLICT (list_type, code_value) DO NOTHING;

