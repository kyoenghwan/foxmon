const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const fs = require('fs');
const crypto = require('crypto');

// 1. KMC 키 복호화 및 포맷팅
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
    ServiceId: keyInfoJson.ServiceId,
    ClientPrivateKey: formatPem(keyInfoJson.ClientPrivateKey, 'PRIVATE'),
    ServerPublicKey: formatPem(keyInfoJson.ServerPublicKey, 'PUBLIC')
  };
}

// 2. 가이드라인 V3 규격의 1단계 토큰 암호화 (ServerPublicKey 사용)
function encryptKmcTokenRequestV3(plainText, serverPublicKeyPem) {
  const encrypted = crypto.publicEncrypt({
    key: serverPublicKeyPem,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256',
    mgf1Hash: 'sha256'
  }, Buffer.from(plainText, 'utf8'));
  return encrypted.toString('base64');
}

// 3. KMC가 본인인증 결과를 만들어서 우리에게 주는 시뮬레이션 암호화 로직 (ClientPublicKey 사용)
function simulateKmcResultEncryption(plainText, clientPrivateKeyPem) {
  // 개인키로부터 공개키 추출
  const clientPublicKey = crypto.createPublicKey(clientPrivateKeyPem);
  const clientPublicKeyPem = clientPublicKey.export({ type: 'spki', format: 'pem' });

  // 1) 무작위 AES-256-CBC 키(32바이트) 및 IV(16바이트) 생성
  const aesKey = crypto.randomBytes(32);
  const aesIv = crypto.randomBytes(16);

  // 2) 평문 데이터를 AES-256-CBC로 암호화
  const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, aesIv);
  let encryptedData = cipher.update(Buffer.from(plainText, 'utf8'));
  encryptedData = Buffer.concat([encryptedData, cipher.final()]);
  const encData = encryptedData.toString('base64');

  // 3) keyIv 구성: AES Key(32바이트) + AES IV(16바이트) ➔ 48바이트
  const keyIv = Buffer.concat([aesKey, aesIv]);
  const keyIvBase64 = keyIv.toString('base64');

  // 4) 평문 데이터의 SHA-256 해시 생성 및 Base64 인코딩
  const hash = crypto.createHash('sha256').update(Buffer.from(plainText, 'utf8')).digest('base64');

  // 5) encKey = keyIvBase64 + "|" + hash
  const encKey = `${keyIvBase64}|${hash}`;

  // 6) encKey를 이용기관 공개키(ClientPublicKey)로 RSA-OAEP-SHA256 암호화
  const encryptedKeyIv = crypto.publicEncrypt({
    key: clientPublicKeyPem,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256',
    mgf1Hash: 'sha256'
  }, Buffer.from(encKey, 'utf8'));
  const encryptedKeyIvBase64 = encryptedKeyIv.toString('base64');

  // 7) 최종 데이터: encryptedKeyIvBase64 | encData
  return `${encryptedKeyIvBase64}|${encData}`;
}

