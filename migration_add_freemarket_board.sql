-- 기존 제약조건 삭제
ALTER TABLE public.community_posts DROP CONSTRAINT IF EXISTS community_posts_board_check;

-- 'freemarket'을 포함한 새로운 제약조건 추가
ALTER TABLE public.community_posts ADD CONSTRAINT community_posts_board_check 
CHECK (board_id IN ('free', 'freemarket', 'foxtalk', 'foxmarket', 'reviews', 'tips', 'report', 'business', 'notice', 'event'));
