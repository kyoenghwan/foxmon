const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

async function inspectTables() {
  console.log("=== Inspecting tables ===");
  
  // 1. point_recharge_requests
  const { data: reqs, error: reqErr } = await supabaseAdmin
    .from('point_recharge_requests')
    .select('*')
    .limit(5);
  console.log("point_recharge_requests sample:", reqs, "error:", reqErr);

  // 2. users for test1
  const { data: user, error: uErr } = await supabaseAdmin
    .from('users')
    .select('id, login_id, nickname, role, paid_points, bonus_points, has_first_charged, merchant_tier')
    .ilike('login_id', 'test1')
    .single();
  console.log("User test1:", user, "error:", uErr);

  // 3. point_policies
  const { data: pols, error: polErr } = await supabaseAdmin
    .from('point_policies')
    .select('*');
  console.log("point_policies:", pols, "error:", polErr);

  // 4. tier_configs
  const { data: tiers, error: tierErr } = await supabaseAdmin
    .from('tier_configs')
    .select('*');
  console.log("tier_configs:", tiers, "error:", tierErr);
}

inspectTables();
