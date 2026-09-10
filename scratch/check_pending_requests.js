const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

async function checkPendingRequests() {
  console.log("Checking pending point_recharge_requests...");
  const { data: requests, error } = await supabaseAdmin
    .from('point_recharge_requests')
    .select('*')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching requests:", error);
    return;
  }

  console.log("Pending requests count:", requests?.length);
  console.log("Pending requests:", JSON.stringify(requests, null, 2));

  // Also check point_policies
  console.log("\nChecking point_policies...");
  const { data: policies, error: polErr } = await supabaseAdmin
    .from('point_policies')
    .select('*');
  console.log("point_policies:", policies, "error:", polErr);

  // Check tier_configs
  console.log("\nChecking tier_configs...");
  const { data: tiers, error: tierErr } = await supabaseAdmin
    .from('tier_configs')
    .select('*');
  console.log("tier_configs:", tiers, "error:", tierErr);
}

checkPendingRequests();
