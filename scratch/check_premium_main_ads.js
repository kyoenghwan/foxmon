const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

async function checkAdsAdmin() {
  console.log("=== Checking all jobs table ===");
  const { data: jobs, error: jobErr } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });
  
  console.log("All jobs count:", jobs?.length, "error:", jobErr);
  if (jobs && jobs.length > 0) {
    const mainJobs = jobs.filter(j => j.tier === 'PREMIUM_MAIN');
    console.log("PREMIUM_MAIN jobs count:", mainJobs.length);
    console.log("Sample PREMIUM_MAIN jobs:", JSON.stringify(mainJobs, null, 2));
  }
}

checkAdsAdmin();
