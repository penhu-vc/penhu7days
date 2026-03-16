import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

  // 載入截圖
  await page.setContent(`
    <html>
      <body style="margin:0;padding:0;background:#0a0a0a;">
        <img src="file:///Users/yaja/projects/penhu7days/public/section2-reference.png" style="width:100%;">
      </body>
    </html>
  `);
  await page.waitForTimeout(1000);

  // 裁切右側人物區域
  await page.screenshot({
    path: './public/hero-image-2.png',
    clip: { x: 520, y: 30, width: 380, height: 440 }
  });

  console.log('已裁切 hero-image-2.png');
  await browser.close();
}

main().catch(console.error);
