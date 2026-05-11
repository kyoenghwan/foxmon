-- ==========================================
-- Add birth_year to resumes table
-- ==========================================
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS birth_year INTEGER;
