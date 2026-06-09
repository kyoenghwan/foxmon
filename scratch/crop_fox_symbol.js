const sharp = require('sharp');
const path = require('path');

async function crop() {
  const srcPath = path.join(__dirname, '..', 'public', 'logo.png');
  const destPath = path.join(__dirname, '..', 'app', 'icon.png');

  try {
    const metadata = await sharp(srcPath).metadata();
    
    // 가로형 로고의 세로 높이(Height)를 기준으로 좌측 정사각형 영역을 잘라냄
    const size = metadata.height;

    await sharp(srcPath)
      .extract({ left: 0, top: 0, width: size, height: size }) // 좌측 여우 마크 영역 크롭
      .resize(64, 64) // 브라우저 탭 아이콘 최적 규격(64x64)으로 축소 리사이즈
      .toFile(destPath);

    console.log('✅ 여우 심볼 크롭 및 app/icon.png 저장 성공!');
  } catch (err) {
    console.error('❌ 크롭 에러 발생:', err.message);
  }
}

crop();
