const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const keyPassword = 'Rudghks!1';

function decryptKeyFile(filePath, label) {
  console.log(`\n=== ${label} ===`);
  console.log(`경로: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ 파일이 존재하지 않습니다.');
    return null;
  }
  
  const stats = fs.statSync(filePath);
  console.log(`파일 크기: ${stats.size} bytes`);
  
  try {
    const encryptedData = fs.readFileSync(filePath);
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

    console.log(`ServiceId: ${keyInfoJson.ServiceId}`);
    console.log(`ServerPublicKey 앞 40자: ${keyInfoJson.ServerPublicKey.substring(0, 40)}...`);
    console.log(`ClientPrivateKey 앞 40자: ${keyInfoJson.ClientPrivateKey.substring(0, 40)}...`);
    
    return keyInfoJson;
  } catch (err) {
    console.log(`❌ 복호화 실패: ${err.message}`);
    return null;
  }
}

// 1. 현재 사용 중인 키 (keys/ 디렉토리)
const key1 = decryptKeyFile('./keys/mok_keyInfo.dat', '현재 사용 중 (keys/mok_keyInfo.dat)');

// 2. 루트 디렉토리 키
const key2 = decryptKeyFile('./mok_keyInfo.dat', '루트 디렉토리 (mok_keyInfo.dat)');

// 3. 운영용 키
const key3 = decryptKeyFile('./운영용[foxmon] mok_keyInfo/mok_keyInfo.dat', '운영용 (운영용[foxmon] mok_keyInfo/mok_keyInfo.dat)');

// 비교
console.log('\n=== 키 파일 비교 결과 ===');
if (key1 && key2) {
  console.log(`keys/ vs 루트: ServiceId ${key1.ServiceId === key2.ServiceId ? '✅ 동일' : '❌ 다름'}`);
  console.log(`  - keys/: ${key1.ServiceId}`);
  console.log(`  - 루트:  ${key2.ServiceId}`);
}
if (key1 && key3) {
  console.log(`keys/ vs 운영용: ServiceId ${key1.ServiceId === key3.ServiceId ? '✅ 동일' : '❌ 다름'}`);
  console.log(`  - keys/:  ${key1.ServiceId}`);
  console.log(`  - 운영용: ${key3.ServiceId}`);
}
if (key2 && key3) {
  console.log(`루트 vs 운영용: ServiceId ${key2.ServiceId === key3.ServiceId ? '✅ 동일' : '❌ 다름'}`);
}

// 환경 확인
console.log('\n=== 환경 설정 확인 ===');
console.log(`KMC_KEY_FILE_PATH: ${process.env.KMC_KEY_FILE_PATH || '(미설정, 기본값: ./keys/mok_keyInfo.dat)'}`);
console.log(`NEXT_PUBLIC_KMC_TEST_MODE: ${process.env.NEXT_PUBLIC_KMC_TEST_MODE || '(미설정)'}`);
console.log(`현재 운영 서버 URL: cert-dir.mobile-ok.com (운영 환경)`);
