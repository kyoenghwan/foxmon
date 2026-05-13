-- FoxTalk 1:1 다이렉트 채팅 및 오픈채팅 하이브리드 지원을 위한 스키마 확장
-- foxtalk_rooms 변경
ALTER TABLE public.foxtalk_rooms ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE;
ALTER TABLE public.foxtalk_rooms ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.foxtalk_rooms ADD COLUMN IF NOT EXISTS seeker_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- 기존 type 컬럼의 값이 OPEN, SECRET 외에 1ON1도 가능해야 하므로 제약조건이 있다면 수정
-- (이전에 VARCHAR 제약조건만 있었다면 생략 가능하지만, Enum이나 Check가 있었다면 변경 필요)
-- foxtalk_rooms 테이블에 check 제약조건이 있는지 확인은 어렵지만, 보통 type은 VARCHAR(50)입니다.

-- foxtalk_participants 변경
ALTER TABLE public.foxtalk_participants ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- 알림 기능을 위한 마지막 읽은 메시지 ID 추적 (선택 사항)
ALTER TABLE public.foxtalk_participants ADD COLUMN IF NOT EXISTS last_read_message_id UUID REFERENCES public.foxtalk_messages(id) ON DELETE SET NULL;

-- 인덱스 추가 (빠른 조회를 위함)
CREATE INDEX IF NOT EXISTS idx_foxtalk_rooms_employer_id ON public.foxtalk_rooms(employer_id);
CREATE INDEX IF NOT EXISTS idx_foxtalk_rooms_seeker_id ON public.foxtalk_rooms(seeker_id);
CREATE INDEX IF NOT EXISTS idx_foxtalk_participants_user_id ON public.foxtalk_participants(user_id);
