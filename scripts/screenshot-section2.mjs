import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 滾動到報名表單區域
  await page.evaluate(() => {
    document.querySelector('#signup')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: '/Users/yaja/Downloads/截圖/penhu7days_signup.png'
  });

  console.log('截圖完成！');
  await browser.close();
}

main().catch(console.error);
