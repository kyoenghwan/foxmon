const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// .env.local 파일 직접 파싱하여 환경 변수 주입 (윈도우 개행 \r 완벽 제거)
try {
  const envPath = path.join(__dirname, '../.env.local');
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
  console.error("환경 변수 파일 로드 실패:", e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key 존재 여부:", !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Supabase 설정 정보가 누락되었습니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("DB의 'foxmon.cs' 아이디를 'foxmon_cs'로 업데이트 시도 중...");
  
  const { data, error } = await supabase
    .from('users')
    .update({ login_id: 'foxmon_cs' })
    .eq('login_id', 'foxmon.cs')
    .select();

  if (error) {
    console.error("에러 발생:", error);
  } else {
    console.log("업데이트 완료 결과:", data);
  }
}

run();
