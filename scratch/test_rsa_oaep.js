const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const fs = require('fs');
const crypto = require('crypto');

// 키 파일 복호화 로직
async function getKeys() {
  const keyPassword = process.env.KMC_KEY_PASSWORD;
  const keyFilePath = process.env.KMC_KEY_FILE_PATH;
  const encryptedData = fs.readFileSync(path.resolve(__dirname, '..', keyFilePath));
  
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
  
  const formatPem = (key, type) => {
    if (key.includes('---BEGIN')) return key;
    const cleanKey = key.replace(/\s+/g, '');
    const lines = cleanKey.match(/.{1,64}/g) || [];
    return `-----BEGIN ${type} KEY-----\n${lines.join('\n')}\n-----END ${type} KEY-----`;
  };

  return {
    ClientPrivateKey: formatPem(keyInfoJson.ClientPrivateKey, 'PRIVATE'),
    ServerPublicKey: formatPem(keyInfoJson.ServerPublicKey, 'PUBLIC')
  };
}

async function testRsaOaep() {
  try {
    const keys = await getKeys();
    const testPlain = "mytest-aes-key-iv-hash-value|computed-hash-signature";
    
    console.log("1. RSA-OAEP 암호화 시도 (ClientPublicKey로 암호화)");
    const clientPublicKey = crypto.createPublicKey(keys.ClientPrivateKey);
    const clientPublicKeyPem = clientPublicKey.export({ type: 'spki', format: 'pem' });
    
    const encrypted = crypto.publicEncrypt({
      key: clientPublicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
      mgf1Hash: 'sha256'
    }, Buffer.from(testPlain, 'utf8'));
    
    console.log("Encrypted base64:", encrypted.toString('base64'));
    
    console.log("2. RSA-OAEP 복호화 시도 (ClientPrivateKey로 복호화)");
    const decrypted = crypto.privateDecrypt({
      key: keys.ClientPrivateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
      mgf1Hash: 'sha256'
    }, encrypted);
    
    console.log("Decrypted text:", decrypted.toString('utf8'));
    console.log("✅ RSA-OAEP 자체 테스트 성공!");
    
  } catch (err) {
    console.error("❌ RSA-OAEP 테스트 실패:", err);
  }
}

testRsaOaep();
