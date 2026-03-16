import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 訪問 Linear
  await page.goto('https://linear.app/', { waitUntil: 'networkidle' });
  
  // 等待動畫載入
  await page.waitForTimeout(3000);
  
  // 截圖首頁
  await page.screenshot({ 
    path: '/tmp/linear_homepage.png',
    fullPage: false
  });
  
  console.log('Screenshot saved to /tmp/linear_homepage.png');
  await browser.close();
})();
