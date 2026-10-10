import { MAP_SIZE } from "./data";
export interface Point {
  x: number;
  y: number;
}
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
}
export const iso = (p: Point): Point => ({
  x: (p.x - p.y) * 40,
  y: (p.x + p.y) * 20,
});
export const uniso = (p: Point): Point => ({
  x: p.x / 80 + p.y / 40,
  y: p.y / 40 - p.x / 80,
});
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
  readonly size = MAP_SIZE;
  props: Prop[] = [];
  constructor() {
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
      });
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
    if (x === 0 || y === 0 || x === 27 || y === 27) return 7;
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
  blocked(p: Point, r = 0.22) {
    if (p.x < 1 || p.y < 1 || p.x > 26 || p.y > 26) return true;
    return this.props.some((o) => o.solid && distance(o, p) < o.radius + r);
  }
  move(p: Point, delta: Point, r = 0.22) {
    const nx = { x: p.x + delta.x, y: p.y };
    if (!this.blocked(nx, r)) p.x = nx.x;
    const ny = { x: p.x, y: p.y + delta.y };
    if (!this.blocked(ny, r)) p.y = ny.y;
  }
}
