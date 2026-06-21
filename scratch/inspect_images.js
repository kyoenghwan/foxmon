const fs = require('fs');
const path = require('path');

function getPngSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  // PNG 파일 헤더 검증
  if (buffer.toString('ascii', 1, 8) !== 'PNG\r\n\x1a\n') {
    throw new Error('Not a valid PNG file');
  }
  // IHDR 세그먼트는 12번째 바이트부터 시작함. width는 16~19, height는 20~23 바이트
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

try {
  const bottomPath = path.join(__dirname, '..', 'public', 'images', 'playground', 'random_box_bottom.png');
  const topPath = path.join(__dirname, '..', 'public', 'images', 'playground', 'random_box_top.png');

  console.log('Bottom Size:', getPngSize(bottomPath));
  console.log('Top Size:', getPngSize(topPath));
} catch (err) {
  console.error(err);
}
