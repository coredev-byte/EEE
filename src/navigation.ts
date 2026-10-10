import { COLLISION, type Point } from "./spatial";
import { distance, type World } from "./world";
/** Half-tile A*: static clearance grid, exact segment checks, no corner cutting. */
const grids = new WeakMap<
  World,
  { props: World["props"]; region: string; free: Set<string>; radius: number }
>();
const key = (x: number, y: number) => `${x}:${y}`;
const point = (k: string) => {
  const [x, y] = k.split(":").map(Number);
  return { x: x / 2, y: y / 2 };
};
export function findPath(
  world: World,
  start: Point,
  target: Point,
  r: number = COLLISION.enemy,
): Point[] {
  if (world.segmentClear(start, target, r)) return [{ ...target }];
  let cached = grids.get(world);
  if (
    !cached ||
    cached.props !== world.props ||
    cached.region !== world.region ||
    cached.radius !== r
  ) {
    const free = new Set<string>();
    for (let y = 2; y <= (world.size - 2) * 2; y++)
      for (let x = 2; x <= (world.size - 2) * 2; x++)
        if (!world.blocked({ x: x / 2, y: y / 2 }, r)) free.add(key(x, y));
    cached = { props: world.props, region: world.region, free, radius: r };
    grids.set(world, cached);
  }
  const free = cached.free;
  const nearest = (p: Point) => {
    const near: string[] = [];
    const sx = Math.round(p.x * 2),
      sy = Math.round(p.y * 2);
    for (let radius = 0; radius <= 3; radius++) {
      for (let y = sy - radius; y <= sy + radius; y++)
        for (let x = sx - radius; x <= sx + radius; x++)
          if (free.has(key(x, y))) near.push(key(x, y));
      const found = near
        .sort((a, b) => distance(point(a), p) - distance(point(b), p))
        .find((k) => world.segmentClear(p, point(k), r));
      if (found) return found;
    }
    return undefined;
  };
  const first = nearest(start),
    last = nearest(target);
  if (!first || !last) return [];
  const open = new Set([first]),
    g = new Map([[first, 0]]),
    previous = new Map<string, string>(),
    closed = new Set<string>();
  while (open.size) {
    let current = "";
    let best = Infinity;
    for (const k of open) {
      const cost = g.get(k)! + distance(point(k), point(last));
      if (cost < best) {
        current = k;
        best = cost;
      }
    }
    if (current === last) {
      const result: Point[] = [{ ...target }];
      let k = last;
      while (k !== first) {
        result.unshift(point(k));
        k = previous.get(k)!;
      }
      result.unshift(point(first));
      // Keep only corners whose full swept segment is clear.
      const smooth: Point[] = [];
      let from = start;
      for (let i = 0; i < result.length;) {
        let j = result.length - 1;
        while (j > i && !world.segmentClear(from, result[j], r)) j--;
        smooth.push(result[j]);
        from = result[j];
        i = j + 1;
      }
      return smooth;
    }
    open.delete(current);
    closed.add(current);
    const [x, y] = current.split(":").map(Number);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      const next = key(x + dx, y + dy);
      if (!free.has(next) || closed.has(next)) continue;
      if (dx && dy && (!free.has(key(x + dx, y)) || !free.has(key(x, y + dy))))
        continue;
      if (!world.segmentClear(point(current), point(next), r)) continue;
      const score = g.get(current)! + Math.hypot(dx, dy) / 2;
      if (score < (g.get(next) ?? Infinity)) {
        g.set(next, score);
        previous.set(next, current);
        open.add(next);
      }
    }
  }
  return [];
}
export interface Route {
  points: Point[];
  target: Point;
  retry: number;
  steps: number;
}
export function followRoute(
  world: World,
  actor: Point,
  route: Route | undefined,
  target: Point,
  dt: number,
  speed: number,
): Route {
  if (!route || route.retry <= 0 || distance(route.target, target) > 0.8)
    route = {
      points: findPath(world, actor, target),
      target: { ...target },
      retry: 0.85,
      steps: (route?.steps ?? 0) + 1,
    };
  route.retry -= dt;
  while (route.points.length && distance(actor, route.points[0]) < 0.12)
    route.points.shift();
  const next = route.points[0];
  if (next) {
    const d = distance(actor, next),
      step = Math.min(d, speed * dt);
    const before = { ...actor };
    world.move(
      actor,
      {
        x: ((next.x - actor.x) / d) * step,
        y: ((next.y - actor.y) / d) * step,
      },
      COLLISION.enemy,
    );
    if (distance(actor, before) < 0.001) route.retry = 0;
  }
  return route;
}
