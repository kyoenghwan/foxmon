const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// .env.local 및 .env 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Supabase 환경 변수가 누락되었습니다.", { supabaseUrl, supabaseServiceKey });
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("▶️ DB 제약조건(unique_user_daily_game) 삭제 SQL 실행...");
  const sql = `ALTER TABLE public.user_game_logs DROP CONSTRAINT IF EXISTS unique_user_daily_game;`;
  
  const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql });
  if (error) {
    console.error("❌ SQL 실행 중 에러:", error);
  } else {
    console.log("🎉 성공적으로 제약조건이 삭제되었습니다!", data);
  }
}

run();
