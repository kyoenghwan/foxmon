-- 옵션별 개별 만료일 컬럼
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS option_bold_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS option_color_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS option_bg_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS option_icon_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS option_jump_expires_at TIMESTAMP WITH TIME ZONE;

-- 신규: 형광펜(Highlighter) 기능
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS option_highlight BOOLEAN,
ADD COLUMN IF NOT EXISTS option_highlight_value TEXT,
ADD COLUMN IF NOT EXISTS option_highlight_expires_at TIMESTAMP WITH TIME ZONE;

-- 신규: 일반 아이콘(General Icons) 다중 선택 기능 (JSONB로 저장)
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS option_general_icons JSONB,
ADD COLUMN IF NOT EXISTS option_general_icons_expires_at TIMESTAMP WITH TIME ZONE;
