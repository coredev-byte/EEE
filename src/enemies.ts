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
    const d = distance(e, p);
    const range = e.type === "wolf" ? 0.7 : 0.85;
    if (e.state === "attack") {
      if (e.timer > 0.26 && !e.attackHit) {
        e.attackHit = true;
        if (d < range + 0.3) {
          combat.damagePlayer(e.type === "wolf" ? 19 : 26);
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
    if (d < range) {
      e.state = "attack";
      e.timer = 0;
      e.animTime = 0;
      e.attackHit = false;
      e.direction = direction({ x: p.x - e.x, y: p.y - e.y });
      continue;
    }
    if (d < 5.5) {
      if (e.state === "patrol") {
        e.state = "alert";
        e.timer = 0;
      }
      if (e.state === "alert" && e.timer < 0.5) continue;
      e.state = "chase";
      const n = normalize({ x: p.x - e.x, y: p.y - e.y });
      e.direction = direction(n);
      world.move(
        e,
        {
          x: n.x * dt * (e.type === "wolf" ? 2.1 : 1.55),
          y: n.y * dt * (e.type === "wolf" ? 2.1 : 1.55),
        },
        0.23,
      );
      // Local obstacle avoidance. Try tangents only after a direct path is blocked.
      const ahead = { x: e.x + n.x * 0.32, y: e.y + n.y * 0.32 };
      if (world.blocked(ahead, 0.23))
        world.move(e, { x: -n.y * dt * 1.6, y: n.x * dt * 1.6 }, 0.23);
    } else {
      e.state = "patrol";
      const target = {
        x: e.home.x + Math.sin(time * 0.23 + e.id) * 0.7,
        y: e.home.y + Math.cos(time * 0.19 + e.id) * 0.7,
      };
      const n = normalize({ x: target.x - e.x, y: target.y - e.y });
      world.move(e, { x: n.x * dt * 0.35, y: n.y * dt * 0.35 });
      e.direction = direction(n);
    }
  }
}
