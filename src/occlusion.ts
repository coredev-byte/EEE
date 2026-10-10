import { FRAMES, spriteBounds, type Point } from "./spatial";
import type { Assets } from "./assets";
export interface VisibilityTarget {
  id: string;
  foot: Point;
  depth: number;
  height: number;
  width: number;
}
interface Hole {
  x: number;
  y: number;
  rx: number;
  ry: number;
  amount: number;
}
/** Alpha masks are cached once per atlas frame. Only overlapping foreground props are composited. */
export class Occlusion {
  private masks = new Map<
    string,
    { canvas: HTMLCanvasElement; alpha: Uint8ClampedArray }
  >();
  private holes = new Map<string, Map<string, Hole>>();
  private scratch = document.createElement("canvas");
  constructor(private assets: Assets) {
    this.scratch.width = 128;
    this.scratch.height = 160;
  }
  reset() {
    this.holes.clear();
  }
  draw(
    c: CanvasRenderingContext2D,
    id: string,
    atlas: string,
    col: number,
    foot: Point,
    scale: number,
    depth: number,
    targets: VisibilityTarget[],
    dt: number,
  ) {
    const bounds = spriteBounds(foot, FRAMES.prop, scale);
    const key = `${atlas}:${col}`;
    let mask = this.masks.get(key);
    if (!mask) {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 160;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(
        this.assets.images[atlas],
        col * 128,
        0,
        128,
        160,
        0,
        0,
        128,
        160,
      );
      mask = { canvas, alpha: ctx.getImageData(0, 0, 128, 160).data };
      this.masks.set(key, mask);
    }
    let holes = this.holes.get(id);
    if (!holes) {
      holes = new Map();
      this.holes.set(id, holes);
    }
    const active = new Set<string>();
    for (const t of targets) {
      if (
        depth <= t.depth ||
        t.foot.x + t.width / 2 < bounds.x ||
        t.foot.x - t.width / 2 > bounds.x + bounds.width ||
        t.foot.y - t.height > bounds.y + bounds.height ||
        t.foot.y < bounds.y
      )
        continue;
      // Sample actual opaque art within the target's torso/head, ignoring transparent atlas margins.
      let covered = false;
      for (let y = t.foot.y - t.height; y < t.foot.y - 8 && !covered; y += 8)
        for (
          let x = t.foot.x - t.width / 2;
          x <= t.foot.x + t.width / 2;
          x += 6
        ) {
          const sx = Math.floor((x - bounds.x) / scale),
            sy = Math.floor((y - bounds.y) / scale);
          if (
            sx >= 0 &&
            sx < 128 &&
            sy >= 0 &&
            sy < 160 &&
            mask.alpha[(sy * 128 + sx) * 4 + 3] > 80
          ) {
            covered = true;
            break;
          }
        }
      if (!covered) continue;
      active.add(t.id);
      let h = holes.get(t.id);
      if (!h) {
        h = { x: 0, y: 0, rx: 1, ry: 1, amount: 0 };
        holes.set(t.id, h);
      }
      h.x = (t.foot.x - bounds.x) / scale;
      h.y = (t.foot.y - t.height / 2 - bounds.y) / scale;
      h.rx = (t.width / 2 + 18) / scale;
      h.ry = (t.height / 2 + 16) / scale;
    }
    const blend = 1 - Math.exp(-Math.min(dt, 0.1) * 14);
    for (const [id, h] of holes) {
      h.amount += ((active.has(id) ? 0.94 : 0) - h.amount) * blend;
      if (!active.has(id) && h.amount < 0.005) holes.delete(id);
    }
    if (!holes.size) {
      this.assets.draw(c, atlas, col, 0, 128, 160, foot.x, foot.y, scale);
      return;
    }
    const out = this.scratch.getContext("2d")!;
    out.clearRect(0, 0, 128, 160);
    out.drawImage(mask.canvas, 0, 0);
    for (const h of holes.values()) {
      out.save();
      out.globalCompositeOperation = "destination-out";
      out.translate(h.x, h.y);
      out.scale(h.rx, h.ry);
      const gradient = out.createRadialGradient(0, 0, 0.65, 0, 0, 1);
      gradient.addColorStop(0, `rgba(0,0,0,${h.amount})`);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      out.fillStyle = gradient;
      out.fillRect(-1, -1, 2, 2);
      out.restore();
    }
    c.drawImage(
      this.scratch,
      Math.round(bounds.x),
      Math.round(bounds.y),
      Math.round(bounds.width),
      Math.round(bounds.height),
    );
  }
}
