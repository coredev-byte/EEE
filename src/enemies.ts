import { COLLISION } from "./spatial";
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
        if (d < range + 0.3) {
          combat.damagePlayer(
            (e.type === "wolf" ? 19 : 26) * combat.engine.outgoing(e),
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
    if (d < range && combat.engine.detection() > 0) {
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
    if (d < combat.engine.detection() || !!combat.engine.get(e, "taunt")) {
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
      const n = normalize({ x: p.x - e.x, y: p.y - e.y });
      e.direction = direction(n);
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
      world.move(
        e,
        {
          x: n.x * dt * slow * (e.type === "wolf" ? 2.1 : 1.55),
          y: n.y * dt * slow * (e.type === "wolf" ? 2.1 : 1.55),
        },
        COLLISION.enemy,
      );
      // Local obstacle avoidance. Try tangents only after a direct path is blocked.
      const ahead = { x: e.x + n.x * 0.32, y: e.y + n.y * 0.32 };
      if (world.blocked(ahead, COLLISION.enemy))
        world.move(
          e,
          { x: -n.y * dt * 1.6, y: n.x * dt * 1.6 },
          COLLISION.enemy,
        );
    } else {
      e.state = "patrol";
      const target = {
        x: e.home.x + Math.sin(time * 0.23 + e.id) * 0.7,
        y: e.home.y + Math.cos(time * 0.19 + e.id) * 0.7,
      };
      const n = normalize({ x: target.x - e.x, y: target.y - e.y });
      world.move(
        e,
        { x: n.x * dt * 0.35, y: n.y * dt * 0.35 },
        COLLISION.enemy,
      );
      e.direction = direction(n);
    }
  }
}
