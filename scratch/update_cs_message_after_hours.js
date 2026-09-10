const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// .env.local 파일 직접 파싱하여 환경 변수 주입
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kgwvftaebjkjwwpsftqv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Supabase 설정 정보가 누락되었습니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("DB의 'cs_msg_after_hours' 설정을 업서트(upsert) 시도 중...");
  
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({
      category: 'cs',
      key_name: 'cs_msg_after_hours',
      key_value: '문의를 남겨주시면 확인하는 대로 답변을 드리도록 하겠습니다.',
      updated_at: new Date().toISOString()
    }, { onConflict: 'key_name' })
    .select();

  if (error) {
    console.error("에러 발생:", error);
  } else {
    console.log("업서트 완료 결과:", data);
  }
}

run();
