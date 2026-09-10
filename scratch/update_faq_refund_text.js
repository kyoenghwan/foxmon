const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// .env.local 및 .env 파일 모두 파싱하여 환경 변수 주입
const envFiles = ['.env.local', '.env'];
envFiles.forEach(fileName => {
  try {
    const envPath = path.join(__dirname, '../', fileName);
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split(/\r?\n/).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
          process.env[key] = val;
        }
      });
    }
  } catch (e) {
    console.error(`${fileName} 로드 실패:`, e);
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kgwvftaebjkjwwpsftqv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Supabase 설정 정보가 누락되었습니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("DB의 FAQ 테이블에서 환불 안내 문구 수정 중...");
  console.log("Supabase URL:", supabaseUrl);
  console.log("Has Service Role Key:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const newAnswer = "유료 포인트(실결제 포인트)에 한해 환불이 가능합니다. 충전 후 포인트를 단 1P도 사용하지 않은 '미사용 충전 건'은 수수료 없이 100% 전액 환불되며, 일부라도 사용한 충전 건에 한해서만 어뷰징 방지를 위해 10%의 환불 수수료를 공제한 잔액이 환불됩니다. (보너스로 지급된 적립 포인트는 환불 대상이 아니며 전액 소멸됩니다.)";

  const { data, error } = await supabase
    .from('faqs')
    .update({ answer: newAnswer })
    .eq('question', '포인트 환불은 가능한가요?')
    .select();

  if (error) {
    console.error("에러 발생:", error);
  } else {
    console.log("FAQ 문구 업데이트 결과:", data);
  }
}

run();
