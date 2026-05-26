const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://kgwvftaebjkjwwpsftqv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM');

// supabase-js v2 rpc or direct query is not possible unless we have postgres connection string or an rpc function.
// But we can check if there's an RPC.
async function alter() {
    const sql = `
        ALTER TABLE public.biz_ads ADD COLUMN IF NOT EXISTS claim_code VARCHAR(10) NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_biz_ads_claim_code ON public.biz_ads (claim_code) WHERE claim_code IS NOT NULL;
    `;
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    console.log(error || data || "성공적으로 적용되었습니다.");
}
alter();
