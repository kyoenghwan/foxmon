-- Create search_keywords table
CREATE TABLE IF NOT EXISTS public.search_keywords (
    keyword TEXT PRIMARY KEY,
    clicks_count BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (Row Level Security) on the table
ALTER TABLE public.search_keywords ENABLE ROW LEVEL SECURITY;

-- Allow anyone to select keywords (public read access)
CREATE POLICY "Allow public read access on search_keywords" 
ON public.search_keywords 
FOR SELECT 
USING (true);

-- Allow anyone to insert/update keywords (public write access)
-- Note: Since clicks can be triggered by any searching user (anon or authenticated), we allow insert and update.
CREATE POLICY "Allow public insert access on search_keywords"
ON public.search_keywords
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update access on search_keywords"
ON public.search_keywords
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create index for sorting by clicks_count descending
CREATE INDEX IF NOT EXISTS idx_search_keywords_clicks ON public.search_keywords (clicks_count DESC);

-- Seed initial recommended keywords
INSERT INTO public.search_keywords (keyword, clicks_count) VALUES
('스웨디시', 1250),
('마사지', 1120),
('서울구인', 980),
('경기구인', 950),
('왁싱', 840),
('테라피', 730),
('피부관리', 620),
('카운터', 510),
('1인샵', 480),
('주말알바', 350)
ON CONFLICT (keyword) DO NOTHING;
