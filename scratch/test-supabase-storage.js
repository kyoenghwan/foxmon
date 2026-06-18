require('dotenv').config({ path: '.env.local' });
const path = require('path');
const fs = require('fs');
const { supabaseAdmin } = require('../lib/supabase');
const { decryptMokKeyInfo } = require('../lib/kmc-service');

async function testSupabaseStorageFlow() {
  console.log('--- 1. Supabase Storage 연동 테스트 시작 ---');
  
  const bucketName = 'keys';
  const fileName = 'mok_keyInfo.dat';
  const localKeyPath = path.resolve('운영용[foxmon] mok_keyInfo/mok_keyInfo.dat');

  try {
    if (!fs.existsSync(localKeyPath)) {
      throw new Error(`로컬 운영용 키 파일을 찾을 수 없습니다: ${localKeyPath}`);
    }
    const fileBuffer = fs.readFileSync(localKeyPath);
    console.log('✅ 로컬 운영용 키 파일 확인 완료 (크기:', fileBuffer.length, 'bytes)');

    console.log(`📡 Supabase Storage 버킷 '${bucketName}' 생성을 시도합니다...`);
    const { data: bucketData, error: bucketError } = await supabaseAdmin.storage.createBucket(bucketName, {
      public: false
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log(`ℹ️ 버킷 '${bucketName}'이 이미 존재합니다.`);
      } else {
        console.warn(`⚠️ 버킷 생성 중 경고:`, bucketError.message);
      }
    } else {
      console.log(`✅ 버킷 '${bucketName}'이 성공적으로 생성되었습니다.`, bucketData);
    }

    console.log(`📡 '${bucketName}/${fileName}' 경로에 키 파일을 업로드합니다...`);
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        upsert: true,
        contentType: 'application/octet-stream'
      });

    if (uploadError) {
      throw new Error(`파일 업로드 실패: ${uploadError.message}`);
    }
    console.log('✅ 파일 업로드 성공:', uploadData);

    const originalFilePathEnv = process.env.KMC_KEY_FILE_PATH;
    const originalContentEnv = process.env.KMC_KEY_CONTENT;
    delete process.env.KMC_KEY_FILE_PATH;
    delete process.env.KMC_KEY_CONTENT;

    console.log('\n--- 2. decryptMokKeyInfo 함수 테스트 (Supabase Storage로부터 로딩) ---');
    const keyInfo = await decryptMokKeyInfo();
    
    console.log('✅ [성공] Supabase Storage로부터 다운로드 및 복호화 완료!');
    console.log('ServiceId:', keyInfo.ServiceId);
    console.log('ClientPrivateKey (일부):', keyInfo.ClientPrivateKey.substring(0, 80) + '...');
    
    process.env.KMC_KEY_FILE_PATH = originalFilePathEnv;
    process.env.KMC_KEY_CONTENT = originalContentEnv;

  } catch (err) {
    console.error('❌ 테스트 중 에러 발생:', err.message);
  }
}

testSupabaseStorageFlow();
