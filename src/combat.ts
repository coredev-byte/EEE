import { type AudioEvent, type AudioCue } from "./audio-catalog";
import { SkillEngine } from "./skill-engine";
import { equippedSkills, NODE_BY_ID, owns } from "./skills";
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
  skillHeld?: (id: string) => boolean;
  audioEvent?: (event: AudioEvent, cue?: AudioCue) => boolean;
  pickup?: (id: string, count?: number) => void;
  onEnemyDefeated?: (enemy: Enemy) => void;
  audioSustain?: (owner: string, cue: AudioCue) => void;
  audioStopOwner?: (owner: string) => void;
  sound: (kind: "attack" | "hit" | "magic" | "death") => void;
}
export interface PendingAttack {
  time: number;
  done: boolean;
  duration: number;
  skill: Skill;
  aim: Point;
  target?: Point;
}
export class Combat {
  hitSerial = 0;
  attackSerial = 0;
  emit(event: AudioEvent, cue: AudioCue = {}) {
    return this.ctx.audioEvent?.(event, {
      classId: this.ctx.player.classId,
      ...(cue.enemy ? { armorId: null, weaponId: null } : {}),
      ...cue,
    });
  }
  pending: PendingAttack | null = null;
  engine: SkillEngine;
  constructor(readonly ctx: CombatContext) {
    this.engine = new SkillEngine(this);
  }
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
      const equipped = equippedSkills(p)[skillIndex];
      if (!equipped || !owns(p, equipped.id)) {
        this.emit("skill.denied");
        this.ctx.notify("Slot vazio. Equipe uma habilidade na árvore (K).");
        return false;
      }
      s = equipped;
      if ((p.skillCooldowns[s.id] ?? 0) > 0) {
        this.emit("skill.denied");
        return false;
      }
      if (p.mp < s.cost) {
        this.emit("skill.denied");
        this.ctx.notify("Essência / mana insuficiente. Use uma poção com X.");
        return false;
      }
      if (!this.engine.before(NODE_BY_ID.get(s.id))) {
        this.emit("skill.denied");
        return false;
      }
      p.mp -= s.cost;
      p.skillCooldowns[s.id] = s.cooldown;
      p.cooldowns[skillIndex] = s.cooldown;
      this.engine.cast(NODE_BY_ID.get(s.id));
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
    this.attackSerial++;
    this.emit("attack.prepare", {
      position: p,
      skillId: s.id,
      owner: `attack:${this.attackSerial}`,
    });
    const aim = this.aim(target);
    p.direction = direction(aim);
    p.action = s.kind === "slash" || s.kind === "dash" ? "attack" : "cast";
    p.animTime = 0;
    p.attackTimer =
      (p.classId === "assassino" ? 0.36 : 0.5) * this.engine.attackSpeed();
    this.pending = {
      time: 0,
      done: false,
      skill: s,
      aim,
      duration: p.attackTimer,
      target: target ? { ...target } : undefined,
    };
    return true;
  }
  update(dt: number) {
    const p = this.ctx.player;
    this.engine.update(dt);
    p.attackTimer = Math.max(0, p.attackTimer - dt);
    if (this.pending) {
      this.pending.time += dt;
      const node = NODE_BY_ID.get(this.pending.skill.id),
        channel = node?.mechanic === "channel";
      const ready = channel
        ? this.pending.time >= (node?.type === "ultimate" ? 1 : 0.25) &&
          (!this.ctx.skillHeld?.(this.pending.skill.id) ||
            this.pending.time >= 2)
        : this.pending.time >= 0.16;
      if (channel && !this.pending.done) {
        this.ctx.audioSustain?.(`charge:${this.attackSerial}`, {
          skillId: this.pending.skill.id,
          position: p,
          duration: 2,
        });
        p.attackTimer = 0.3;
        p.action = "cast";
      }
      if (!this.pending.done && ready) {
        if (channel)
          this.pending.skill = {
            ...this.pending.skill,
            damage:
              this.pending.skill.damage *
              (1 + Math.min(2, this.pending.time) * 0.35),
          };
        this.ctx.audioStopOwner?.(`charge:${this.attackSerial}`);
        this.pending.done = true;
        this.resolve(this.pending);
      }
      if (this.pending.done && this.pending.time >= this.pending.duration) {
        const s = this.pending.skill,
          n = NODE_BY_ID.get(s.id);
        if (
          s.id !== "basic" &&
          s.kind !== "projectile" &&
          ![
            "zone",
            "pull",
            "turret",
            "trap",
            "buff",
            "guard",
            "stealth",
          ].includes(n?.mechanic ?? "")
        )
          this.emit("skill.end", { skillId: s.id, position: p });
        this.pending = null;
      }
    }
    const c = this.ctx;
    for (const b of c.projectiles) {
      const step = Math.min(dt * (b.speed ?? 9), b.range - b.traveled);
      const old = { x: b.x, y: b.y };
      b.x += b.vx * step;
      b.y += b.vy * step;
      b.traveled += step;
      if (c.world.projectileBlocked(b, !!b.ghost)) {
        if (b.ricochet && !b.bounced) {
          b.x = old.x;
          b.y = old.y;
          b.vx = -b.vx;
          b.vy = -b.vy;
          b.bounced = true;
          continue;
        }
        b.audioBlocked = true;
        b.traveled = b.range;
        this.effect("impact", b, b.color, 0.5);
        b.x = old.x;
        b.y = old.y;
        this.emit("impact.world", {
          position: b,
          skillId: b.source,
          material: "stone",
        });
        this.explode(b);
        continue;
      }
      for (const e of c.enemies) {
        if (e.hp <= 0 || b.hitIds?.includes(e.id)) continue;
        const v = { x: b.x - old.x, y: b.y - old.y };
        const vv = v.x * v.x + v.y * v.y;
        const t = vv
          ? Math.max(
              0,
              Math.min(1, ((e.x - old.x) * v.x + (e.y - old.y) * v.y) / vv),
            )
          : 0;
        if (distance(e, { x: old.x + v.x * t, y: old.y + v.y * t }) < 0.45) {
          const offset = distance(e, {
            x: old.x + v.x * t,
            y: old.y + v.y * t,
          });
          const precise = offset < 0.15;
          const node = NODE_BY_ID.get(b.source ?? "");
          let amount = b.damage;
          if (
            precise &&
            this.ctx.player.classId === "arcanista" &&
            this.engine.has(2, 7)
          )
            amount *= 1.15;
          if (precise && this.ctx.player.classId === "atirador") {
            if (node?.branch === 0 && node.index === 0) amount *= 1.3;
            if (this.engine.has(0, 3)) amount *= 1.3;
            if (this.engine.has(0, 9)) this.engine.resource(5);
          }
          this.hit(
            e,
            amount,
            b.color,
            b.source,
            false,
            precise && this.ctx.player.classId === "atirador",
          );
          (b.hitIds ??= []).push(e.id);
          if (!b.pierce) {
            b.traveled = b.range;
            this.explode(b, e.id);
            break;
          }
        }
      }
    }
    for (const b of c.projectiles)
      if (b.boomerang && !b.returning && b.traveled >= b.range) {
        b.returning = true;
        b.traveled = 0;
        b.vx = -b.vx;
        b.vy = -b.vy;
        b.hitIds = [];
      }
    for (const b of c.projectiles)
      if (b.traveled >= b.range) {
        if (!b.audioBlocked && !b.hitIds?.length)
          this.emit("attack.miss", { position: b, skillId: b.source });
        if (b.source && b.source !== "basic")
          this.emit("skill.end", { position: b, skillId: b.source });
      }
    c.projectiles = c.projectiles.filter((b) => b.traveled < b.range);
  }
  explode(b: Projectile, except?: number) {
    const n = NODE_BY_ID.get(b.source ?? "");
    if (
      n?.classId === "arcanista" &&
      n.branch === 0 &&
      [3, 11].includes(n.index)
    ) {
      this.effect("nova", b, n.color, 2, 0.6);
      for (const e of this.ctx.enemies)
        if (e.hp > 0 && e.id !== except && distance(e, b) < 2)
          this.hit(e, b.damage * 0.6, b.color, b.source);
    }
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
    const identity = NODE_BY_ID.get(s.id);
    this.emit(s.id === "basic" ? "attack.swing" : "skill.activate", {
      position: p,
      skillId: s.id,
      upgraded: owns(p, `${s.id}-up-0`),
    });
    const hits = this.hitSerial;
    if (this.engine.resolve(a)) return;
    const node = NODE_BY_ID.get(s.id);
    if (s.kind === "projectile") {
      const mods = this.engine.projectile(node);
      c.projectiles.push({
        x: p.x + a.aim.x * 0.45,
        y: p.y + a.aim.y * 0.45,
        vx: a.aim.x,
        vy: a.aim.y,
        damage: s.damage + (s.id === "basic" ? 0 : stats(p).attack * 0.35),
        range: s.range * (this.engine.active("distortion") ? 1.35 : 1),
        traveled: 0,
        color: s.color,
        source: s.id,
        speed:
          node?.classId === "arcanista" && node.branch === 0 && node.index === 3
            ? 5
            : 9,
        ...mods,
      });
      if (mods.duplicate) {
        const copy = {
          ...c.projectiles[c.projectiles.length - 1],
          damage: c.projectiles[c.projectiles.length - 1].damage * 0.6,
        };
        copy.x += a.aim.y * 0.2;
        copy.y -= a.aim.x * 0.2;
        c.projectiles.push(copy);
      }
      return;
    }
    if (s.kind === "guard") {
      this.engine.buffs[s.id] = 5;
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
      p.invulnerable =
        p.classId === "assassino" && this.engine.has(2, 1) ? 0.65 : 0.45;
      const origin = { x: p.x, y: p.y };
      for (let i = 0; i < 18; i++) {
        c.world.move(p, {
          x: (a.aim.x * s.range) / 18,
          y: (a.aim.y * s.range) / 18,
        });
        for (const e of c.enemies) {
          if (e.hp > 0 && distance(e, p) < 0.85 && !hitIds.has(e.id)) {
            hitIds.add(e.id);
            this.hit(e, s.damage, s.color, s.id);
          }
        }
      }
      this.effect("dash", origin, s.color, s.range, 0.4, angle);
      if (!hitIds.size)
        this.emit("attack.miss", { position: p, skillId: s.id });
      this.emit("defense.dodge", { position: p, skillId: s.id });
      hitIds.clear();
      this.engine.dash(node);
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
          s.id,
        );
    }
    if (this.hitSerial === hits)
      this.emit("attack.miss", { position: p, skillId: s.id });
  }
  hit(
    e: Enemy,
    amount: number,
    color: string,
    source?: string,
    periodic = false,
    critical = false,
  ) {
    if (e.hp <= 0) return;
    const c = this.ctx;
    this.engine.ensure();
    const damage = Math.round(
      periodic ? amount : this.engine.amplify(e, amount, source),
    );
    e.hp = Math.max(0, e.hp - damage);
    e.state = e.hp ? "hurt" : "dead";
    e.lostSight = 0;
    e.timer = 0;
    e.animTime = 0;
    c.texts.push({ x: e.x, y: e.y, text: String(damage), color, time: 0 });
    this.effect("impact", e, color, 0.65, 0.32);
    this.hitSerial++;
    if (!periodic)
      this.emit(critical ? "impact.critical" : "impact.hit", {
        position: e,
        skillId: source,
        material: e.type === "bandit" ? "metal" : "flesh",
      });
    const away = normalize({ x: e.x - c.player.x, y: e.y - c.player.y });
    c.world.move(e, { x: away.x * 0.15, y: away.y * 0.15 });
    if (!periodic) this.engine.afterHit(e, damage, source);
    if (!e.hp && !e.rewarded) {
      if (periodic) this.engine.killed(e);
      e.rewarded = true;
      if (c.world.region === "pedralta") c.quest.kills++;
      c.player.coins += e.type === "wolf" ? 12 : 20;
      c.pickup?.("coins", e.type === "wolf" ? 12 : 20);
      const levels = gainXp(c.player, e.type === "wolf" ? 45 : 65);
      if (levels) this.emit("level.up");
      if (levels)
        c.notify(
          `Nível ${c.player.level}! +1 ponto de habilidade. Vida e mana restauradas.`,
        );
      this.effect("death", e, "#7ab3d9", 1, 0.8);
      this.emit("enemy.death", { position: e, enemy: e.type });
      c.onEnemyDefeated?.(e);
    }
  }
  damagePlayer(amount: number, attacker?: Enemy) {
    const p = this.ctx.player;
    this.engine.ensure();
    const incoming = this.engine.incoming(amount, attacker);
    if (incoming <= 0 && p.hp > 0) {
      this.emit(p.invulnerable > 0 ? "defense.dodge" : "defense.block", {
        position: p,
      });
      return false;
    }
    if (p.hp <= 0) return false;
    if (p.guard > 0) this.emit("defense.block", { position: p });
    const value = Math.max(
      1,
      Math.round((incoming - stats(p).defense) * (p.guard > 0 ? 0.25 : 1)),
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
    this.emit("player.hurt", { position: p });
    if (p.hp <= 0) {
      this.ctx.audioStopOwner?.(`charge:${this.attackSerial}`);
      this.engine.cancelAudio();
      this.emit("enemy.death", { position: p, group: "player.death" });
    }
    return true;
  }
}
const hitIds = new Set<number>();
