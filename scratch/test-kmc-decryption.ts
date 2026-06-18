import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// 환경 변수 설정 후에 모듈을 로드
const { decryptMokKeyInfo } = require('../lib/kmc-service');

async function main() {
  console.log("KMC 운영용 키 검증 시작...");
  const fs = require('fs');
  const path = require('path');
  
  try {
    // 운영용 키 경로 고정
    const targetFilePath = path.resolve('운영용[foxmon] mok_keyInfo/mok_keyInfo.dat');
    console.log("대상 파일 경로:", targetFilePath);
    
    if (!fs.existsSync(targetFilePath)) {
      throw new Error("운영용 키 파일이 해당 경로에 존재하지 않습니다.");
    }
    
    // 복호화 비밀번호 고정
    const keyPassword = 'Rudghks!1';
    const encryptedData = fs.readFileSync(targetFilePath);
    
    // kmc-service의 복호화 내부 로직을 가져와서 직접 테스트
    const crypto = require('crypto');
    
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
    
    const decryptedText = decrypted.toString('utf8');
    console.log("복호화된 원본 문자열 확인 (일부):", decryptedText.substring(0, 100));
    
    const keyInfoJson = JSON.parse(decryptedText);
    console.log("\n✅ [성공] 운영용 키 파일이 'Rudghks!1' 비밀번호로 정상 복호화됩니다!");
    console.log("ServiceId:", keyInfoJson.ServiceId);
  } catch (err: any) {
    console.error("\n❌ [실패] 운영용 키 파일 복호화에 실패했습니다.");
    console.error("에러 내용:", err.message);
  }
}

main();
