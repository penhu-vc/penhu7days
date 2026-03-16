import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import https from 'https';
import http from 'http';

const URL = 'https://sites.google.com/view/penhu7days/penhu-交易聯盟-新手七天陪跑課';

async function downloadImage(imageUrl, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https') ? https : http;
    protocol.get(imageUrl, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        downloadImage(response.headers.location, outputPath).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        writeFileSync(outputPath, buffer);
        console.log(`Downloaded: ${outputPath}`);
        resolve();
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('啟動瀏覽器...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  console.log('載入頁面...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  // 找到所有圖片
  const images = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    return Array.from(imgs).map(img => ({
      src: img.src,
      alt: img.alt,
      width: img.naturalWidth,
      height: img.naturalHeight
    })).filter(img => img.width > 100 && img.height > 100);
  });

  console.log(`找到 ${images.length} 張圖片`);

  // 確保 public 目錄存在
  mkdirSync('./public', { recursive: true });

  // 下載最大的圖片作為 hero image
  if (images.length > 0) {
    // 按大小排序
    images.sort((a, b) => (b.width * b.height) - (a.width * a.height));

    console.log('圖片列表：');
    images.forEach((img, i) => {
      console.log(`${i + 1}. ${img.width}x${img.height}: ${img.src.substring(0, 80)}...`);
    });

    // 下載最大的圖片
    const heroImage = images[0];
    console.log(`\n下載 hero image: ${heroImage.src}`);

    try {
      await downloadImage(heroImage.src, './public/hero-image.png');
    } catch (err) {
      console.log('直接下載失敗，嘗試用 Playwright 截取...');

      // 用 Playwright 截取圖片元素
      const imgElement = await page.$('img');
      if (imgElement) {
        await imgElement.screenshot({ path: './public/hero-image.png' });
        console.log('已截取圖片元素');
      }
    }
  }

  // 額外：截取整個 hero section
  const heroSection = await page.$('section, div[role="main"], main');
  if (heroSection) {
    await heroSection.screenshot({ path: './public/hero-section.png' });
    console.log('已截取 hero section');
  }

  await browser.close();
  console.log('\n完成！');
}

main().catch(console.error);
