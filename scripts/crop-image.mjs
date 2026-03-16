import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 載入用戶截圖
  await page.goto(`file:///Users/yaja/projects/penhu7days/public/section2-reference.png`);
  await page.waitForTimeout(1000);

  // 截取右側人物區域 (大約從 x=550 開始)
  await page.screenshot({
    path: './public/hero-image-2.png',
    clip: { x: 480, y: 50, width: 400, height: 420 }
  });

  console.log('已裁切 hero-image-2.png');
  await browser.close();
}

main().catch(console.error);
