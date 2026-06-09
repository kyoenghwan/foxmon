const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Env 로딩
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobsSchema() {
    console.log("🔍 Fetching first row of jobs to inspect schema...");
    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error("❌ 에러 발생:", error.message);
        return;
    }
    
    if (data.length === 0) {
        console.log("⚠️ 데이터가 전혀 없습니다.");
        return;
    }
    
    const keys = Object.keys(data[0]);
    console.log("📊 jobs Columns:");
    console.log(JSON.stringify(keys, null, 2));
}

checkJobsSchema();
