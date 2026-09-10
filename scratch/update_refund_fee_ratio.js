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
  console.log("DB의 'REFUND_FEE_RATIO' 설정 유무 파악 중...");
  
  const { data: existing, error: findError } = await supabase
    .from('point_policies')
    .select('*')
    .eq('config_key', 'REFUND_FEE_RATIO')
    .order('start_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) {
    console.error("검색 실패:", findError);
    return;
  }

  if (existing) {
    console.log("기존 행 존재하여 ID 업데이트 시도:", existing.id);
    const { data, error } = await supabase
      .from('point_policies')
      .update({ config_value: '0.1' })
      .eq('id', existing.id)
      .select();
    if (error) console.error("업데이트 에러:", error);
    else console.log("업데이트 성공:", data);
  } else {
    console.log("기존 행이 없어 인서트 시도...");
    const { data, error } = await supabase
      .from('point_policies')
      .insert({
        config_key: 'REFUND_FEE_RATIO',
        config_value: '0.1',
        start_at: new Date().toISOString()
      })
      .select();
    if (error) console.error("인서트 에러:", error);
    else console.log("인서트 성공:", data);
  }
}

run();
