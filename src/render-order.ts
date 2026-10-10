import type { Point } from "./spatial";
import type { Effect } from "./state";
export interface WorldDraw {
  point: Point;
  /** Tie-break only: ground, body/obstacle, attached impact. */
  layer: 0 | 1 | 2;
  draw: () => void;
}
export function paintWorld(entries: WorldDraw[]) {
  entries.sort(
    (a, b) =>
      a.point.x + a.point.y - (b.point.x + b.point.y) || a.layer - b.layer,
  );
  for (const entry of entries) entry.draw();
}
export function effectPosition(effect: Effect, sample = 0): Point {
  const offset =
    effect.kind === "dash"
      ? (effect.range * sample) / 4
      : effect.kind === "slash"
        ? Math.min(effect.range, 0.6)
        : 0;
  return {
    x: effect.x + Math.cos(effect.angle) * offset,
    y: effect.y + Math.sin(effect.angle) * offset,
  };
}
