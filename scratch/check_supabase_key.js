require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const keyPassword = 'Rudghks!1';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL 또는 키 환경 변수가 누락되었습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSupabaseKey() {
  console.log('📡 Supabase Storage에서 mok_keyInfo.dat 다운로드 시도...');
  const { data, error } = await supabase.storage
    .from('keys')
    .download('mok_keyInfo.dat');

  if (error) {
    console.error('❌ 다운로드 실패:', error.message);
    return;
  }

  try {
    const arrayBuffer = await data.arrayBuffer();
    const encryptedData = Buffer.from(arrayBuffer);
    console.log(`✅ 다운로드 완료 (${encryptedData.length} bytes)`);

    const passwordBytes = Buffer.from(keyPassword, 'utf8');
    const hash1 = crypto.createHash('sha256').update(passwordBytes).digest();
    const aesKeyBytes = Buffer.alloc(32);
    hash1.copy(aesKeyBytes, 0, 0, 16);
    const hash2 = crypto.createHash('sha256').update(hash1).digest();
    hash2.copy(aesKeyBytes, 16, 16, 32);
    const aesIvBytes = Buffer.alloc(16);
    hash2.copy(aesIvBytes, 0, 0, 16);

    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKeyBytes, aesIvBytes);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    const keyInfoJson = JSON.parse(decrypted.toString('utf8'));

    console.log('\n=== Supabase Storage 저장 키 복호화 결과 ===');
    console.log('ServiceId:', keyInfoJson.ServiceId);
    console.log('ServerPublicKey 앞 40자:', keyInfoJson.ServerPublicKey.substring(0, 40) + '...');
    
    if (keyInfoJson.ServiceId === 'fb63369f-db72-4858-9ee2-37d705da052c') {
      console.log('✅ 결과: [운영용 키]로 올바르게 설정되어 있습니다.');
    } else if (keyInfoJson.ServiceId === 'adfdc22f-835f-45f1-8dbb-15ee077b6114') {
      console.log('❌ 결과: [개발용 키]로 오설정되어 있습니다!');
    } else {
      console.log('❓ 결과: 알 수 없는 키입니다. ServiceId:', keyInfoJson.ServiceId);
    }
  } catch (err) {
    console.error('❌ 복호화 실패:', err.message);
  }
}

checkSupabaseKey();
