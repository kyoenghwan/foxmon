const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kgwvftaebjkjwwpsftqv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const sql = `
CREATE TABLE IF NOT EXISTS public.search_keywords (
    keyword TEXT PRIMARY KEY,
    clicks_count BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_keywords_clicks ON public.search_keywords (clicks_count DESC);

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
`;

async function main() {
    console.log("Starting DB migration for search_keywords...");
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    if (error) {
        console.error("Migration failed:", error);
    } else {
        console.log("Migration completed successfully!", data);
    }
}

main();
