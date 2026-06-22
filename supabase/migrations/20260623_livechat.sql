-- ============================================================
-- 여우토크 실시간채팅 전환 마이그레이션
-- 1) 채팅 프로필 테이블 생성
-- 2) LIVE 타입 고정 방 1개 자동 생성
-- 3) 메시지 1,000개 제한 트리거
-- ============================================================

-- 1. 채팅 전용 프로필 테이블
CREATE TABLE IF NOT EXISTS public.foxtalk_chat_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    chat_nickname VARCHAR(20) NOT NULL,
    avatar_type VARCHAR(20) DEFAULT 'fox1',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_foxtalk_chat_profiles_user_id ON public.foxtalk_chat_profiles(user_id);

-- 2. LIVE 타입 고정 채팅방 1개 생성 (이미 있으면 무시)
INSERT INTO public.foxtalk_rooms (id, title, type, max_participants, created_by)
SELECT
    '00000000-0000-0000-0000-000000000001'::uuid,
    '여우 실시간채팅',
    'LIVE',
    9999,
    'SYSTEM'
WHERE NOT EXISTS (
    SELECT 1 FROM public.foxtalk_rooms WHERE type = 'LIVE'
);

-- 3. 메시지 1,000개 제한 함수 및 트리거
CREATE OR REPLACE FUNCTION public.fn_limit_live_chat_messages()
RETURNS TRIGGER AS $$
DECLARE
    msg_count INTEGER;
    live_room_id UUID;
BEGIN
    -- LIVE 방의 ID 조회
    SELECT id INTO live_room_id FROM public.foxtalk_rooms WHERE type = 'LIVE' LIMIT 1;
    
    -- 새 메시지가 LIVE 방에 들어온 경우에만 제한 적용
    IF NEW.room_id = live_room_id THEN
        SELECT COUNT(*) INTO msg_count
        FROM public.foxtalk_messages
        WHERE room_id = live_room_id;
        
        -- 1,000개 초과 시 가장 오래된 메시지 삭제
        IF msg_count > 1000 THEN
            DELETE FROM public.foxtalk_messages
            WHERE id IN (
                SELECT id FROM public.foxtalk_messages
                WHERE room_id = live_room_id
                ORDER BY created_at ASC
                LIMIT (msg_count - 1000)
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거가 있으면 삭제 후 재생성
DROP TRIGGER IF EXISTS trg_limit_live_chat_messages ON public.foxtalk_messages;
CREATE TRIGGER trg_limit_live_chat_messages
    AFTER INSERT ON public.foxtalk_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_limit_live_chat_messages();
