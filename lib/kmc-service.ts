import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { nvLog } from './logger';
import { supabaseAdmin } from './supabase';

export interface KmcUserInfo {
  name: string;
  birthDate: string; // YYYYMMDD
  gender: 'MALE' | 'FEMALE';
  phoneNumber: string;
  nationality: 'KOREAN' | 'FOREIGNER';
  isAdult: boolean;
  verifiedMethod: string;
}

export interface KmcKeyInfo {
  ServiceId: string;
  ClientPrivateKey: string; // PEM 형식
  ServerPublicKey: string; // PEM 형식
}

// 환경 변수 및 임시 모의 모드 설정
const KMC_KEY_PASSWORD = process.env.KMC_KEY_PASSWORD || '';
const KMC_KEY_FILE_PATH = process.env.KMC_KEY_FILE_PATH || '';
const KMC_KEY_CONTENT = process.env.KMC_KEY_CONTENT || '';
const TEST_MODE = process.env.NEXT_PUBLIC_KMC_TEST_MODE === 'true';

// 캐싱된 키 정보
let cachedKeyInfo: KmcKeyInfo | null = null;

/**
 * 1. mok_keyInfo.dat 파일 복호화하여 서비스 ID 및 암호화 키 획득
 */
export async function decryptMokKeyInfo(): Promise<KmcKeyInfo> {
  if (cachedKeyInfo) return cachedKeyInfo;

  try {
    let encryptedData: Buffer;
    let keyPassword = KMC_KEY_PASSWORD;
    if (!KMC_KEY_PASSWORD) {
      throw new Error('KMC 복호화 비밀번호(KMC_KEY_PASSWORD)가 누락되었습니다.');
    }

    // 1) 로컬 디스크 파일이 존재하면 우선 로드
    const keyFilePath = KMC_KEY_FILE_PATH ? path.resolve(KMC_KEY_FILE_PATH) : null;
    if (keyFilePath && fs.existsSync(keyFilePath)) {
      nvLog('AT', '📂 로컬 디스크 파일에서 KMC 키 정보를 로드합니다.');
      encryptedData = fs.readFileSync(keyFilePath);
    } 
    // 2) 파일이 없으면 환경변수 KMC_KEY_CONTENT 백업 로드 시도
    else if (KMC_KEY_CONTENT) {
      nvLog('AT', '⚡ 환경변수(KMC_KEY_CONTENT)에서 KMC 키 정보를 로드합니다.');
      encryptedData = Buffer.from(KMC_KEY_CONTENT.trim(), 'base64');
    } 
    // 3) 둘 다 누락 시 에러 발생
    else {
      throw new Error('KMC 키 파일(물리 파일 또는 KMC_KEY_CONTENT 환경변수)을 찾을 수 없습니다.');
    }

    keyPassword = KMC_KEY_PASSWORD;

    // SHA-256 기반 AES Key 및 IV 파생 로직
    const passwordBytes = Buffer.from(keyPassword, 'utf8');
    const hash1 = crypto.createHash('sha256').update(passwordBytes).digest();
    
    const aesKeyBytes = Buffer.alloc(32);
    hash1.copy(aesKeyBytes, 0, 0, 16); // Hash1 앞 16바이트를 Key 앞 16바이트로 복사

    const hash2 = crypto.createHash('sha256').update(hash1).digest();
    hash2.copy(aesKeyBytes, 16, 16, 32); // Hash2 뒤 16바이트를 Key 뒤 16바이트로 복사

    const aesIvBytes = Buffer.alloc(16);
    hash2.copy(aesIvBytes, 0, 0, 16); // Hash2 앞 16바이트를 IV로 사용

    // AES-256-CBC 복호화
    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKeyBytes, aesIvBytes);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const keyInfoJson = JSON.parse(decrypted.toString('utf8'));
    
    // PEM 형식으로 변환하여 사용하기 편하도록 처리
    const formatPem = (key: string, type: 'PUBLIC' | 'PRIVATE') => {
      if (key.includes('---BEGIN')) return key;
      const cleanKey = key.replace(/\s+/g, '');
      const lines = cleanKey.match(/.{1,64}/g) || [];
      return `-----BEGIN ${type} KEY-----\n${lines.join('\n')}\n-----END ${type} KEY-----`;
    };

    cachedKeyInfo = {
      ServiceId: keyInfoJson.ServiceId,
      ClientPrivateKey: formatPem(keyInfoJson.ClientPrivateKey, 'PRIVATE'),
      ServerPublicKey: formatPem(keyInfoJson.ServerPublicKey, 'PUBLIC')
    };

    nvLog('AT', '🔑 KMC 키 정보 파일 복호화 및 로드 성공');
    return cachedKeyInfo;
  } catch (err: any) {
    nvLog('AT', '⚠️ KMC 키 파일 로드 실패 (Mock 모드로 작동 가능)', err.message);
    throw err;
  }
}

/**
 * 2. KMC 연동용 데이터 암호화 공통 로직
 * - 대칭키(AES)를 매번 생성하여 평문을 암호화하고, 대칭키 정보는 KMC 서버 공개키(RSA)로 암호화하여 결합
 */
