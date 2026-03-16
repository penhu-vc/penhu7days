import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 截圖 Hero Section 1 (女生)
  await page.screenshot({
    path: '/Users/yaja/Downloads/截圖/penhu7days_hero1.png'
  });
  console.log('Hero 1 截圖完成！');

  // 滾動到第三區塊 (男生)
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight - window.innerHeight);
  });
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: '/Users/yaja/Downloads/截圖/penhu7days_hero2.png'
  });
  console.log('Hero 2 截圖完成！');

  await browser.close();
}

main().catch(console.error);
