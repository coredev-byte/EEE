import { normalizeChapterAtlas } from "./chapter-atlas";
import { framePivot } from "./spatial";
import { RUNTIME_ASSETS, assertSourceDimensions } from "./asset-registry";
export class Assets {
  images: Record<string, HTMLImageElement | HTMLCanvasElement> = {};
  async load() {
    await Promise.all(
      RUNTIME_ASSETS.map(async ({ name, path }) => {
        const im = new Image();
        im.src = `/assets/${path}`;
        await im.decode();
        assertSourceDimensions(name, im.naturalWidth, im.naturalHeight);
        this.images[name] = normalizeChapterAtlas(name, im);
      }),
    );
  }
  draw(
    ctx: CanvasRenderingContext2D,
    name: string,
    col: number,
    row: number,
    cw: number,
    ch: number,
    x: number,
    y: number,
    scale = 1,
    flip = false,
  ) {
    const im = this.images[name];
    if (!im) return;
    const pivot = framePivot(cw, ch);
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(
      im,
      col * cw,
      row * ch,
      cw,
      ch,
      Math.round(-pivot.x * scale),
      Math.round(-pivot.y * scale),
      Math.round(cw * scale),
      Math.round(ch * scale),
    );
    ctx.restore();
  }
  icon(
    ctx: CanvasRenderingContext2D,
    index: number,
    x: number,
    y: number,
    size = 32,
  ) {
    ctx.drawImage(
      this.images.icons,
      index * 48,
      0,
      48,
      48,
      Math.round(x),
      Math.round(y),
      size,
      size,
    );
  }
}
