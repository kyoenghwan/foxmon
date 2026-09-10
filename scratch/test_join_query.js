const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('users')
    .select(`
        id, login_id, nickname, email, role, business_registration_number, 
        is_business_verified, is_cert_verified, verified_ceo_name, 
        verified_business_name, business_cert_image_url, business_type, 
        verification_doc_url, created_at, paid_points, bonus_points, admin_memo,
        merchant_tier,
        jobs(id, status, expires_at, auto_renew, tier),
        biz_ads(id, status, expires_at, auto_renew, tier)
    `)
    .eq('role', 'EMPLOYER');
    
  if (error) {
    console.error("❌ 조인 쿼리 에러:", error);
  } else {
    console.log("🟢 조인 쿼리 결과:", data);
  }
}

check();
