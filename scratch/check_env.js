const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Env 로딩
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 'company', 'image' 컬럼 제외
const selectFields = 'id, user_id, company_name, title, location, address, pay, salary_type, salary_amount, logo_url, color, theme, category1, category2, keywords, amenities, action_type, effect_intensity, bg_opacity, is_big, weight, exposure_count, last_exposed_at, status, expires_at, view_count, detail_images, work_type, work_hours, benefits, contact_info, created_at, updated_at';

async function testSelectFields() {
    console.log("🔍 Testing biz_ads selectFields without 'company', 'image'...");
    const { data, error } = await supabase
        .from('biz_ads')
        .select(selectFields);

    if (error) {
        console.error("❌ 쿼리 에러 발생:", error.message);
        console.error("상세 코드:", error.code);
    } else {
        console.log(`✅ 쿼리 성공! 가져온 개수: ${data.length}`);
    }
}

testSelectFields();
