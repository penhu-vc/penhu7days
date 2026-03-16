import sharp from 'sharp';

// 原圖 2840x1420，人物在右側約 1/3 處
// 人物大約從 x=1600 開始
await sharp('./public/section2-reference.png')
  .extract({ left: 1500, top: 100, width: 1200, height: 1200 })
  .toFile('./public/hero-image-2.png');

console.log('已裁切 hero-image-2.png');
