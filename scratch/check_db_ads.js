const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // 1. jobs 조회
  const { data: jobs } = await supabase.from('jobs').select('id, user_id, title, company_name, status, expires_at');
  console.log("🟢 [jobs 테이블]:", jobs);

  // 2. biz_ads 조회
  const { data: ads } = await supabase.from('biz_ads').select('id, user_id, title, company_name, status, expires_at');
  console.log("🟢 [biz_ads 테이블]:", ads);
}

check();
