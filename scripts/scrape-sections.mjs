import { chromium } from 'playwright';

const URL = 'https://sites.google.com/view/penhu7days/penhu-交易聯盟-新手七天陪跑課';

async function main() {
  console.log('啟動瀏覽器...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 2000 }  // 更高的視窗
  });

  console.log('載入頁面...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);

  // 取得頁面高度
  const height = await page.evaluate(() => document.body.scrollHeight);
  console.log(`頁面高度: ${height}px`);

  // 分段截圖
  for (let i = 0; i < 5; i++) {
    const scrollY = i * 800;
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `/Users/yaja/Downloads/截圖/penhu7days_section_${i}.png`,
      fullPage: false
    });
    console.log(`截取 section ${i} (scroll: ${scrollY}px)`);
  }

  await browser.close();
  console.log('\n完成！');
}

main().catch(console.error);