export function encryptKmcData(plainText: string, serverPublicKeyPem: string): string {
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

  // 6) encKey를 KMC 서버의 공개키로 RSA-OAEP-SHA256 암호화
  const encryptedKeyIv = crypto.publicEncrypt({
    key: serverPublicKeyPem,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  }, Buffer.from(encKey, 'utf8'));
  const encryptedKeyIvBase64 = encryptedKeyIv.toString('base64');

  // 7) 최종 데이터: encryptedKeyIvBase64 | encData
  return `${encryptedKeyIvBase64}|${encData}`;
}

/**
 * 2-1. KMC 최초 토큰 요청 데이터 암호화 로직 (순수 RSA-OAEP-SHA256 단일 암호화)
 * - 토큰 요청 거래정보(encryptReqClientInfo)는 대칭키 암호화를 하지 않고, 평문 JSON을 RSA로 직접 암호화합니다.
 */
export function encryptKmcTokenRequest(plainText: string, serverPublicKeyPem: string): string {
  const encrypted = crypto.publicEncrypt({
    key: serverPublicKeyPem,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  }, Buffer.from(plainText, 'utf8'));
  return encrypted.toString('base64');
}

/**
 * 3. KMC로부터 받은 암호화된 결과 복호화 로직
 */
export function decryptKmcResult(encryptedResult: string, clientPrivateKeyPem: string): any {
  const parts = encryptedResult.split('|');
  if (parts.length !== 2) {
    throw new Error('KMC 결과 데이터 포맷이 올바르지 않습니다.');
  }

  const [encryptKeyIvHashData, encryptResultData] = parts;

  // 1) 암호화된 대칭키 정보를 서버 개인키로 RSA-OAEP-SHA256 복호화
  const decryptedKeyIvHash = crypto.privateDecrypt({
    key: clientPrivateKeyPem,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  }, Buffer.from(encryptKeyIvHashData, 'base64'));

  const [base64KeyIv, hashData] = decryptedKeyIvHash.toString('utf8').split('|');

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

/**
 * 4. KMC 거래 토큰 발급 API 연동
 */
export async function getKmcToken(siteUrl: string): Promise<{ encryptMOKToken: string; publicKey: string } | null> {
  try {
    const keyInfo = await decryptMokKeyInfo();

    // 1) 토큰 요청용 평문 데이터 생성
    const clientTxId = `${keyInfo.ServiceId}-${crypto.randomBytes(8).toString('hex')}`;
    const requestTime = new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14); // YYYYMMDDHHmmss
    
    const requestJson = JSON.stringify({
      version: 'V2',
      clientTxId,
      requestTime
    });

    // 2) KMC 서버 공개키로 암호화 (하이브리드 암호화가 아닌 순수 RSA-OAEP 단일 암호화)
    const encryptReqClientInfo = encryptKmcTokenRequest(requestJson, keyInfo.ServerPublicKey);

    // 3) KMC 서버로 토큰 요청 API 호출
    const apiUrl = TEST_MODE 
      ? 'https://scert-dir.mobile-ok.com/agent/v2/token/get'
      : 'https://cert-dir.mobile-ok.com/agent/v2/token/get';

    nvLog('AT', '📡 KMC 토큰 발급 API 호출', { url: apiUrl, serviceId: keyInfo.ServiceId });
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        serviceId: keyInfo.ServiceId,
        encryptReqClientInfo,
        siteUrl
      })
    });

    if (!response.ok) {
      throw new Error(`KMC HTTP 오류: ${response.status}`);
    }

    const result = await response.json();
    if (result.resultCode === '2000') {
      return {
        encryptMOKToken: result.encryptMOKToken,
        publicKey: result.publicKey
      };
    } else {
      throw new Error(`KMC 토큰 요청 실패: ${result.resultMsg} (${result.resultCode})`);
    }
  } catch (err: any) {
    nvLog('AT', '❌ KMC 토큰 발급 오류', err.message);
    throw err;
  }
}

/**
 * 5. KMC 인증요청 데이터 생성 (SMS/PASS 발송)
 */
