import { chromium } from 'playwright';

const URL = 'https://sites.google.com/view/penhu7days/penhu-交易聯盟-新手七天陪跑課';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  // 滾動到第二區塊
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(2000);

  // 截取第二區塊的圖片
  const rightArea = await page.screenshot({
    clip: { x: 720, y: 100, width: 600, height: 700 }
  });
  require('fs').writeFileSync('./public/hero-image-2.png', rightArea);
  console.log('已截取第二張人物圖');

  await browser.close();
}

main().catch(console.error);
