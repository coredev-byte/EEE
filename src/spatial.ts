/** Shared contract: world positions mark feet; screen/UI distances are logical pixels. */
export interface Point {
  x: number;
  y: number;
}
export const VIEW = {
  width: 960,
  height: 540,
  focus: { x: 480, y: 285 },
} as const;
export const TILE = { width: 80, height: 40 } as const;
export const FRAMES = {
  character: { width: 96, height: 112, pivot: { x: 48, y: 108 } },
  prop: { width: 128, height: 160, pivot: { x: 64, y: 156 } },
  effect: { width: 128, height: 128, pivot: { x: 64, y: 64 } },
} as const;
export const ACTOR_HEIGHT = {
  aim: 28,
  projectile: 24,
  impact: 25,
  slash: 27,
  nova: 30,
  heal: 38,
  head: 88,
  text: 64,
} as const;
export const COLLISION = { player: 0.22, enemy: 0.23, maxStep: 0.1 } as const;
export const iso = (p: Point): Point => ({
  x: ((p.x - p.y) * TILE.width) / 2,
  y: ((p.x + p.y) * TILE.height) / 2,
});
export const uniso = (p: Point): Point => ({
  x: p.x / TILE.width + p.y / TILE.height,
  y: p.y / TILE.height - p.x / TILE.width,
});
export const cameraPixels = (camera: Point): Point => ({
  x: Math.round(camera.x),
  y: Math.round(camera.y),
});
export function worldToScreen(p: Point, camera: Point): Point {
  const projected = iso(p),
    offset = cameraPixels(camera);
  return {
    x: Math.round(projected.x - offset.x + VIEW.focus.x),
    y: Math.round(projected.y - offset.y + VIEW.focus.y),
  };
}
export function screenToWorld(p: Point, camera: Point): Point {
  const offset = cameraPixels(camera);
  return uniso({
    x: p.x + offset.x - VIEW.focus.x,
    y: p.y + offset.y - VIEW.focus.y,
  });
}
export function clientToScreen(
  p: Point,
  rect: { left: number; top: number; width: number; height: number },
): Point {
  return {
    x: ((p.x - rect.left) * VIEW.width) / rect.width,
    y: ((p.y - rect.top) * VIEW.height) / rect.height,
  };
}
export function playableBounds(size: number) {
  return { min: 1, max: size - 2 };
}
export function minimapPoint(
  p: Point,
  size: number,
  width: number,
  height: number,
  padding = 7,
): Point {
  return {
    x: padding + ((p.x + 0.5) * (width - padding * 2)) / size,
    y: padding + ((p.y + 0.5) * (height - padding * 2)) / size,
  };
}

export function framePivot(width: number, height: number): Point {
  const frame = Object.values(FRAMES).find(
    (frame) => frame.width === width && frame.height === height,
  );
  if (!frame) throw new Error(`Missing pivot for frame ${width}x${height}`);
  return frame.pivot;
}

export const PROP_HEIGHT = { light: 30, portalParticles: 35 } as const;
export function spriteBounds(
  foot: Point,
  frame: { width: number; height: number; pivot: Point },
  scale: number,
) {
  return {
    x: foot.x - frame.pivot.x * scale,
    y: foot.y - frame.pivot.y * scale,
    width: frame.width * scale,
    height: frame.height * scale,
  };
}
export function onScreen(bounds: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  return (
    bounds.x + bounds.width >= 0 &&
    bounds.y + bounds.height >= 0 &&
    bounds.x <= VIEW.width &&
    bounds.y <= VIEW.height
  );
}
