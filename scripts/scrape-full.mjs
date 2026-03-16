import { chromium } from 'playwright';

const URL = 'https://sites.google.com/view/penhu7days/penhu-交易聯盟-新手七天陪跑課';

async function main() {
  console.log('啟動瀏覽器...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  console.log('載入頁面...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  // 滾動到底部以載入所有內容
  console.log('滾動頁面...');
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });

  await page.waitForTimeout(2000);

  // 回到頂部
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  // 截取完整頁面
  console.log('截取完整頁面...');
  await page.screenshot({
    path: '/Users/yaja/Downloads/截圖/penhu7days_full_scroll.png',
    fullPage: true
  });

  // 取得所有文字
  const allText = await page.evaluate(() => {
    return document.body.innerText;
  });

  console.log('\n=== 頁面完整文字 ===\n');
  console.log(allText);

  await browser.close();
}

main().catch(console.error);
