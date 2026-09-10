const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: refund } = await supabase.from('point_policies').select('config_key, config_value').eq('config_key', 'REFUND_FEE_RATIO').maybeSingle();
  console.log("🟢 REFUND_FEE_RATIO:", refund);

  const { data: tiers } = await supabase.from('tier_configs').select('tier_name, bonus_ratio');
  console.log("🟢 TIER_CONFIGS:", tiers);
}

check();