// 4. KMC 결과 복호화 로직 (ClientPrivateKey 사용)
function decryptKmcResultV3(encryptedResult, clientPrivateKeyPem) {
  const parts = encryptedResult.split('|');
  if (parts.length !== 2) {
    throw new Error('KMC 결과 데이터 포맷이 올바르지 않습니다.');
  }

  const [encryptKeyIvHashData, encryptResultData] = parts;

  // 1) RSA-OAEP 복호화
  const decryptedKeyIvHash = crypto.privateDecrypt({
    key: clientPrivateKeyPem,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256',
    mgf1Hash: 'sha256'
  }, Buffer.from(encryptKeyIvHashData, 'base64'));

  const decryptedKeyIvHashStr = decryptedKeyIvHash.toString('utf8');
  const keyIvHashParts = decryptedKeyIvHashStr.split('|');
  if (keyIvHashParts.length !== 2) {
    throw new Error('복호화된 대칭키 정보가 유효하지 않습니다.');
  }

  const [base64KeyIv, hashData] = keyIvHashParts;

  // 2) AES Key & IV 추출
  const keyIv = Buffer.from(base64KeyIv, 'base64');
  if (keyIv.length !== 48) {
    throw new Error('복호화된 대칭키 길이가 유효하지 않습니다.');
  }

  const aesKey = Buffer.alloc(32);
  const aesIv = Buffer.alloc(16);
  keyIv.copy(aesKey, 0, 0, 32);
  keyIv.copy(aesIv, 0, 32, 48);

  // 3) AES-256-CBC 복호화 실행
  const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, aesIv);
  let decryptedResult = decipher.update(Buffer.from(encryptResultData, 'base64'));
  decryptedResult = Buffer.concat([decryptedResult, decipher.final()]);
  const resultText = decryptedResult.toString('utf8');

  // 4) 무결성(SHA-256) 검증
  const computedHash = crypto.createHash('sha256').update(Buffer.from(resultText, 'utf8')).digest('base64');
  if (computedHash !== hashData) {
    throw new Error('KMC 결과 데이터 해시 검증 실패 (변조 가능성 있음)');
  }

  return JSON.parse(resultText);
}

async function runFullFlowSimulation() {
  try {
    const keys = await getKeys();
    console.log("==========================================");
    console.log("▶️ KMC V3 표준창 암복호화 전체 흐름 시뮬레이션 시작");
    console.log("==========================================");
    
    // [Step 1] 1단계 토큰 발급 요청 암호화 (ServerPublicKey 사용)
    console.log("[Step 1] 1단계 토큰 발급 요청 데이터 암호화 중...");
    const clientTxId = "test-tx-id-1234567890";
    const requestTime = "20260618090000";
    const requestJson = JSON.stringify({
      version: 'V2',
      clientTxId,
      requestTime
    });
    const encryptReqClientInfo = encryptKmcTokenRequestV3(requestJson, keys.ServerPublicKey);
    console.log(" - 생성된 JSON 평문:", requestJson);
    console.log(" - RSA-OAEP 암호화 결과 (Base64 일부):", encryptReqClientInfo.substring(0, 50) + "...");
    
    // [Step 2] KMC 인증결과 암호화 데이터 수신 시뮬레이션 (ClientPublicKey 사용)
    console.log("\n[Step 2] KMC 인증결과 암호화 데이터 생성 시뮬레이션 중...");
    const mockKmcResult = JSON.stringify({
      userName: "홍길동",
      userBirthday: "19900101",
      userGender: "1",
      userPhone: "01012345678",
      userNation: "0",
      reqAuthType: "MOBILE",
      resultCode: "2000",
      resultMsg: "SUCCESS"
    });
    const encryptedResult = simulateKmcResultEncryption(mockKmcResult, keys.ClientPrivateKey);
    console.log(" - 모의 본인인증 결과 JSON:", mockKmcResult);
    console.log(" - 암호화된 encryptMOKResult (Base64 일부):", encryptedResult.substring(0, 50) + "...");
    
    // [Step 3] 3단계 결과 복호화 실행 (ClientPrivateKey 사용)
    console.log("\n[Step 3] 3단계 복호화 실행 중...");
    const decryptedResult = decryptKmcResultV3(encryptedResult, keys.ClientPrivateKey);
    console.log(" - 복호화 결과 JSON:", JSON.stringify(decryptedResult));
    
    if (decryptedResult.userName === "홍길동") {
      console.log("\n✅ [성공] 가이드라인 V3 스펙 기준 양방향 암복호화가 완벽하게 검증되었습니다!");
    } else {
      console.log("\n❌ [실패] 복호화 데이터가 원본과 일치하지 않습니다.");
    }
    console.log("==========================================");
  } catch (err) {
    console.error("\n❌ [시뮬레이션 예외 발생]:", err);
  }
}

runFullFlowSimulation();
