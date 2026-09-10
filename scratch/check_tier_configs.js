const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// 환경 변수 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("DB의 tier_configs 테이블 조회 중...");
  
  const { data, error } = await supabase
    .from('tier_configs')
    .select('*')
    .order('bonus_ratio', { ascending: true });

  if (error) {
    console.error("에러 발생:", error);
  } else {
    console.log("현재 등급 리스트:", JSON.stringify(data, null, 2));
  }
}

run();
