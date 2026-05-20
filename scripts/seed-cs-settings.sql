-- 고객센터 업무시간·자동 응답 기본값 (site_settings)
INSERT INTO site_settings (category, key_name, key_value, updated_at)
VALUES
  ('cs', 'cs_hours_start', '09:00', NOW()),
  ('cs', 'cs_hours_end', '18:00', NOW()),
  ('cs', 'cs_hours_days', '1,2,3,4,5', NOW()),
  ('cs', 'cs_timezone', 'Asia/Seoul', NOW()),
  ('cs', 'cs_msg_in_hours', '문의해 주셔서 감사합니다. 담당자가 확인 후 순서대로 답변드리겠습니다. 잠시만 기다려 주세요.', NOW()),
  ('cs', 'cs_msg_after_hours', '지금은 업무시간이 아닙니다. 남겨주신 문의는 업무 시작 후 순서대로 답변드리겠습니다. 감사합니다.', NOW()),
  ('cs', 'cs_automation_enabled', 'false', NOW()),
  ('cs', 'cs_automation_rules', '[]', NOW())
ON CONFLICT (key_name) DO NOTHING;
