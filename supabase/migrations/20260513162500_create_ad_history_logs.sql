-- Create the ad_history_logs table
CREATE TABLE IF NOT EXISTS public.ad_history_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ad_id text NOT NULL,
    company text NOT NULL,
    title text NOT NULL,
    tier text NOT NULL,
    event_type text NOT NULL, -- 'NEW_ENTRY', 'OPTION_JUMP', 'OPTION_DOUBLE', 'EXPIRED' 등
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ad_history_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.ad_history_logs
    FOR SELECT USING (true);

-- Allow authenticated users (admin) to insert logs
CREATE POLICY "Enable insert for authenticated users only" ON public.ad_history_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS ad_history_logs_tier_idx ON public.ad_history_logs(tier);
CREATE INDEX IF NOT EXISTS ad_history_logs_created_at_idx ON public.ad_history_logs(created_at DESC);
