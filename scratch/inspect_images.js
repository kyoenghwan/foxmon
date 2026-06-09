const sharp = require('sharp');
const path = require('path');

async function inspect() {
  const images = ['logo.png', 'logo2.png', 'foxmon_log.png'];
  for (const img of images) {
    const filePath = path.join(__dirname, '..', 'public', img);
    try {
      const metadata = await sharp(filePath).metadata();
      console.log(`[${img}] Width: ${metadata.width}, Height: ${metadata.height}, Format: ${metadata.format}`);
    } catch (err) {
      console.error(`Error inspecting ${img}:`, err.message);
    }
  }
}

inspect();
