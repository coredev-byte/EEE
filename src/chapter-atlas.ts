/** Normalize the refined transparent artwork without changing the source PNGs.
 * Each pose shares a foot anchor; sword bounds never determine the actor position. */
type Rect = readonly [number, number, number, number];
const kharnRects: Rect[] = [
 [13,49,255,201],[273,48,239,202],[524,51,280,204],[808,52,265,201],
 [1116,11,202,241],[1325,57,316,204],[1643,49,256,206],[1889,86,269,187],
 [13,277,255,203],[273,276,239,204],[524,277,280,207],[809,276,265,206],
 [1116,253,198,227],[1324,289,317,200],[1643,276,257,208],[1889,321,269,183],
 [13,505,254,201],[273,504,239,202],[524,505,281,205],[808,503,265,204],
 [1115,481,200,229],[1325,515,316,200],[1644,504,255,206],[1889,547,269,177],
];
const footXs = [178,426,703,982,1222,1522,1811,2088];
const footYs = [
 [248,248,252,251,248,256,252,260],
 [477,477,480,479,477,485,480,496],
 [704,704,708,706,708,711,708,718],
];
const propRects: Rect[] = [
  [40,247,197,310],[296,281,227,296],[564,281,226,297],[832,207,236,370],
  [1123,337,198,222],[1380,331,228,245],[1656,376,214,203],[1924,393,219,175],
];
export function normalizeChapterAtlas(name: string, image: HTMLImageElement): HTMLImageElement | HTMLCanvasElement {
  if (name !== 'kharn' && name !== 'ruin-props') return image;
  const canvas = document.createElement('canvas');
  const boss = name === 'kharn';
  const cw = boss ? 320 : 128, ch = boss ? 256 : 160;
  canvas.width = cw * 8;
  canvas.height = ch * (boss ? 3 : 1);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  (boss ? kharnRects : propRects).forEach(([x,y,w,h], i) => {
    const col = i % 8, row = Math.floor(i / 8);
    const scale = boss ? 0.72 : [0.44,0.40,0.40,0.40,0.40,0.40,0.36,0.32][i];
    const fx = boss ? footXs[col] : x + w / 2;
    const fy = boss ? footYs[row][col] : y + h - 8;
    // Padding retains glow. Cell clipping prevents adjacent poses bleeding.
    ctx.save();
    ctx.beginPath(); ctx.rect(col*cw,row*ch,cw,ch); ctx.clip();
    ctx.drawImage(image,x-3,y-3,w+6,h+6,
      col*cw + cw/2 - (fx-x+3)*scale,
      row*ch + (boss ? 220 : 156) - (fy-y+3)*scale,
      (w+6)*scale,(h+6)*scale);
    ctx.restore();
  });
  return canvas;
}
