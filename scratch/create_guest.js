const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// .env.local 수동 파싱
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const matched = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (matched) {
      const key = matched[1];
      let value = matched[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('NEXT_PUBLIC_SUPABASE_URL가 환경변수에 없습니다.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log('🔄 guest_001 계정 DB 생성 시도...');
  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert({
      login_id: 'guest_001',
      password: '$2b$10$soMw1F7kB2HRDaD3IJ03COczyyR7CJDzD5dF0Y0CwYmUU1Ev7RoF2', // guest1234!
      name: '외부감시자',
      nickname: '감시요원',
      role: 'VIEWER',
      birth_date: '19900101',
      age: 36,
      gender: 'MALE',
      phone_number: '010-0000-0000',
      nationality: 'KOREAN',
      is_age_verified: true
    }, { onConflict: 'login_id' });

  if (error) {
    console.error('❌ 계정 생성 실패:', error);
  } else {
    console.log('✅ guest_001 뷰어 계정이 성공적으로 생성/업데이트 되었습니다.');
  }
}

run();
