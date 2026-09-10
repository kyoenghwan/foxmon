const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    console.log("=== ad_history_logs TABLE ===");
    const { data, error } = await supabase
        .from('ad_history_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
    
    console.log("error:", JSON.stringify(error));
    console.log("count:", data?.length);
    console.log(JSON.stringify(data, null, 2));
}

check();
