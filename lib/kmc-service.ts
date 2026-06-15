import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
// @ts-ignore
import { HttpsProxyAgent } from 'https-proxy-agent';
import { nvLog } from './logger';
import { supabaseAdmin } from './supabase';

// Fixie 고정 IP 프록시 설정
const proxyUrl = process.env.FIXIE_URL;
const httpsAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
const kmcClient = axios.create({
  httpsAgent,
  proxy: false,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json; charset=UTF-8'
  }
});

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
export async function decryptMokKeyInfo(trace?: string[]): Promise<KmcKeyInfo> {
  if (cachedKeyInfo) {
    const msg = '🔑 [KMC_DECRYPT] 캐싱된 KMC 키 정보를 재사용합니다.';
    nvLog('AT', msg);
    trace?.push(msg);
    return cachedKeyInfo;
  }

  const log = (msg: string) => {
    nvLog('AT', msg);
    trace?.push(msg);
  };

  log('🔑 [KMC_DECRYPT] KMC 복호화 프로세스 시작');
  try {
    let encryptedData: Buffer | null = null;
    let keyPassword = KMC_KEY_PASSWORD;
    
    // Step 1. 암호화된 키 파일 준비
    log('🔑 [KMC_DECRYPT] Step 1: 암호화된 키 파일(mok_keyInfo.dat) 준비 및 읽기 시작');
    if (!KMC_KEY_PASSWORD) {
      log('❌ [KMC_DECRYPT] 에러: KMC_KEY_PASSWORD 환경 변수가 누락되었습니다.');
      throw new Error('KMC 복호화 비밀번호(KMC_KEY_PASSWORD)가 누락되었습니다.');
    }

    // Step 1-1 & 1-2. 파일 준비 및 byte[] 배열 읽기
    const keyFilePath = KMC_KEY_FILE_PATH ? path.resolve(KMC_KEY_FILE_PATH) : null;
    if (keyFilePath && fs.existsSync(keyFilePath)) {
      log(`📂 [KMC_DECRYPT] Step 1-1 (로컬 디스크): 경로 = ${keyFilePath}`);
      encryptedData = fs.readFileSync(keyFilePath);
      log(`⚡ [KMC_DECRYPT] Step 1-2: 로컬 디스크 파일 읽기 완료 (${encryptedData.length} bytes)`);
    } else {
      log('📂 [KMC_DECRYPT] Step 1-1: 로컬 디스크에 키 파일이 없어 원격 저장소 조회를 시도합니다.');
      let supabaseSuccess = false;
      try {
        log('📡 [KMC_DECRYPT] Step 1-1 (Supabase Storage): keys/mok_keyInfo.dat 다운로드 시도');
        const { data, error } = await supabaseAdmin.storage
          .from('keys')
          .download('mok_keyInfo.dat');
        
        if (error) {
          log(`⚠️ [KMC_DECRYPT] Supabase Storage 다운로드 실패: ${error.message}`);
        } else if (data) {
          const arrayBuffer = await data.arrayBuffer();
          encryptedData = Buffer.from(arrayBuffer);
          supabaseSuccess = true;
          log(`⚡ [KMC_DECRYPT] Step 1-2: Supabase Storage 로드 완료 (${encryptedData.length} bytes)`);
        }
      } catch (err: any) {
        log(`⚠️ [KMC_DECRYPT] Supabase Storage 다운로드 예외 발생: ${err.message}`);
      }

      if (!supabaseSuccess) {
        if (KMC_KEY_CONTENT) {
          log('⚡ [KMC_DECRYPT] Step 1-1 (환경변수 백업): KMC_KEY_CONTENT base64 파싱 시도');
          const sanitizedContent = KMC_KEY_CONTENT.replace(/\s+/g, '');
          encryptedData = Buffer.from(sanitizedContent, 'base64');
          log(`⚡ [KMC_DECRYPT] Step 1-2: 환경변수 KMC_KEY_CONTENT 파싱 완료 (${encryptedData.length} bytes)`);
        } else {
          log('❌ [KMC_DECRYPT] 에러: 로컬 파일, Supabase Storage, KMC_KEY_CONTENT 환경변수 모두 존재하지 않습니다.');
          throw new Error('KMC 키 파일(물리 파일, Supabase Storage, 또는 KMC_KEY_CONTENT 환경변수)을 모두 찾을 수 없습니다.');
        }
      }
    }

    if (!encryptedData || encryptedData.length === 0) {
      log('❌ [KMC_DECRYPT] 에러: 로드된 키 데이터 바이트 배열이 비어있습니다.');
      throw new Error('로드된 키 데이터 바이트 배열이 비어있습니다.');
    }

    // Step 2. AES 복호화 키 및 IV 생성
    log('🔑 [KMC_DECRYPT] Step 2: AES 복호화용 Key 및 IV 유도 시작');
    
    // Step 2-1. 해시함수(SHA-256) 준비
    // Step 2-2. mobileOK_password를 해싱하여 Hash1 생성 및 앞 16바이트 추출
    const passwordBytes = Buffer.from(keyPassword, 'utf8');
    const hash1 = crypto.createHash('sha256').update(passwordBytes).digest();
    log('⚡ [KMC_DECRYPT] Step 2-1 & 2-2: 비밀번호 바이트 해싱 1회차(Hash1) 완료');
    
    const aesKeyBytes = Buffer.alloc(32);
    hash1.copy(aesKeyBytes, 0, 0, 16); // Hash1 앞 16바이트 복사
    log('⚡ [KMC_DECRYPT] Step 2-2: Hash1의 앞 16바이트를 AES Key 앞부분으로 채웠습니다.');

    // Step 2-3. Hash1 결과물을 한 번 더 해싱하여 Hash2 생성 및 IV(16바이트) 추출
    const hash2 = crypto.createHash('sha256').update(hash1).digest();
    log('⚡ [KMC_DECRYPT] Step 2-3: Hash1을 재해싱하여 Hash2 완료');
    
    hash2.copy(aesKeyBytes, 16, 16, 32); // Hash2 뒤 16바이트 복사
    log('⚡ [KMC_DECRYPT] Step 2-3: Hash2의 뒤 16바이트를 AES Key 뒷부분으로 채워 32바이트 Key 완성');

    const aesIvBytes = Buffer.alloc(16);
    hash2.copy(aesIvBytes, 0, 0, 16); // Hash2 앞 16바이트 복사
    log('⚡ [KMC_DECRYPT] Step 2-3: Hash2의 앞 16바이트를 초기화 벡터(AES IV, 16바이트)로 유도 완료');

    // Step 3. 데이터 복호화 (AES-256-CBC)
    log('🔑 [KMC_DECRYPT] Step 3: AES/CBC/PKCS5Padding 모드로 데이터 복호화 실행');
    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKeyBytes, aesIvBytes);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    log(`⚡ [KMC_DECRYPT] Step 3-1: AES-256-CBC 복호화 완료 (${decrypted.length} bytes)`);

    // Step 4. 결과 확인
    log('🔑 [KMC_DECRYPT] Step 4: 복호화 데이터 JSON UTF-8 문자열 변환 및 파싱');
    const keyInfoJson = JSON.parse(decrypted.toString('utf8'));
    
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

    log(`✅ [KMC_DECRYPT] Step 4-1: 파싱 완료. ServiceId = [${cachedKeyInfo.ServiceId}] 확인`);
    return cachedKeyInfo;
  } catch (err: any) {
    log(`❌ [KMC_DECRYPT] 복호화 단계 도중 에러가 발생했습니다: ${err.message}`);
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
export async function getKmcToken(siteUrl: string, trace?: string[]): Promise<{ encryptMOKToken: string; publicKey: string } | null> {
  const log = (msg: string) => {
    nvLog('AT', msg);
    trace?.push(msg);
  };

  log('📡 [KMC_TOKEN] KMC 거래 토큰 발급 프로세스 시작');
  try {
    const keyInfo = await decryptMokKeyInfo(trace);

    // Step 1. 이용기관 거래 ID (clientTxId) 생성
    log('📡 [KMC_TOKEN] Step 1: 이용기관 거래 ID (clientTxId) 생성 시작');
    
    // Step 1-1. 중복되지 않는 거래ID 생성 (20자 이상 40자 이내)
    const clientTxId = `foxmon-${crypto.randomBytes(12).toString('hex')}`;
    log(`⚡ [KMC_TOKEN] Step 1-1: clientTxId 생성 완료 = [${clientTxId}] (길이: ${clientTxId.length})`);

    // Step 2. 본인확인 토큰요청 데이터 생성
    log('📡 [KMC_TOKEN] Step 2: 본인확인 토큰요청 데이터 생성 시작');
    
    // Step 2-1 & 2-2. 암호화 전 데이터(JSONData) 생성 및 직렬화
    const requestTime = new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14); // YYYYMMDDHHmmss
    const requestJson = JSON.stringify({
      version: 'V2',
      clientTxId,
      requestTime
    });
    log(`⚡ [KMC_TOKEN] Step 2-1 & 2-2: JSON 객체 생성 및 직렬화 완료 = ${requestJson}`);

    // Step 2-3. 암호화 진행 (RSA 암호화)
    log('📡 [KMC_TOKEN] Step 2-3: RSA-OAEP 방식으로 JSON 직렬화 데이터 암호화 및 Base64 인코딩 시작');
    const encryptReqClientInfo = encryptKmcTokenRequest(requestJson, keyInfo.ServerPublicKey);
    log(`⚡ [KMC_TOKEN] Step 3-1: Base64 인코딩된 본인확인 요청 토큰(encryptReqClientInfo) 생성 성공 (${encryptReqClientInfo.substring(0, 20)}...)`);

    // 3) KMC 서버로 토큰 요청 API 호출
    const apiUrl = TEST_MODE 
      ? 'https://scert-dir.mobile-ok.com/agent/v2/token/get'
      : 'https://cert-dir.mobile-ok.com/agent/v2/token/get';

    log(`📡 [KMC_TOKEN] Step 3: KMC 서버로 토큰 요청 API 호출 시작 (Fixie 프록시 사용) - URL: ${apiUrl}, siteUrl: [${siteUrl}]`);
    const response = await kmcClient.post(apiUrl, {
      serviceId: keyInfo.ServiceId,
      encryptReqClientInfo,
      siteUrl
    });

    const result = response.data;
    log(`⚡ [KMC_TOKEN] KMC API 응답 수신 - resultCode: [${result.resultCode}], resultMsg: [${result.resultMsg}]`);

    if (result.resultCode === '2000') {
      log('✅ [KMC_TOKEN] KMC 거래 토큰 발급 최종 성공');
      return {
        encryptMOKToken: result.encryptMOKToken,
        publicKey: result.publicKey
      };
    } else {
      log(`❌ [KMC_TOKEN] KMC 토큰 발급 에러: ${result.resultMsg} (${result.resultCode})`);
      throw new Error(`KMC 토큰 요청 실패: ${result.resultMsg} (${result.resultCode})`);
    }
  } catch (err: any) {
    log(`❌ [KMC_TOKEN] KMC 토큰 발급 프로세스 도중 예외 발생: ${err.message}`);
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

    nvLog('AT', '📡 KMC 본인확인 인증번호 전송 API 호출 (Fixie 프록시)', { url: apiUrl });
    const response = await kmcClient.post(apiUrl, {
      encryptMOKToken: params.encryptMOKToken,
      encryptMOKAuthInfo,
      siteUrl: params.siteUrl
    });

    const result = response.data;
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

    nvLog('AT', '📡 KMC 인증결과 확인 API 호출 (Fixie 프록시)', { url: apiUrl });
    const response = await kmcClient.post(apiUrl, {
      encryptMOKToken: params.encryptMOKToken,
      encryptMOKVerifyInfo
    });

    const result = response.data;
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
