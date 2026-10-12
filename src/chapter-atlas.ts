/** Normalize the refined transparent artwork without changing the source PNGs.
 * Each pose shares a foot anchor; sword bounds never determine the actor position. */
type Rect = readonly [number, number, number, number];
const kharnRects: Rect[] = [
  [71,84,138,178],[342,84,138,179],[614,82,137,179],[885,84,138,179],
  [1149,81,144,205],[1334,84,234,174],[1700,84,138,179],[1887,104,236,155],
  [71,286,138,179],[342,286,137,179],[613,286,138,178],[885,286,138,180],
  [1149,284,144,205],[1334,286,234,175],[1700,286,138,179],[1887,306,236,157],
  [71,491,138,179],[342,491,138,179],[614,491,137,179],[885,491,138,180],
  [1149,488,144,206],[1334,491,234,175],[1700,491,138,179],[1887,511,236,156],
];
const footXs = [140,411,683,954,1222,1496,1769,2040];
const footYs = [
  [255,256,255,255,255,256,255,257],
  [457,457,457,458,457,459,457,460],
  [662,663,663,663,662,665,662,665],
];
const propRects: Rect[] = [
  [40,247,197,310],[296,281,227,296],[564,281,226,297],[832,207,236,370],
  [1123,337,198,222],[1380,331,228,245],[1656,376,214,203],[1924,393,219,175],
];
export function normalizeChapterAtlas(name: string, image: HTMLImageElement): HTMLImageElement | HTMLCanvasElement {
  if (name !== 'kharn' && name !== 'ruin-props') return image;
  const canvas = document.createElement('canvas');
  const boss = name === 'kharn';
  const cw = boss ? 256 : 128, ch = boss ? 224 : 160;
  canvas.width = cw * 8;
  canvas.height = ch * (boss ? 3 : 1);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  (boss ? kharnRects : propRects).forEach(([x,y,w,h], i) => {
    const col = i % 8, row = Math.floor(i / 8);
    const scale = boss ? 0.78 : [0.44,0.40,0.40,0.40,0.40,0.40,0.36,0.32][i];
    const fx = boss ? footXs[col] : x + w / 2;
    const fy = boss ? footYs[row][col] : y + h - 8;
    // Padding retains glow. Cell clipping prevents adjacent poses bleeding.
    ctx.save();
    ctx.beginPath(); ctx.rect(col*cw,row*ch,cw,ch); ctx.clip();
    ctx.drawImage(image,x-3,y-3,w+6,h+6,
      col*cw + cw/2 - (fx-x+3)*scale,
      row*ch + (boss ? 188 : 156) - (fy-y+3)*scale,
      (w+6)*scale,(h+6)*scale);
    ctx.restore();
  });
  return canvas;
}
