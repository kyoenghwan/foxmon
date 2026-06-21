const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // 400x400 크기의 정밀 캡처를 위해 뷰포트 설정
  await page.setViewportSize({ width: 400, height: 400 });

  console.log('Logging in...');
  await page.goto('http://localhost:3000/login');
  
  // 로그인 폼 입력 및 전송 (readonly 방지 위해 focus 후 keyboard 타이핑)
  await page.focus('#loginId');
  await page.keyboard.type('kyoenghwan');
  await page.focus('#password');
  await page.keyboard.type('rudghks1');
  await page.click('button[type="submit"]');
  
  // 대시보드 리다이렉트 대기
  await page.waitForTimeout(3000);
  console.log('Login completed.');

  const amounts = [10, 50, 100, 500, 1000];

  for (const amount of amounts) {
    const url = `http://localhost:3000/render-banners?type=luckybox&amount=${amount}`;
    console.log(`Navigating to ${url}...`);
    
    await page.goto(url);
    await page.waitForTimeout(2000); // 렌더링 대기
    
    const destPath = path.join(__dirname, '..', 'public', 'images', 'playground', `luckybox_win_banner_${amount}.png`);
    
    // 400x400 통째로 캡처하여 저장
    await page.screenshot({
      path: destPath,
      clip: { x: 0, y: 0, width: 400, height: 400 }
    });
    
    console.log(`Saved: luckybox_win_banner_${amount}.png`);
  }

  await browser.close();
  console.log('Done.');
})();
