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
  console.log("▶️ FAQ 등급 안내 질문 및 답변 수정 SQL 실행 중...");
  
  const sql = `
    UPDATE public.faqs 
    SET 
      question = '등급(우수/으뜸/명가)은 어떤 혜택이 있나요?',
      answer = '등급별로 포인트 충전 시 추가 보너스가 지급됩니다. 우수 등급은 10%, 으뜸 등급은 20%, 명가 등급은 30%의 보너스 적립율이 적용됩니다.' 
    WHERE question = '등급(VIP/VVIP)은 어떤 혜택이 있나요?';
  `;
  
  const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql });
  if (error) {
    console.error("❌ SQL 실행 실패:", error);
  } else {
    console.log("🎉 성공적으로 FAQ 등급 안내가 수정되었습니다!", data);
  }
}

run();
