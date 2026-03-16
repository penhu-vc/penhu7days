import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const URL = 'https://sites.google.com/view/penhu7days/penhu-交易聯盟-新手七天陪跑課';

async function main() {
  console.log('啟動瀏覽器...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  console.log('載入頁面...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);

  // 取得所有可能的圖片來源
  const allSources = await page.evaluate(() => {
    const sources = [];

    // 1. img 標籤
    document.querySelectorAll('img').forEach(img => {
      if (img.src) sources.push({ type: 'img', src: img.src });
    });

    // 2. background-image
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundImage;
      if (bg && bg !== 'none') {
        const match = bg.match(/url\("?([^"]+)"?\)/);
        if (match) sources.push({ type: 'bg', src: match[1] });
      }
    });

    // 3. picture source
    document.querySelectorAll('source').forEach(source => {
      if (source.srcset) sources.push({ type: 'srcset', src: source.srcset });
    });

    // 4. data-src (lazy loading)
    document.querySelectorAll('[data-src]').forEach(el => {
      sources.push({ type: 'data-src', src: el.dataset.src });
    });

    return sources;
  });

  console.log(`\n找到 ${allSources.length} 個圖片來源：`);
  allSources.forEach((s, i) => {
    console.log(`${i + 1}. [${s.type}] ${s.src.substring(0, 100)}...`);
  });

  // 取得頁面完整 HTML
  const html = await page.content();
  writeFileSync('./scripts/page-content.html', html);
  console.log('\n已儲存完整 HTML 到 scripts/page-content.html');

  // 找到並截取主要圖片區域
  console.log('\n嘗試截取頁面元素...');

  // 截取右側區域（圖片所在位置）
  const rightArea = await page.screenshot({
    clip: { x: 720, y: 100, width: 600, height: 700 }
  });
  writeFileSync('./public/hero-image.png', rightArea);
  console.log('已截取右側區域作為 hero-image.png');

  await browser.close();
  console.log('\n完成！');
}

main().catch(console.error);
