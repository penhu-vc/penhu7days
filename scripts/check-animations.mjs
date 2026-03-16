import { chromium } from 'playwright';

const URL = 'https://sites.google.com/view/penhu7days/penhu-交易聯盟-新手七天陪跑課';

async function main() {
  const browser = await chromium.launch({ headless: false }); // 用有頭模式看動畫
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });

  // 等待觀察動畫
  console.log('觀察頁面動畫 10 秒...');

  // 錄製頁面滾動
  for (let i = 0; i < 5; i++) {
    await page.screenshot({
      path: `/Users/yaja/Downloads/截圖/animation_frame_${i}.png`
    });
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(500);
  }

  // 取得所有 CSS 動畫
  const animations = await page.evaluate(() => {
    const styles = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          const text = rule.cssText;
          if (text.includes('animation') || text.includes('transition') || text.includes('@keyframes')) {
            styles.push(text.substring(0, 200));
          }
        }
      } catch (e) {}
    }
    return styles;
  });

  console.log('\n=== 找到的動畫 ===');
  animations.forEach(a => console.log(a));

  await browser.close();
}

main().catch(console.error);
