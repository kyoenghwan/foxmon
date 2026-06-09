-- community_posts 테이블에 다중 상세 이미지 컬럼 추가
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS detail_images text[] NULL;
