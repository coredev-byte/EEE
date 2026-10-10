import type { Point } from "./spatial";
export type ObjectiveKind =
  "talk" | "investigate" | "collect" | "defeat" | "interact" | "reach";
/** Position is the current actor/object position, never a decorative map coordinate. */
export interface Objective extends Point {
  category?: "main" | "secondary";
  id: string;
  kind: ObjectiveKind;
  label: string;
  height: number;
}
export function edgeIndicator(
  point: Point,
  width: number,
  height: number,
  margins = { left: 24, right: 24, top: 24, bottom: 24 },
) {
  const center = { x: width / 2, y: height / 2 };
  const dx = point.x - center.x,
    dy = point.y - center.y;
  const inside =
    point.x >= margins.left &&
    point.x <= width - margins.right &&
    point.y >= margins.top &&
    point.y <= height - margins.bottom;
  if (inside) return { ...point, angle: Math.atan2(dy, dx), outside: false };
  const tx =
    dx > 0
      ? (width - margins.right - center.x) / dx
      : dx < 0
        ? (margins.left - center.x) / dx
        : Infinity;
  const ty =
    dy > 0
      ? (height - margins.bottom - center.y) / dy
      : dy < 0
        ? (margins.top - center.y) / dy
        : Infinity;
  const t = Math.min(tx, ty);
  return {
    x: center.x + dx * t,
    y: center.y + dy * t,
    angle: Math.atan2(dy, dx),
    outside: true,
  };
}
export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
/** Keep the icon and its arrow outside measured HUD panels at every viewport scale. */
export function placeObjective(
  point: Point,
  width: number,
  height: number,
  blockers: ScreenRect[] = [],
) {
  let at = edgeIndicator(point, width, height, {
    left: 26,
    right: 26,
    top: 26,
    bottom: 78,
  });
  const pad = 26;
  const overlaps = (p: Point, b: ScreenRect) =>
    p.x > b.x - pad &&
    p.x < b.x + b.width + pad &&
    p.y > b.y - pad &&
    p.y < b.y + b.height + pad;
  const clamp = (p: Point) => ({
    x: Math.max(26, Math.min(width - 26, p.x)),
    y: Math.max(26, Math.min(height - 78, p.y)),
  });
  for (let pass = 0; pass < blockers.length; pass++) {
    const b = blockers.find((b) => overlaps(at, b));
    if (!b) break;
    const candidates = [
      { x: b.x - pad, y: at.y },
      { x: b.x + b.width + pad, y: at.y },
      { x: at.x, y: b.y - pad },
      { x: at.x, y: b.y + b.height + pad },
    ]
      .map(clamp)
      .filter((p) => !blockers.some((b) => overlaps(p, b)))
      .sort(
        (a, b) =>
          Math.hypot(a.x - at.x, a.y - at.y) -
          Math.hypot(b.x - at.x, b.y - at.y),
      );
    const p = candidates[0];
    if (!p) break;
    at = {
      ...p,
      outside: true,
      angle: Math.atan2(point.y - p.y, point.x - p.x),
    };
  }
  return at;
}
/** Pixel-art HUD symbols: speech, lens, gem, crossed blades, mechanism and route. */
export function objectiveIcon(
  c: CanvasRenderingContext2D,
  kind: ObjectiveKind,
  x: number,
  y: number,
  size = 12,
  color = "#e8bd68",
) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(size / 12, size / 12);
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = 2;
  c.beginPath();
  if (kind === "talk") {
    c.rect(-6, -5, 12, 8);
    c.moveTo(-3, 3);
    c.lineTo(-3, 7);
    c.lineTo(1, 3);
  } else if (kind === "investigate") {
    c.arc(-1, -1, 4, 0, Math.PI * 2);
    c.moveTo(2, 2);
    c.lineTo(6, 6);
  } else if (kind === "collect") {
    c.moveTo(0, -7);
    c.lineTo(6, 0);
    c.lineTo(0, 7);
    c.lineTo(-6, 0);
    c.closePath();
  } else if (kind === "defeat") {
    c.moveTo(-6, -6);
    c.lineTo(6, 6);
    c.moveTo(6, -6);
    c.lineTo(-6, 6);
    c.moveTo(-6, 2);
    c.lineTo(-2, 6);
    c.moveTo(2, 6);
    c.lineTo(6, 2);
  } else if (kind === "interact") {
    c.rect(-5, -5, 10, 10);
    c.moveTo(0, -3);
    c.lineTo(0, 3);
    c.moveTo(-3, 0);
    c.lineTo(3, 0);
  } else {
    c.moveTo(-6, 0);
    c.lineTo(6, 0);
    c.lineTo(1, -5);
    c.moveTo(6, 0);
    c.lineTo(1, 5);
  }
  c.stroke();
  c.restore();
}
