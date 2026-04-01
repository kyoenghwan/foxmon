-- 여우토크 (FoxTalk) 실시간 채팅방 시스템 구축 SQL 스크립트
-- Supabase SQL Editor 에서 그대로 복사해서 실행하시면 됩니다.

-- 1. foxtalk_rooms 테이블 생성 (채팅방 메타데이터 저장)
CREATE TABLE foxtalk_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('OPEN', 'SECRET')),
  title TEXT NOT NULL,
  room_code TEXT UNIQUE,
  password_hash TEXT,
  max_participants INTEGER NOT NULL DEFAULT 100,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 2. foxtalk_participants 테이블 생성 (참여자 세션 및 아바타 상태)
CREATE TABLE foxtalk_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES foxtalk_rooms(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar_type TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(room_id, session_id)
);

-- 3. foxtalk_messages 테이블 생성 (실제 채팅 메시지 저장)
CREATE TABLE foxtalk_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES foxtalk_rooms(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES foxtalk_participants(id) ON DELETE CASCADE, -- NULL이면 시스템 메시지
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'SYSTEM_JOIN', 'SYSTEM_LEAVE', 'SYSTEM_ALERT')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLS (Row Level Security) 설정 (간소화를 위해 모두 허용, 필요시 추가 설정)
ALTER TABLE foxtalk_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE foxtalk_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE foxtalk_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous select rooms" ON foxtalk_rooms FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert rooms" ON foxtalk_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update rooms" ON foxtalk_rooms FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous select participants" ON foxtalk_participants FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert participants" ON foxtalk_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update participants" ON foxtalk_participants FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous select messages" ON foxtalk_messages FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert messages" ON foxtalk_messages FOR INSERT WITH CHECK (true);

-- realtime 엔진에 foxtalk_messages 레플리케이션 활성화 (핵심: 이거 안하면 실시간 채팅 안됨)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE foxtalk_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE foxtalk_participants;
