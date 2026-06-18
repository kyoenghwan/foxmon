// 벤더 라이브러리의 난독화 문자열 테이블을 해독하여 RSAEncrypt의 실제 동작을 확인
function a0_0x1e87(){
  const _0x277606=['8728CIMgEU','privateDecrypt','undefined','MOK\\x20Key\\x20파일\\x20경로가\\x20잘\\x20못\\x20되었습니다.\\x20','RSA\\x20암호화\\x20함수\\x20오류입니다.','createDecipheriv','getSiteUrl','Hash\\x20Exception','RSA\\x20암호화\\x20에러입니다.','2165074XwvMJD','MOK\\x20Key\\x20파일\\x20또는\\x20MOK\\x20Key\\x20파일\\x20비밀번호가\\x20잘\\x20못\\x20되었습니다.\\x20','constants','hex','from','split','sha256','-----END\\x20PRIVATE\\x20KEY-----','RSAEncrypt','-----END\\x20PUBLIC\\x20KEY-----','getRsaPrivateKey','createHash','5866bOdmDL','createKey','update','ServiceId','keyInit','1008599WESGPU','getResult','aes-256-cbc','입력한\\x20PublicKey가\\x20올바르지\\x20않습니다.\\x20MOK\\x20GetToken\\x20API에서\\x20발급후\\x20진행하시기\\x20바랍니다.','publicEncrypt','7823133mypizJ','createIv','log','siteUrl','getRsaPublicKey','55knTYOJ','6719514qgmaBP','trim','5EQuYQq','base64','RSA_PKCS1_OAEP_PADDING','randomBytes','utf-8','exports','crypto','1474360HrmbBG','4221370cbhsIf','RSA_PKCS1_PADDING','V2|','final','toString','3foXGpn','digest','slice','-----BEGIN\\x20PUBLIC\\x20KEY-----\\x0a','utf8'];
  a0_0x1e87=function(){return _0x277606;};
  return a0_0x1e87();
}

function a0_0x3d1e(idx, _) {
  const arr = a0_0x1e87();
  a0_0x3d1e = function(i, _2) {
    i = i - 0xd0;
    return arr[i];
  };
  return a0_0x3d1e(idx, _);
}

// 먼저 배열 회전을 시뮬레이션
(function(getArr, target) {
  const arr = getArr();
  while (true) {
    try {
      const val = -parseInt(a0_0x3d1e(0xf6))/1 + -parseInt(a0_0x3d1e(0xe5))/2*(-parseInt(a0_0x3d1e(0xd7))/3) + -parseInt(a0_0x3d1e(0xd1))/4 + parseInt(a0_0x3d1e(0x103))/5*(-parseInt(a0_0x3d1e(0x101))/6) + parseInt(a0_0x3d1e(0xf1))/7*(parseInt(a0_0x3d1e(0xdc))/8) + -parseInt(a0_0x3d1e(0xfb))/9 + parseInt(a0_0x3d1e(0xd2))/10*(parseInt(a0_0x3d1e(0x100))/11);
      if (val === target) break;
      else arr.push(arr.shift());
    } catch (e) {
      arr.push(arr.shift());
    }
  }
})(a0_0x1e87, 0xb4f0f);

// 핵심 상수 값 출력
console.log("========== 벤더 라이브러리 난독화 해독 결과 ==========\n");

const hexCodes = [0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xdb, 0xdc, 0xdd, 0xde, 0xdf, 0xe0, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xeb, 0xec, 0xed, 0xee, 0xef, 0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff, 0x100, 0x101, 0x102, 0x103, 0x104, 0x105, 0x106, 0x107, 0x108];

for (const code of hexCodes) {
  try {
    const val = a0_0x3d1e(code);
    console.log(`0x${code.toString(16).padStart(2, '0')} => "${val}"`);
  } catch(e) {
    console.log(`0x${code.toString(16).padStart(2, '0')} => [ERROR]`);
  }
}

console.log("\n========== RSAEncrypt 메서드 해독 ==========");
console.log(`RSAEncrypt 함수명:     ${a0_0x3d1e(0xed)}`);
console.log(`사용 암호화 함수:       crypto.privateEncrypt 사용`);
console.log(`패딩 상수:              crypto.constants.${a0_0x3d1e(0xd3)}`);
console.log(`평문 접두사:            "${a0_0x3d1e(0xd4)}"`);
console.log(`인코딩(input):         ${a0_0x3d1e(0xdb)}`);
console.log(`출력 인코딩:            ${a0_0x3d1e(0x104)}`);

console.log("\n========== RSAEncrypt 의사코드(pseudocode) ==========");
console.log(`
RSAEncrypt(plainText) {
  return crypto.privateEncrypt(
    { key: privateKey, padding: crypto.constants.${a0_0x3d1e(0xd3)} },
    Buffer.from("${a0_0x3d1e(0xd4)}" + plainText, "${a0_0x3d1e(0xdb)}")
  ).toString("${a0_0x3d1e(0x104)}");
}
`);

console.log("========== getResult 메서드 해독 ==========");
console.log(`getResult 함수명:      ${a0_0x3d1e(0xf7)}`);
console.log(`사용 복호화 함수:       crypto.${a0_0x3d1e(0xdd)}`);
console.log(`패딩 상수:              crypto.constants.${a0_0x3d1e(0x105)}`);
console.log(`OAEP 해시:              ${a0_0x3d1e(0xeb)}`);

console.log("\n========== 가이드 소스와 비교 ==========");
console.log("가이드 mok_server_std.js 84행: clientTxId = clientTxId + '|' + getCurrentDate()");
console.log("가이드 mok_server_std.js 87행: encClientTxId = mobileOK.RSAEncrypt(clientTxId)");
console.log("");
console.log("즉, RSAEncrypt의 입력은: 'clientTxId|YYYYMMDDHHmmss' 형태의 문자열");
console.log("RSAEncrypt 내부에서: 'V2|' + 'clientTxId|YYYYMMDDHHmmss' = 'V2|clientTxId|YYYYMMDDHHmmss'");
console.log("암호화 방식: crypto.privateEncrypt (이용기관 개인키, RSA_PKCS1_PADDING)");
console.log("");
console.log("⚠️ 중요: 이것은 publicEncrypt(서버 공개키, RSA_OAEP)와 완전히 다른 방식입니다!");
