/** Normalize the refined transparent artwork without changing the source PNGs.
 * Each pose shares a foot anchor; sword bounds never determine the actor position. */
import { ASSET_REGISTRY } from "./asset-registry";
export function normalizeChapterAtlas(name: string, image: HTMLImageElement): HTMLImageElement | HTMLCanvasElement {
  if (name !== 'kharn' && name !== 'ruin-props') return image;
  const canvas = document.createElement('canvas');
  const boss = name === 'kharn';
  const contract = boss ? ASSET_REGISTRY.kharn.normalization : ASSET_REGISTRY["ruin-props"].normalization;
  const [cw, ch] = contract.cell;
  canvas.width = cw * 8;
  canvas.height = ch * (boss ? 3 : 1);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  contract.rects.forEach(([x,y,w,h], i) => {
    const col = i % 8, row = Math.floor(i / 8);
    const scale = contract.scales[i];
    const fx = boss ? ASSET_REGISTRY.kharn.normalization.footXs[col] : x + w / 2;
    const fy = boss ? ASSET_REGISTRY.kharn.normalization.footYs[row][col] : y + h - 8;
    // Padding retains glow. Cell clipping prevents adjacent poses bleeding.
    ctx.save();
    ctx.beginPath(); ctx.rect(col*cw,row*ch,cw,ch); ctx.clip();
    ctx.drawImage(image,x-3,y-3,w+6,h+6,
      col*cw + cw/2 - (fx-x+3)*scale,
      row*ch + contract.pivot[1] - (fy-y+3)*scale,
      (w+6)*scale,(h+6)*scale);
    ctx.restore();
  });
  return canvas;
}
