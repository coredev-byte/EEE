import { ANIMATIONS, DIRS, type Action, type Direction } from "./data";
import { iso, normalize, type Point } from "./world";
export function frame(action: Action, time: number) {
  const a = ANIMATIONS[action];
  const t = a.loop
    ? (time % a.duration) / a.duration
    : Math.min(0.999, time / a.duration);
  return a.frames[Math.floor(t * a.frames.length)];
}
export function direction(delta: Point): Direction {
  const s = iso(delta);
  return Math.abs(s.x) > Math.abs(s.y) * 1.6
    ? s.x > 0
      ? "right"
      : "left"
    : s.y > 0
      ? "front"
      : "back";
}
export function facing(dir: Direction): Point {
  return normalize(
    dir === "front"
      ? { x: 1, y: 1 }
      : dir === "back"
        ? { x: -1, y: -1 }
        : dir === "right"
          ? { x: 1, y: -1 }
          : { x: -1, y: 1 },
  );
}
export function spriteIndex(dir: Direction, action: Action, time: number) {
  return DIRS.indexOf(dir) * 12 + frame(action, time);
}
