const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// 환경 변수 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase 환경 변수가 누락되었습니다.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("▶️ FAQ 환불 안내 문구 수정 SQL 실행 중...");
  
  const sql = `
    UPDATE public.faqs 
    SET answer = '유료 포인트(실결제 포인트)에 한해 환불이 가능합니다. 충전 후 포인트를 단 1P도 사용하지 않은 ''미사용 충전 건''은 수수료 없이 100% 전액 환불되며, 일부라도 사용한 충전 건에 한해서만 어뷰징 방지를 위해 10%의 환불 수수료를 공제한 잔액이 환불됩니다. (보너스로 지급된 적립 포인트는 환불 대상이 아니며 전액 소멸됩니다.)' 
    WHERE question = '포인트 환불은 가능한가요?';
  `;
  
  const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql_query: sql }); // execute_sql 또는 execute_sql_query 파라미터가 맞는지 확인
  if (error) {
    console.log("기본 execute_sql_query 재시도...");
    const { data: d2, error: e2 } = await supabaseAdmin.rpc('execute_sql', { sql });
    if (e2) {
      console.error("❌ SQL 실행 실패:", e2);
    } else {
      console.log("🎉 성공적으로 FAQ 환불 문구가 수정되었습니다!", d2);
    }
  } else {
    console.log("🎉 성공적으로 FAQ 환불 문구가 수정되었습니다!", data);
  }
}

run();
