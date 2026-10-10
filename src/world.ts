import { REGIONS, type RegionId } from "./regions";
import { COLLISION, playableBounds, type Point } from "./spatial";
export { iso, uniso } from "./spatial";
export type { Point } from "./spatial";
export type PropKind =
  | "house"
  | "ruinHouse"
  | "portal"
  | "wall"
  | "tree"
  | "deadTree"
  | "pine"
  | "rock"
  | "lantern"
  | "barrel"
  | "crate"
  | "chest"
  | "npc"
  | "bench"
  | "fence"
  | "fountain"
  | "statue";
export interface Prop extends Point {
  id: string;
  kind: PropKind;
  solid: boolean;
  radius: number;
  scale: number;
  opened?: boolean;
  footprint?: { halfX: number; halfY: number };
}
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);
export const normalize = (p: Point): Point => {
  const d = Math.hypot(p.x, p.y) || 1;
  return { x: p.x / d, y: p.y / d };
};
export const hash = (x: number, y: number) => {
  let n = (x * 374761393 + y * 668265263) >>> 0;
  n = ((n ^ (n >>> 13)) * 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
export const PORTAL: Point = { x: 22, y: 7 };
export class World {
  region: RegionId = "pedralta";
  get size() {
    return REGIONS[this.region].size;
  }
  props: Prop[] = [];
  constructor(region: RegionId = "pedralta") {
    this.setRegion(region);
  }
  setRegion(region: RegionId) {
    this.region = region;
    this.props = [];
    const add = (
      kind: PropKind,
      x: number,
      y: number,
      scale = 1,
      solid = true,
      radius = 0.5,
    ) =>
      this.props.push({
        id: `${kind}-${x}-${y}`,
        kind,
        x,
        y,
        solid,
        radius,
        scale,
        ...(region === "kharn" && ["house", "ruinHouse"].includes(kind)
          ? { footprint: { halfX: 1.2, halfY: 1.2 } }
          : {}),
      });
    // Visible perimeter masonry/rock replaces an unexplained invisible edge.
    for (let i = 0; i < this.size; i++)
      for (const [x, y] of [
        [i, 0.3],
        [i, this.size - 1.3],
        [0.3, i],
        [this.size - 1.3, i],
      ])
        add(region === "kharn" ? "rock" : "wall", x, y, 1, true, 0.48);
    if (region === "kharn") {
      add("portal", 4, 22, 1.9, false);
      add("npc", 6, 20, 0.72, false);
      for (const [x, y] of [
        [8, 16],
        [18, 15],
        [22, 7],
      ])
        add("statue", x, y, 1.3, false);
      for (const [x, y] of [
        [8, 22],
        [10, 7],
        [13, 9],
        [19, 4],
        [24, 15],
        [5, 10],
      ])
        add("ruinHouse", x, y, 2.1, true, 1.55);
      // Aqueduct walls have real gaps along the connecting streets.
      for (let y = 7; y <= 22; y++)
        if (![13, 14, 15, 16, 19, 20].includes(y))
          add("wall", 14, y, 1, true, 0.48);
      for (let x = 15; x <= 24; x++)
        if (![20, 21, 22].includes(x)) add("wall", x, 11, 1, true, 0.48);
      for (const [x, y] of [
        [3, 18],
        [5, 15],
        [9, 12],
        [10, 21],
        [17, 20],
        [20, 18],
        [24, 20],
        [25, 6],
        [19, 6],
        [7, 5],
        [4, 4],
      ])
        add("deadTree", x, y, 1.45, true, 0.5);
      for (const [x, y] of [
        [3, 12],
        [6, 7],
        [11, 4],
        [18, 24],
        [24, 24],
        [25, 13],
      ])
        add("pine", x, y, 1.5, true, 0.6);
      for (const [x, y] of [
        [7, 19],
        [8, 14],
        [12, 15],
        [16, 15],
        [21, 12],
        [22, 6],
        [5, 22],
      ])
        add("lantern", x, y, 1, false);
      for (const [x, y] of [
        [7, 17],
        [17, 17],
        [23, 7],
        [12, 22],
      ])
        add("barrel", x, y, 0.75, true, 0.35);
      add("chest", 9, 14, 0.8, false);
      add("chest", 24, 8, 0.8, false);
      return;
    }
    // Hand-composed streets: central diagonal thoroughfare, garden and northern ruins.
    for (const [x, y, kind] of [
      [5, 9, "house"],
      [5, 15, "ruinHouse"],
      [9, 20, "house"],
      [16, 21, "house"],
      [21, 17, "ruinHouse"],
      [20, 11, "house"],
      [16, 5, "ruinHouse"],
      [10, 5, "house"],
      [24, 4, "ruinHouse"],
    ] as const)
      add(kind, x, y, 2.1, true, 1.55);
    add("portal", 22, 7, 1.9, false);
    add("npc", 10, 14, 0.72, false);
    for (const [x, y] of [
      [3, 5],
      [3, 12],
      [4, 19],
      [6, 23],
      [12, 23],
      [18, 24],
      [24, 22],
      [25, 16],
      [25, 10],
      [24, 2],
      [19, 3],
      [13, 2],
      [8, 2],
      [2, 23],
      [2, 2],
      [26, 26],
      [8, 18],
      [18, 13],
      [14, 4],
    ])
      add(hash(x, y) > 0.45 ? "tree" : "pine", x, y, 1.5, true, 0.6);
    for (const [x, y] of [
      [18, 7],
      [24, 8],
      [17, 3],
      [20, 4],
      [23, 24],
    ])
      add("deadTree", x, y, 1.45, true, 0.5);
    for (const [x, y] of [
      [5, 6],
      [6, 6],
      [7, 6],
      [18, 18],
      [19, 18],
      [20, 18],
      [21, 4],
      [22, 4],
      [23, 4],
      [8, 22],
      [9, 22],
      [10, 22],
    ])
      add("wall", x, y, 1, true, 0.48);
    for (const [x, y] of [
      [7, 10],
      [7, 16],
      [11, 19],
      [18, 20],
      [22, 15],
      [18, 10],
      [14, 6],
      [21, 8],
      [10, 12],
    ])
      add("lantern", x, y, 1, false);
    for (const [x, y] of [
      [6, 10],
      [6, 16],
      [10, 20],
      [21, 16],
      [19, 11],
      [11, 6],
      [8, 13],
    ])
      add("barrel", x, y, 0.75, true, 0.35);
    for (const [x, y] of [
      [7, 11],
      [6, 17],
      [17, 22],
      [21, 14],
      [12, 5],
    ])
      add("crate", x, y, 0.65, true, 0.4);
    for (const [x, y] of [
      [4, 7],
      [15, 3],
      [23, 10],
      [20, 23],
      [9, 17],
    ])
      add("rock", x, y, 1, true, 0.5);
    add("chest", 8, 16, 0.8, false);
    add("chest", 19, 6, 0.8, false);
    add("bench", 11, 14, 1, true, 0.5);
    add("fountain", 11, 17, 1.1, true, 0.7);
    add("statue", 21, 5, 1.3, true, 0.5);
    add("fence", 17, 19, 1.1, true, 0.6);
  }
  tile(x: number, y: number) {
    if (x === 0 || y === 0 || x === this.size - 1 || y === this.size - 1)
      return 7;
    if (this.region === "kharn") {
      const road =
        (x >= 4 && x <= 9 && y >= 15 && y <= 23) ||
        (x >= 7 && x <= 22 && y >= 14 && y <= 16) ||
        (x >= 20 && x <= 23 && y >= 6 && y <= 16);
      if (x === 14 && y >= 6 && y <= 24) {
        return [13, 14, 15, 16, 19, 20].includes(y) ? 2 : 7;
      }
      return road ? (hash(x, y) > 0.65 ? 2 : 6) : hash(x, y) > 0.6 ? 4 : 3;
    }
    const road =
      Math.abs(x - y) < 3.3 ||
      (y > 10 && y < 15 && x > 6 && x < 23) ||
      (x > 19 && x < 24 && y > 4 && y < 16);
    if (x > 18 && y < 10) return hash(x, y) > 0.4 ? 6 : 2;
    if (road) return Math.floor(hash(x, y) * 3);
    return (x === 7 && y === 14) || (x === 18 && y === 19)
      ? 9
      : hash(x, y) > 0.45
        ? 3
        : 4;
  }
  blocked(p: Point, r: number = COLLISION.player, terrain = true) {
    const { min, max } = playableBounds(this.size);
    if (p.x < min || p.y < min || p.x > max || p.y > max) return true;
    if (terrain && this.region === "kharn" && Math.abs(p.x - 14) < 0.5 + r) {
      for (let y = Math.round(p.y) - 1; y <= Math.round(p.y) + 1; y++)
        if (
          this.tile(14, y) === 7 &&
          this.hitsProp(
            { x: 14, y, footprint: { halfX: 0.5, halfY: 0.5 } } as Prop,
            p,
            r,
          )
        )
          return true;
    }
    return this.props.some((o) => o.solid && this.hitsProp(o, p, r));
  }
  hitsProp(o: Prop, p: Point, r: number) {
    if (!o.footprint) return distance(o, p) < o.radius + r;
    const dx = Math.max(0, Math.abs(p.x - o.x) - o.footprint.halfX),
      dy = Math.max(0, Math.abs(p.y - o.y) - o.footprint.halfY);
    return Math.hypot(dx, dy) < r;
  }
  segmentClear(
    a: Point,
    b: Point,
    r: number = COLLISION.enemy,
    terrain = true,
  ) {
    const steps = Math.max(1, Math.ceil(distance(a, b) / 0.1));
    for (let i = 0; i <= steps; i++)
      if (
        this.blocked(
          {
            x: a.x + ((b.x - a.x) * i) / steps,
            y: a.y + ((b.y - a.y) * i) / steps,
          },
          r,
          terrain,
        )
      )
        return false;
    return true;
  }
  projectileBlocked(p: Point, ghost = false) {
    if (!ghost) return this.blocked(p, 0.04, false);
    const { min, max } = playableBounds(this.size);
    if (p.x < min || p.y < min || p.x > max || p.y > max) return true;
    // Tiro Fantasma atravessa vegetação e cercas, mas não construções ou limites.
    return this.props.some(
      (o) =>
        o.solid &&
        !["tree", "pine", "wall"].includes(o.kind) &&
        this.hitsProp(o, p, 0.04),
    );
  }
  nearestFree(p: Point, r: number = COLLISION.player): Point {
    if (!this.blocked(p, r)) return { ...p };
    const candidates: Point[] = [];
    for (let y = 1; y < this.size - 1; y++)
      for (let x = 1; x < this.size - 1; x++)
        if (!this.blocked({ x, y }, r)) candidates.push({ x, y });
    return (
      candidates.sort((a, b) => distance(a, p) - distance(b, p))[0] ?? {
        ...REGIONS[this.region].spawn,
      }
    );
  }
  discover(p: Point, known: string[]) {
    const set = new Set(known);
    for (let y = Math.floor(p.y) - 4; y <= Math.floor(p.y) + 4; y++)
      for (let x = Math.floor(p.x) - 4; x <= Math.floor(p.x) + 4; x++)
        if (
          x >= 0 &&
          y >= 0 &&
          x < this.size &&
          y < this.size &&
          distance({ x, y }, p) <= 4.5
        )
          set.add(`${x}:${y}`);
    return [...set];
  }
  move(p: Point, delta: Point, r: number = COLLISION.player) {
    // Bounded substeps preserve wall sliding and never jump across an obstacle.
    const steps = Math.max(
      1,
      Math.ceil(Math.hypot(delta.x, delta.y) / COLLISION.maxStep),
    );
    for (let i = 0; i < steps; i++) {
      const nx = { x: p.x + delta.x / steps, y: p.y };
      if (!this.blocked(nx, r)) p.x = nx.x;
      const ny = { x: p.x, y: p.y + delta.y / steps };
      if (!this.blocked(ny, r)) p.y = ny.y;
    }
  }
}
