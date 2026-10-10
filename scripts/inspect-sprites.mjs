import { chromium } from '@playwright/test';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:5173');
await page.evaluate(async () => {
  const names = ['hero', ...['arcanista', 'assassino', 'atirador'].flatMap(name => [name, `${name}-directions`, `${name}-combat`])];
  const images = await Promise.all(names.map(async name => {
    const image = new Image();
    image.src = `/assets/characters/${name}.png`;
    await image.decode();
    return { name, image };
  }));
  const canvas = document.createElement('canvas');
  canvas.width = 1152;
  canvas.height = images.reduce((sum, { image }) => sum + image.height + 28, 0);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  let y = 0;
  for (const { name, image } of images) {
    ctx.fillStyle = '#071019';
    ctx.fillRect(0, y, canvas.width, 28);
    ctx.fillStyle = '#f3d397';
    ctx.font = '16px monospace';
    ctx.fillText(name, 12, y + 20);
    y += 28;
    for (let cy = 0; cy < image.height; cy += 8) {
      for (let x = 0; x < canvas.width; x += 8) {
        ctx.fillStyle = ((x + cy) / 8) % 2 ? '#50606d' : '#283845';
        ctx.fillRect(x, y + cy, 8, 8);
      }
    }
    ctx.drawImage(image, 0, y);
    y += image.height;
  }
  document.body.replaceChildren(canvas);
  document.body.style.cssText = 'margin:0; background:#071019;';
  canvas.style.cssText = 'display:block;width:1152px;height:auto;';
});
await page.locator('canvas').screenshot({ path: 'artifacts/sprites-clean.png' });
await browser.close();