export async function requestKmcAuth(params: {
  encryptMOKToken: string;
  publicKey: string;
  serviceType?: 'telcoAuth' | 'telcoAuth-Adult';
  providerId: string; // SKT, KT, LGU 등
  reqAuthType: 'SMS' | 'PASS';
  userName: string;
  userPhone: string;
  userBirthday: string;
  userGender: 'MALE' | 'FEMALE';
  userNation: 'KOREAN' | 'FOREIGNER';
  siteUrl: string;
}): Promise<{ success: boolean; message: string; encryptMOKToken?: string }> {
  try {
    // 1) MOKAuthInfo JSON 데이터 구성
    const authInfo = {
      serviceType: params.serviceType || 'telcoAuth-Adult', // 기본 성인인증
      providerId: params.providerId,
      reqAuthType: params.reqAuthType,
      usageCode: '01005', // 본인확인용
      userName: params.userName,
      userPhone: params.userPhone,
      userBirthday: params.userBirthday,
      userGender: params.userGender === 'MALE' ? '1' : '2',
      userNation: params.userNation === 'KOREAN' ? '0' : '1',
      retTransferType: 'MOKResult'
    };

    // 2) KMC 서버로부터 받은 일회용 공개키를 PEM 형태로 포맷팅
    const formatPemPublic = (base64Key: string) => {
      const cleanKey = base64Key.replace(/\s+/g, '');
      const lines = cleanKey.match(/.{1,64}/g) || [];
      return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;
    };

    const serverPublicKeyPem = formatPemPublic(params.publicKey);

    // 3) AES + RSA-OAEP 암호화 진행
    const encryptMOKAuthInfo = encryptKmcData(JSON.stringify(authInfo), serverPublicKeyPem);

    // 4) KMC 본인확인 인증번호 전송 API 호출
    const apiUrl = TEST_MODE
      ? 'https://scert-dir.mobile-ok.com/agent/v1/auth/request'
      : 'https://cert-dir.mobile-ok.com/agent/v1/auth/request';

    nvLog('AT', '📡 KMC 본인확인 인증번호 전송 API 호출', { url: apiUrl });
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        encryptMOKToken: params.encryptMOKToken,
        encryptMOKAuthInfo,
        siteUrl: params.siteUrl
      })
    });

    if (!response.ok) {
      throw new Error(`KMC HTTP 오류: ${response.status}`);
    }

    const result = await response.json();
    if (result.resultCode === '2000') {
      return { success: true, message: '인증번호가 발송되었습니다.', encryptMOKToken: result.encryptMOKToken };
    } else {
      return { success: false, message: `${result.resultMsg} (${result.resultCode})` };
    }
  } catch (err: any) {
    nvLog('AT', '❌ KMC 인증요청 실패', err.message);
    return { success: false, message: `본인인증 요청 중 오류가 발생했습니다: ${err.message}` };
  }
}

/**
 * 6. KMC 인증번호 검증 및 결과 데이터 확인
 */
export async function confirmKmcAuth(params: {
  encryptMOKToken: string;
  publicKey: string;
  authNumber: string; // 6자리 인증번호
}): Promise<{ success: boolean; message: string; userInfo?: KmcUserInfo }> {
  try {
    // 1) MOKVerifyInfo 데이터 암호화
    const verifyInfo = {
      authNumber: params.authNumber
    };

    const formatPemPublic = (base64Key: string) => {
      const cleanKey = base64Key.replace(/\s+/g, '');
      const lines = cleanKey.match(/.{1,64}/g) || [];
      return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;
    };

    const serverPublicKeyPem = formatPemPublic(params.publicKey);
    const encryptMOKVerifyInfo = encryptKmcData(JSON.stringify(verifyInfo), serverPublicKeyPem);

    // 2) KMC 인증결과 요청 API 호출
    const apiUrl = TEST_MODE
      ? 'https://scert-dir.mobile-ok.com/agent/v1/confirm/request'
      : 'https://cert-dir.mobile-ok.com/agent/v1/confirm/request';

    nvLog('AT', '📡 KMC 인증결과 확인 API 호출', { url: apiUrl });
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        encryptMOKToken: params.encryptMOKToken,
        encryptMOKVerifyInfo
      })
    });

    if (!response.ok) {
      throw new Error(`KMC HTTP 오류: ${response.status}`);
    }

    const result = await response.json();
    if (result.resultCode !== '2000') {
      return { success: false, message: `${result.resultMsg} (${result.resultCode})` };
    }

    // 3) 결과 복호화
    const keyInfo = await decryptMokKeyInfo();
    const rawUserInfo = decryptKmcResult(result.encryptMOKResult, keyInfo.ClientPrivateKey);

    // 4) 19세 이상 나이 검증
    const birthYear = parseInt(rawUserInfo.userBirthday.substring(0, 4), 10);
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    
    if (age < 19) {
      return { success: false, message: '만 19세 미만 성인은 이용이 불가능합니다.' };
    }

    const userInfo: KmcUserInfo = {
      name: rawUserInfo.userName,
      birthDate: rawUserInfo.userBirthday,
      gender: rawUserInfo.userGender === '1' ? 'MALE' : 'FEMALE',
      phoneNumber: rawUserInfo.userPhone,
      nationality: rawUserInfo.userNation === '0' ? 'KOREAN' : 'FOREIGNER',
      isAdult: true,
      verifiedMethod: rawUserInfo.reqAuthType || 'MOBILE'
    };

    return {
      success: true,
      message: '인증이 성공적으로 완료되었습니다.',
      userInfo
    };

  } catch (err: any) {
    nvLog('AT', '❌ KMC 인증확인 실패', err.message);
    return { success: false, message: `인증 확인 중 오류가 발생했습니다: ${err.message}` };
  }
}

/**
 * 7. Mock 모드 작동 유무 판별 (환경변수 및 DB 설정 미충족 시 자동으로 Mock으로 백업)
 */
export async function isMockMode(): Promise<boolean> {
  if (!TEST_MODE) {
    return false; // 상용 모드에서는 절대 Mock 모드 자동 폴백을 허용하지 않음
  }
  try {
    await decryptMokKeyInfo();
    return false;
  } catch {
    return true;
  }
}
