// Renderiza index.html em MP4 1080x1920 30fps, quadro a quadro.
// Uso: node render.mjs [saida.mp4] [--from=seg] [--to=seg] [--fps=30]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const out = process.argv.slice(2).find(a => !a.startsWith('--')) || path.join(dir, 'dona-do-pedaco.mp4');
const fps = Number(args.fps || 30);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(path.join(dir, 'index.html')).href + '?render');
await page.waitForFunction(() => window.READY === true);
await page.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
const duration = await page.evaluate(() => window.DURATION);
const from = Number(args.from || 0), to = Number(args.to || duration);

const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', out],
  { stdio: ['pipe', 'inherit', 'inherit'] });

const stage = page.locator('#stage');
const total = Math.round((to - from) * fps);
for (let f = 0; f < total; f++) {
  await page.evaluate(t => window.seek(t), from + f / fps);
  const buf = await stage.screenshot({ type: 'jpeg', quality: 92 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % 60 === 0) process.stdout.write(`\r${f}/${total}`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close();
console.log(`\nok: ${out}`);
