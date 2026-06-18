const path = require('path');
const dotenv = require('dotenv');
// .env.local 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const fs = require('fs');
const crypto = require('crypto');

async function testDecrypt() {
  const keyPassword = process.env.KMC_KEY_PASSWORD;
  const keyFilePath = process.env.KMC_KEY_FILE_PATH;
  
  console.log('Password:', keyPassword);
  console.log('File Path:', keyFilePath);
  
  try {
    const resolvedPath = path.resolve(__dirname, '..', keyFilePath);
    console.log('Resolved Key Path:', resolvedPath);
    const encryptedData = fs.readFileSync(resolvedPath);
    console.log('Encrypted Data Length:', encryptedData.length);
    
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
    
    console.log('Decrypted Length:', decrypted.length);
    const keyInfoJson = JSON.parse(decrypted.toString('utf8'));
    console.log('ServiceId:', keyInfoJson.ServiceId);
    console.log('ClientPrivateKey Length:', keyInfoJson.ClientPrivateKey?.length);
    console.log('ServerPublicKey Length:', keyInfoJson.ServerPublicKey?.length);
    console.log('✅ mok_keyInfo.dat 복호화 성공!');
  } catch (err) {
    console.error('❌ 복호화 실패:', err);
  }
}

testDecrypt();
