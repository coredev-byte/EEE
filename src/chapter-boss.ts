import type { Enemy, Player } from "./state";
import type { Combat } from "./combat";
import { distance, normalize, type World, type Point } from "./world";
import { direction } from "./animation";
import { followRoute } from "./navigation";
import { arenaPoint } from "./ruins-map";
export type BossPattern =
  | "cleave"
  | "slam"
  | "cross"
  | "rush"
  | "oath"
  | "shards"
  | "knife"
  | "embers";
export interface BossAttack {
  kind: BossPattern;
  origin: Point;
  target: Point;
  angle: number;
  remaining: number;
  duration: number;
  areas: Point[];
  resolved: boolean;
  travel: number;
}
export const kharnPhase = (e: Enemy) =>
  e.hp <= e.maxHp * 0.3 ? 3 : e.hp <= e.maxHp * 0.65 ? 2 : 1;
export function patternHits(a: BossAttack, p: Point): boolean {
  const d = distance(p, a.origin),
    angle = Math.atan2(p.y - a.origin.y, p.x - a.origin.x);
  if (a.kind === "cleave")
    return d <= 2 && Math.cos(angle - a.angle) >= Math.cos(Math.PI * 0.4);
  if (a.kind === "cross")
    return (
      (Math.abs(p.x - a.origin.x) < 0.48 ||
        Math.abs(p.y - a.origin.y) < 0.48) &&
      d < 6
    );
  if (a.kind === "oath") return d > 1.3 && d < 4.2;
  if (a.kind === "shards" || a.kind === "embers")
    return a.areas.some((at) => distance(p, at) < 1.1);
  if (a.kind === "knife" || a.kind === "rush") {
    const u = { x: Math.cos(a.angle), y: Math.sin(a.angle) },
      dx = p.x - a.origin.x,
      dy = p.y - a.origin.y;
    const along = dx * u.x + dy * u.y;
    return (
      along > 0 &&
      along < (a.kind === "rush" ? 4 : 6) &&
      Math.abs(dx * u.y - dy * u.x) < (a.kind === "rush" ? 0.9 : 0.4)
    );
  }
  return distance(p, a.target) < 1.6;
}
export function updateChapterBoss(
  e: Enemy,
  p: Player,
  world: World,
  combat: Combat,
  dt: number,
  phaseChanged: (e: Enemy) => void,
) {
  if (e.dormant || e.hp <= 0 || p.hp <= 0) return;
  e.timer += dt;
  e.animTime += dt;
  const kharn = e.appearance === "kharn",
    phase = kharn ? kharnPhase(e) : e.hp < e.maxHp * 0.5 ? 2 : 1;
  if (e.phase !== phase) {
    const before = e.phase ?? 1;
    e.phase = phase;
    if (phase > before) {
      e.bossAttack = undefined;
      e.state = "recover";
      e.timer = -1;
      phaseChanged(e);
      return;
    }
  }
  const at = kharn ? arenaPoint(e) : e;
  if (kharn) {
    e.x = at.x;
    e.y = at.y;
  }
  const attack = e.bossAttack;
  if (attack) {
    e.state = "attack";
    attack.remaining -= dt;
    if (attack.kind === "rush" && attack.remaining <= 0 && !attack.resolved) {
      const n = normalize({
          x: attack.target.x - e.x,
          y: attack.target.y - e.y,
        }),
        step = Math.min(dt * 7, 4 - attack.travel);
      world.move(e, { x: n.x * step, y: n.y * step });
      attack.travel += step;
      if (distance(e, p) < 0.9 && world.segmentClear(e, p, 0.04, false))
        combat.damagePlayer(30, e);
      if (
        attack.travel < 4 &&
        distance(e, attack.target) > 0.25 &&
        attack.remaining > -0.7
      )
        return;
    }
    if (attack.remaining <= 0 && !attack.resolved) {
      attack.resolved = true;
      if (
        attack.kind !== "rush" &&
        patternHits(attack, p) &&
        world.segmentClear(attack.origin, p, 0.04, false)
      )
        combat.damagePlayer(kharn ? (phase === 3 ? 36 : 30) : 26, e);
      combat.effect(
        "nova",
        attack.kind === "slam" ? attack.target : e,
        kharn ? "#66e5f5" : "#ea8469",
        attack.kind === "oath" ? 4.2 : 1.6,
        0.5,
      );
      combat.emit("enemy.attack", { position: e, material: "stone" });
      e.bossAttack = undefined;
      e.state = "recover";
      e.timer = 0;
      e.animTime = 0;
    }
    return;
  }
  if (e.state === "recover" && e.timer < (kharn ? 1.35 : 1.1)) return;
  const d = distance(e, p);
  if (!world.segmentClear(e, p, 0.04, false)) {
    const target = world.nearestFree(kharn ? arenaPoint(p) : p, 0.23);
    const before = { x: e.x, y: e.y };
    e.route = followRoute(world, e, e.route, target, dt, kharn ? 1.7 : 1.6);
    e.direction = direction({ x: e.x - before.x, y: e.y - before.y });
    e.state = "chase";
    return;
  }
  // Kharn pressures every point in his arena. Bizel remains near his investigation site.
  if (!kharn && d > 8) {
    e.route = followRoute(world, e, e.route, e.home, dt, 1.4);
    return;
  }
  if (d > 1.6 && e.timer < 2.2) {
    const target = world.nearestFree(kharn ? arenaPoint(p) : p, 0.23);
    const before = { x: e.x, y: e.y };
    e.route = followRoute(world, e, e.route, target, dt, kharn ? 1.7 : 1.6);
    e.direction = direction({ x: e.x - before.x, y: e.y - before.y });
    e.state = "chase";
    return;
  }
  const patterns: BossPattern[] = kharn
    ? phase === 1
      ? ["cleave", "slam"]
      : phase === 2
        ? ["cleave", "cross", "rush", "slam"]
        : ["oath", "shards", "rush", "cross"]
    : phase === 1
      ? ["knife", "cleave"]
      : ["embers", "knife", "rush"];
  const kind = patterns[(e.bossCycle ?? 0) % patterns.length];
  e.bossCycle = (e.bossCycle ?? 0) + 1;
  const target = kharn ? arenaPoint(p) : { x: p.x, y: p.y };
  const duration =
    kind === "oath"
      ? 1.6
      : kind === "cross" || kind === "shards"
        ? 1.3
        : kind === "cleave"
          ? 0.85
          : 1.05;
  e.bossAttack = {
    kind,
    origin: { x: e.x, y: e.y },
    target,
    angle: Math.atan2(p.y - e.y, p.x - e.x),
    remaining: duration,
    duration,
    resolved: false,
    travel: 0,
    areas:
      kind === "shards" || kind === "embers"
        ? [
            target,
            { x: target.x + 2.6, y: target.y },
            { x: target.x, y: target.y - 2.6 },
          ]
        : [target],
  };
  e.direction = direction({ x: p.x - e.x, y: p.y - e.y });
  e.state = "attack";
  e.timer = 0;
  e.animTime = 0;
  combat.emit("attack.prepare", {
    position: e,
    material: "stone",
    group: `boss:${e.id}`,
  });
}
