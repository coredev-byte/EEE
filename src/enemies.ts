import { COLLISION } from "./spatial";
import { followRoute } from "./navigation";
import { direction } from "./animation";
import { distance, normalize, World } from "./world";
import type { Enemy, Player } from "./state";
import type { Combat } from "./combat";
export function updateEnemies(
  enemies: Enemy[],
  p: Player,
  world: World,
  combat: Combat,
  dt: number,
  time: number,
) {
  for (const e of enemies) {
    e.timer += dt;
    e.animTime += dt;
    if (e.hp <= 0) {
      e.state = "dead";
      continue;
    }
    if (p.hp <= 0) {
      e.state = "patrol";
      continue;
    }
    if (e.boss && world.region === "ferrugem") {
      if (world.props.some((o) => o.lock === "pump" && o.solid)) continue;
      const phase = e.hp <= e.maxHp / 2 ? 2 : 1;
      if (e.phase !== phase && distance(e, p) < 6) {
        e.phase = phase;
        combat.ctx.notify(
          phase === 2
            ? "Mestre da Fornalha: sobrecarga! Afaste-se do núcleo incandescente."
            : "O Mestre da Fornalha despertou. Evite as descargas de calor.",
        );
      }
      if (distance(e, p) < 6) {
        const previous = e.furnaceTimer ?? 0;
        e.furnaceTimer = previous + dt;
        const interval = phase === 2 ? 4.5 : 6;
        if (previous < interval && e.furnaceTimer >= interval)
          combat.effect("nova", e, "#f5a34f", 2.5, 1.2);
        if (e.furnaceTimer >= interval + 0.9) {
          if (distance(e, p) < 2.5 && world.segmentClear(e, p, 0.04, false))
            combat.damagePlayer(phase === 2 ? 50 : 38, e);
          e.furnaceTimer = 0;
          combat.emit("impact.world", { position: e, element: "fire" });
        }
      }
    }
    if (e.state === "hurt") {
      if (e.timer > 0.25) {
        e.state = "chase";
        e.timer = 0;
      }
      continue;
    }
    const slow = combat.engine.slow(e);
    if (slow === 0) {
      e.state = "recover";
      e.timer = 0;
      continue;
    }
    const d = distance(e, p);
    const range = e.type === "wolf" ? 0.7 : 0.85;
    if (e.state === "attack") {
      if (e.timer > 0.26 && !e.attackHit) {
        e.attackHit = true;
        combat.emit("enemy.attack", {
          position: e,
          enemy: e.type,
          classId: undefined,
        });
        if (d < range + 0.3 && world.segmentClear(e, p, 0.04, false)) {
          combat.damagePlayer(
            (e.type === "wolf" ? 19 : e.boss ? 36 : 26) *
              combat.engine.outgoing(e),
            e,
          );
          combat.effect(
            "slash",
            e,
            "#e96667",
            0.8,
            0.22,
            Math.atan2(p.y - e.y, p.x - e.x),
          );
        }
      }
      if (e.timer > 0.5) {
        e.state = "recover";
        e.timer = 0;
      }
      continue;
    }
    if (e.state === "recover") {
      if (e.timer > (e.type === "wolf" ? 0.65 : 1.05)) {
        e.state = "chase";
        e.timer = 0;
      }
      continue;
    }
    const visible = world.segmentClear(e, p, 0.04, false);
    if (visible && d < combat.engine.detection()) e.lostSight = 0;
    else e.lostSight = (e.lostSight ?? 0) + dt;
    const chase =
      (d < combat.engine.detection() && visible) ||
      !!combat.engine.get(e, "taunt") ||
      (["chase", "alert"].includes(e.state) &&
        (e.lostSight ?? 0) < 4 &&
        distance(e, e.home) < 12 &&
        d < 12);
    if (d < range && visible && combat.engine.detection() > 0) {
      combat.emit("attack.prepare", {
        position: e,
        enemy: e.type,
        classId: undefined,
        group: `enemy-prepare:${e.id}`,
      });
      e.state = "attack";
      e.timer = 0;
      e.animTime = 0;
      e.attackHit = false;
      e.direction = direction({ x: p.x - e.x, y: p.y - e.y });
      continue;
    }
    if (chase) {
      if (e.state === "patrol") {
        combat.emit("enemy.alert", {
          position: e,
          enemy: e.type,
          classId: undefined,
        });
        e.state = "alert";
        e.timer = 0;
      }
      if (e.state === "alert" && e.timer < 0.5) continue;
      e.state = "chase";
      const before = { x: e.x, y: e.y };
      e.route = followRoute(
        world,
        e,
        e.route,
        p,
        dt,
        slow * (e.type === "wolf" ? 2.1 : 1.55),
      );
      const moved = distance(e, before);
      if (moved > 0.001) {
        e.direction = direction({ x: e.x - before.x, y: e.y - before.y });
        if (Math.floor(e.animTime * 3) !== Math.floor((e.animTime - dt) * 3))
          combat.emit("enemy.step", {
            position: e,
            enemy: e.type,
            owner: `enemy:${e.id}`,
            classId: undefined,
            terrain:
              world.tile(Math.floor(e.x), Math.floor(e.y)) >= 3
                ? "grass"
                : "stone",
          });
      }
    } else {
      e.state = "patrol";
      const target =
        distance(e, e.home) > 1
          ? e.home
          : world.nearestFree(
              {
                x: e.home.x + Math.sin(time * 0.23 + e.id) * 0.7,
                y: e.home.y + Math.cos(time * 0.19 + e.id) * 0.7,
              },
              COLLISION.enemy,
            );
      const n = normalize({ x: target.x - e.x, y: target.y - e.y });
      e.route = followRoute(
        world,
        e,
        e.route,
        target,
        dt,
        distance(e, e.home) > 1 ? 1.2 : 0.35,
      );
      e.direction = direction(n);
    }
  }
}
