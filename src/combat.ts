import { CLASSES, type Skill } from "./data";
import { direction, facing } from "./animation";
import { distance, normalize, type Point, World } from "./world";
import {
  gainXp,
  stats,
  type Player,
  type Enemy,
  type Effect,
  type DamageText,
  type Projectile,
  type Quest,
} from "./state";
export interface CombatContext {
  player: Player;
  enemies: Enemy[];
  effects: Effect[];
  texts: DamageText[];
  projectiles: Projectile[];
  quest: Quest;
  world: World;
  notify: (text: string) => void;
  sound: (kind: "attack" | "hit" | "magic" | "death") => void;
}
export interface PendingAttack {
  time: number;
  done: boolean;
  skill: Skill;
  aim: Point;
}
export class Combat {
  pending: PendingAttack | null = null;
  constructor(readonly ctx: CombatContext) {}
  aim(target?: Point): Point {
    const p = this.ctx.player;
    return target
      ? normalize({ x: target.x - p.x, y: target.y - p.y })
      : facing(p.direction);
  }
  attack(target?: Point, skillIndex = -1) {
    const p = this.ctx.player;
    if (p.hp <= 0 || p.attackTimer > 0 || this.pending) return false;
    const c = CLASSES[p.classId];
    let s: Skill;
    if (skillIndex >= 0) {
      if (skillIndex >= p.unlocked) {
        this.ctx.notify(
          "Habilidade bloqueada. Evolua e use um ponto de habilidade.",
        );
        return false;
      }
      s = c.skills[skillIndex];
      if (p.cooldowns[skillIndex] > 0) return false;
      if (p.mp < s.cost) {
        this.ctx.notify("Mana insuficiente. Use uma poção com 2.");
        return false;
      }
      p.mp -= s.cost;
      p.cooldowns[skillIndex] = s.cooldown;
    } else
      s = {
        id: "basic",
        name: "Ataque",
        description: "",
        kind: c.basic,
        damage: stats(p).attack,
        cost: 0,
        cooldown: 0,
        range: c.basic === "projectile" ? 10 : 1.5,
        color: c.color,
        icon: 0,
      };
    const aim = this.aim(target);
    p.direction = direction(aim);
    p.action = s.kind === "slash" || s.kind === "dash" ? "attack" : "cast";
    p.animTime = 0;
    p.attackTimer = p.classId === "assassino" ? 0.36 : 0.5;
    this.pending = { time: 0, done: false, skill: s, aim };
    return true;
  }
  update(dt: number) {
    const p = this.ctx.player;
    p.attackTimer = Math.max(0, p.attackTimer - dt);
    if (this.pending) {
      this.pending.time += dt;
      if (!this.pending.done && this.pending.time >= 0.16) {
        this.pending.done = true;
        this.resolve(this.pending);
      }
      if (this.pending.time >= (p.classId === "assassino" ? 0.36 : 0.5))
        this.pending = null;
    }
    const c = this.ctx;
    for (const b of c.projectiles) {
      const step = Math.min(dt * 9, b.range - b.traveled);
      const old = { x: b.x, y: b.y };
      b.x += b.vx * step;
      b.y += b.vy * step;
      b.traveled += step;
      if (c.world.blocked(b, 0.04)) {
        b.traveled = b.range;
        this.effect("impact", b, b.color, 0.5);
        continue;
      }
      for (const e of c.enemies) {
        if (e.hp <= 0) continue;
        const v = { x: b.x - old.x, y: b.y - old.y };
        const vv = v.x * v.x + v.y * v.y;
        const t = vv
          ? Math.max(
              0,
              Math.min(1, ((e.x - old.x) * v.x + (e.y - old.y) * v.y) / vv),
            )
          : 0;
        if (distance(e, { x: old.x + v.x * t, y: old.y + v.y * t }) < 0.45) {
          this.hit(e, b.damage, b.color);
          b.traveled = b.range;
          break;
        }
      }
    }
    c.projectiles = c.projectiles.filter((b) => b.traveled < b.range);
  }
  effect(
    kind: Effect["kind"],
    p: Point,
    color: string,
    range: number,
    duration = 0.45,
    angle = 0,
  ) {
    this.ctx.effects.push({
      ...p,
      kind,
      color,
      range,
      time: 0,
      duration,
      angle,
    });
  }
  resolve(a: PendingAttack) {
    const c = this.ctx,
      p = c.player,
      s = a.skill;
    const angle = Math.atan2(a.aim.y, a.aim.x);
    c.sound(s.kind === "slash" ? "attack" : "magic");
    if (s.kind === "projectile") {
      c.projectiles.push({
        x: p.x + a.aim.x * 0.45,
        y: p.y + a.aim.y * 0.45,
        vx: a.aim.x,
        vy: a.aim.y,
        damage: s.damage + (s.id === "basic" ? 0 : stats(p).attack * 0.35),
        range: s.range,
        traveled: 0,
        color: s.color,
      });
      return;
    }
    if (s.kind === "guard") {
      p.guard = 5;
      this.effect("heal", p, s.color, 1, 1);
      return;
    }
    if (s.kind === "heal") {
      p.hp = Math.min(stats(p).maxHp, p.hp + s.damage);
      this.effect("heal", p, s.color, 1, 1);
      return;
    }
    if (s.kind === "dash") {
      p.invulnerable = 0.45;
      const origin = { x: p.x, y: p.y };
      for (let i = 0; i < 18; i++) {
        c.world.move(p, {
          x: (a.aim.x * s.range) / 18,
          y: (a.aim.y * s.range) / 18,
        });
        for (const e of c.enemies) {
          if (e.hp > 0 && distance(e, p) < 0.85 && !hitIds.has(e.id)) {
            hitIds.add(e.id);
            this.hit(e, s.damage, s.color);
          }
        }
      }
      this.effect("dash", origin, s.color, s.range, 0.4, angle);
      hitIds.clear();
      return;
    }
    this.effect(
      s.kind === "nova" ? "nova" : "slash",
      p,
      s.color,
      s.range,
      s.kind === "nova" ? 0.65 : 0.3,
      angle,
    );
    for (const e of c.enemies) {
      if (e.hp <= 0 || distance(e, p) > s.range) continue;
      const n = normalize({ x: e.x - p.x, y: e.y - p.y });
      if (s.kind === "nova" || n.x * a.aim.x + n.y * a.aim.y > 0.25)
        this.hit(
          e,
          s.damage + (s.id === "basic" ? 0 : stats(p).attack * 0.3),
          s.color,
        );
    }
  }
  hit(e: Enemy, amount: number, color: string) {
    if (e.hp <= 0) return;
    const c = this.ctx;
    const damage = Math.round(amount);
    e.hp = Math.max(0, e.hp - damage);
    e.state = e.hp ? "hurt" : "dead";
    e.timer = 0;
    e.animTime = 0;
    c.texts.push({ x: e.x, y: e.y, text: String(damage), color, time: 0 });
    this.effect("impact", e, color, 0.65, 0.32);
    c.sound("hit");
    const away = normalize({ x: e.x - c.player.x, y: e.y - c.player.y });
    c.world.move(e, { x: away.x * 0.15, y: away.y * 0.15 });
    if (!e.hp && !e.rewarded) {
      e.rewarded = true;
      c.quest.kills++;
      c.player.coins += e.type === "wolf" ? 12 : 20;
      const levels = gainXp(c.player, e.type === "wolf" ? 45 : 65);
      if (levels)
        c.notify(
          `Nível ${c.player.level}! +1 ponto de habilidade. Vida e mana restauradas.`,
        );
      this.effect("death", e, "#7ab3d9", 1, 0.8);
      c.sound("death");
    }
  }
  damagePlayer(amount: number) {
    const p = this.ctx.player;
    if (p.invulnerable > 0 || p.hp <= 0) return false;
    const value = Math.max(
      1,
      Math.round((amount - stats(p).defense) * (p.guard > 0 ? 0.25 : 1)),
    );
    p.hp = Math.max(0, p.hp - value);
    p.invulnerable = 0.65;
    p.action = p.hp ? "hurt" : "dead";
    p.animTime = 0;
    this.ctx.texts.push({
      ...p,
      text: String(value),
      color: "#f27979",
      time: 0,
    });
    this.ctx.sound("hit");
    return true;
  }
}
const hitIds = new Set<number>();
