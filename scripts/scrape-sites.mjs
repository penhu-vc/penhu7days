import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const URL = 'https://sites.google.com/view/penhu7days/penhu-交易聯盟-新手七天陪跑課';
const OUTPUT_DIR = '/Users/yaja/Downloads/截圖';

async function main() {
  console.log('啟動瀏覽器...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  console.log('載入頁面...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });

  // 等待額外時間讓動畫完成
  await page.waitForTimeout(3000);

  // 截取完整頁面
  console.log('截取完整頁面...');
  await page.screenshot({
    path: `${OUTPUT_DIR}/penhu7days_fullpage.png`,
    fullPage: true
  });

  // 截取首屏
  console.log('截取首屏...');
  await page.screenshot({
    path: `${OUTPUT_DIR}/penhu7days_viewport.png`,
    fullPage: false
  });

  // 取得渲染後的 HTML
  console.log('取得 HTML 結構...');
  const html = await page.content();

  // 取得所有文字內容
  const textContent = await page.evaluate(() => {
    const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, li');
    const texts = [];
    elements.forEach(el => {
      const text = el.textContent?.trim();
      if (text && text.length > 0 && text.length < 500) {
        texts.push(text);
      }
    });
    return [...new Set(texts)].join('\n');
  });

  console.log('\n=== 頁面文字內容 ===\n');
  console.log(textContent);

  // 取得所有圖片
  const images = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    return Array.from(imgs).map(img => ({
      src: img.src,
      alt: img.alt,
      width: img.width,
      height: img.height
    }));
  });

  console.log('\n=== 圖片資訊 ===\n');
  images.forEach(img => {
    console.log(`- ${img.alt || '無 alt'}: ${img.src.substring(0, 100)}...`);
  });

  // 取得主要樣式/顏色
  const styles = await page.evaluate(() => {
    const body = document.body;
    const computed = window.getComputedStyle(body);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      fontFamily: computed.fontFamily
    };
  });

  console.log('\n=== 樣式資訊 ===\n');
  console.log(styles);

  await browser.close();
  console.log('\n完成！截圖已存到:', OUTPUT_DIR);
}

main().catch(console.error);
