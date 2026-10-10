import { type AudioCue } from "./audio-catalog";
import { ITEMS } from "./data";
import { facing } from "./animation";
import { NODE_BY_ID, has, hybrid, owns, profile, type Node } from "./skills";
import { stats, type Enemy, type Player } from "./state";
import { distance, normalize, type Point } from "./world";
import type { Combat, PendingAttack } from "./combat";
interface Affliction {
  kind: string;
  time: number;
  stacks: number;
  tick: number;
}
interface Zone extends Point {
  audioId?: number;
  node: Node;
  time: number;
  tick: number;
  radius: number;
  age: number;
  triggered: boolean;
}
export class SkillEngine {
  zoneSerial = 0;
  soundOwners = new Map<string, AudioCue>();
  cancelAudio() {
    for (const owner of this.soundOwners.keys())
      this.combat.ctx.audioStopOwner?.(owner);
    this.soundOwners.clear();
  }
  syncAudio() {
    const current = new Map<string, AudioCue>();
    for (const [id, time] of Object.entries(this.buffs)) {
      const n = NODE_BY_ID.get(id);
      if (
        time > 0 &&
        n?.skill &&
        (n.mechanic !== "stealth" || this.active("stealth")) &&
        ["buff", "guard", "stealth"].includes(n.mechanic ?? n.skill.kind)
      )
        current.set(`skill:buff:${id}`, {
          skillId: id,
          position: this.p,
          duration: time,
          classId: this.p.classId,
        });
    }
    for (const z of this.zones)
      if (z.time > 0 && z.node.mechanic !== "trap")
        current.set(
          `skill:zone:${z.node.id}:${(z.audioId ??= ++this.zoneSerial)}`,
          {
            skillId: z.node.id,
            position: z,
            duration: z.time,
            classId: this.p.classId,
          },
        );
    for (const [owner, cue] of this.soundOwners)
      if (!current.has(owner)) {
        this.combat.ctx.audioStopOwner?.(owner);
        this.combat.emit("skill.end", { ...cue });
      }
    for (const [owner, cue] of current)
      this.combat.ctx.audioSustain?.(owner, cue);
    this.soundOwners = current;
  }
  statuses = new Map<number, Affliction[]>();
  zones: Zone[] = [];
  buffs: Record<string, number> = {};
  spellHistory: string[] = [];
  stacks = 0;
  stationary = 0;
  idle = 0;
  combatTime = 0;
  lastSkill = "";
  lastTarget = -1;
  lastType = "";
  repeats = 0;
  shield = 0;
  lastCombo = 0;
  lifeSpent = 0;
  adaptiveStacks = 0;
  resourceTimer = 0;
  player: Player;
  classId: string;
  echoes: { enemy: Enemy; damage: number; time: number }[] = [];
  constructor(readonly combat: Combat) {
    this.player = combat.ctx.player;
    this.classId = this.player.classId;
  }
  get p() {
    return this.combat.ctx.player;
  }
  ensure() {
    if (this.player !== this.p || this.classId !== this.p.classId) {
      this.cancelAudio();
      this.player = this.p;
      this.classId = this.p.classId;
      this.statuses.clear();
      this.zones = [];
      this.buffs = {};
      this.stacks = 0;
      this.shield = 0;
      this.lastSkill = "";
      this.spellHistory = [];
      this.echoes = [];
      this.combatTime = 0;
    }
  }
  cap() {
    return this.p.classId === "assassino" ? 10 : 100;
  }
  resource(n: number) {
    if (this.p.classId === "arcanista")
      this.p.mp = Math.min(stats(this.p).maxMp, this.p.mp + n);
    else
      this.p.resource = Math.max(0, Math.min(this.cap(), this.p.resource + n));
  }
  has(b: number, i: number) {
    return has(this.p, b, i);
  }
  active(name: string) {
    return (this.buffs[name] ?? 0) > 0;
  }
  get(e: Enemy, kind: string) {
    return this.statuses.get(e.id)?.find((s) => s.kind === kind);
  }
  apply(e: Enemy, kind: string, time = 4, stacks = 1) {
    if (e.hp <= 0) return;
    const existing = this.get(e, kind);
    if (
      !existing &&
      [
        "burn",
        "poison",
        "bleed",
        "corruption",
        "rune",
        "root",
        "stun",
        "exposed",
      ].includes(kind)
    )
      this.combat.emit(
        kind === "stun" || kind === "exposed"
          ? "defense.break"
          : "status.apply",
        { position: e, status: kind },
      );
    if (e.maxHp >= 200 && ["root", "stun", "slow"].includes(kind)) {
      if (this.get(e, "controlResistance")) return;
      time *= 0.25;
      this.apply(e, "controlResistance", 3);
    }
    if (
      this.p.classId === "arcanista" &&
      profile(this.p).mastery === "arcanista-mastery-1" &&
      ["slow", "root", "corruption"].includes(kind)
    )
      time *= 1.5;
    let list = this.statuses.get(e.id);
    if (!list) this.statuses.set(e.id, (list = []));
    let old = list.find((s) => s.kind === kind);
    if (old) {
      old.time = Math.min(12, Math.max(old.time, time));
      old.stacks = Math.min(5, old.stacks + stacks);
    } else
      list.push({
        kind,
        time: Math.min(12, time),
        stacks: Math.min(5, stacks),
        tick: 0,
      });
  }
  update(dt: number) {
    this.ensure();
    this.combatTime = Math.max(0, this.combatTime - dt);
    this.idle += dt;
    this.stationary = this.p.action === "walk" ? 0 : this.stationary + dt;
    for (const key in this.buffs)
      this.buffs[key] = Math.max(0, this.buffs[key] - dt);
    if (!this.active("shield") && !this.active("guard")) this.shield = 0;
    if (!this.active("adaptive")) this.adaptiveStacks = 0;
    if (!this.active("lifeWindow")) {
      this.lifeSpent = 0;
      this.buffs.lifeWindow = 1;
    }
    if (this.idle > 4) this.stacks = 0;
    if (this.p.classId === "atirador" && this.stationary > 1)
      this.resource(dt * (this.has(0, 1) ? 12 : 6));
    if (this.active("fire"))
      for (const e of this.combat.ctx.enemies)
        if (e.hp > 0 && distance(e, this.p) < 1.4) this.apply(e, "burn", 3);
    if (this.p.classId === "assassino" && this.idle > 4) this.resource(-dt);
    if (this.p.classId === "assassino" && this.has(0, 9) && !this.combatTime)
      this.resource(dt * 0.4);
    for (const e of this.combat.ctx.enemies) {
      const list = this.statuses.get(e.id) ?? [];
      for (const s of list) {
        s.time -= dt;
        s.tick += dt;
        if (e.hp <= 0) continue;
        if (["burn", "poison", "bleed"].includes(s.kind) && s.tick >= 1) {
          s.tick -= 1;
          let amount = (3 + stats(this.p).attack * 0.07) * s.stacks;
          if (
            s.kind === "burn" &&
            this.has(0, 1) &&
            this.p.classId === "arcanista"
          )
            amount *= 1.4;
          if (s.kind === "poison" && this.p.classId === "assassino") {
            if (this.has(1, 1)) amount *= 1.4;
            if (this.has(1, 9) && e.hp / e.maxHp < 0.35) amount *= 1.5;
          }
          this.combat.hit(
            e,
            amount,
            s.kind === "poison"
              ? "#91ce86"
              : s.kind === "burn"
                ? "#fa8c55"
                : "#db7180",
            undefined,
            true,
          );
          if (
            s.kind === "poison" &&
            this.p.classId === "assassino" &&
            this.has(1, 5)
          )
            this.apply(e, "weaken", 2);
        }
      }
      this.statuses.set(
        e.id,
        list.filter((s) => s.time > 0 && e.hp > 0),
      );
    }
    for (const echo of this.echoes) {
      echo.time -= dt;
      if (echo.time <= 0)
        this.combat.hit(echo.enemy, echo.damage, "#ab9bff", undefined, true);
    }
    this.echoes = this.echoes.filter((e) => e.time > 0);
    for (const z of this.zones) {
      z.time -= dt;
      z.age += dt;
      z.tick -= dt;
      const enemies = this.combat.ctx.enemies.filter(
        (e) => e.hp > 0 && distance(e, z) < z.radius,
      );
      if (z.node.mechanic === "trap" && !z.triggered && enemies.length) {
        this.combat.emit("skill.activate", {
          position: z,
          skillId: z.node.id,
          element: "fire",
          group: "device.detonation",
        });
        z.triggered = true;
        z.time = 0;
        for (const e of enemies) {
          this.combat.hit(
            e,
            z.node.skill!.damage + stats(this.p).attack * 0.3,
            z.node.color,
            z.node.id,
          );
          this.apply(
            e,
            z.node.index === 4 || z.node.element === "hunt" ? "root" : "slow",
            2,
          );
          if (hybrid(this.p, 2) && this.p.classId === "atirador")
            this.apply(e, "mark", 5);
        }
        if (this.has(1, 11) && this.p.classId === "atirador")
          this.reduceCooldowns(1, "device");
      }
      if (z.node.mechanic === "pull")
        for (const e of enemies) {
          const n = normalize({ x: z.x - e.x, y: z.y - e.y });
          this.combat.ctx.world.move(e, {
            x: n.x * dt * 1.7,
            y: n.y * dt * 1.7,
          });
        }
      if (z.tick <= 0) {
        z.tick = 1;
        const targets =
          z.node.mechanic === "turret"
            ? enemies
                .slice()
                .sort((a, b) =>
                  z.node.index === 10
                    ? b.hp - a.hp
                    : distance(a, z) - distance(b, z),
                )
                .slice(
                  0,
                  profile(this.p).mastery === "atirador-mastery-1" ? 2 : 1,
                )
            : enemies;
        if (z.node.mechanic === "turret" && targets.length)
          this.combat.emit("attack.swing", {
            position: z,
            classId: "atirador",
            element: "precision",
            group: `turret:${z.audioId}`,
          });
        for (const e of targets) {
          if (z.node.element === "steel") this.apply(e, "weaken", 2);
          else if (z.node.element === "rune" && z.node.index === 2)
            this.apply(e, "slow", 2);
          else if (z.node.element === "arcane") this.apply(e, "slow", 2);
          else if (z.node.element === "hunt") this.apply(e, "mark", 3);
          else if (z.node.element === "device" && z.node.index === 8)
            this.apply(e, "slow", 2);
          else {
            let damage =
              (z.node.skill!.damage + stats(this.p).attack * 0.3) * 0.25;
            if (z.node.element === "device" && this.has(1, 5) && z.age > 2)
              damage *= 1.4;
            this.combat.hit(e, damage, z.node.color, z.node.id);
            if (z.node.element === "rune" && z.node.type === "ultimate")
              this.apply(e, "rune", 6);
            if (z.node.element === "void" && z.node.type === "ultimate")
              this.apply(e, "corruption", 6);
          }
        }
        this.combat.effect("nova", z, z.node.color, z.radius, 0.65);
      }
      if (z.time <= 0 && z.node.mechanic === "pull")
        for (const e of enemies)
          this.combat.hit(
            e,
            z.node.skill!.damage + stats(this.p).attack * 0.3,
            z.node.color,
            z.node.id,
          );
      if (z.time <= 0 && z.node.element === "device" && this.has(1, 9))
        this.reduceCooldowns(0.8, "device");
    }
    this.zones = this.zones.filter((z) => z.time > 0);
    this.syncAudio();
  }
  reduceCooldowns(n: number, element?: string) {
    for (const id in this.p.skillCooldowns)
      if (!element || NODE_BY_ID.get(id)?.element === element) {
        const before = this.p.skillCooldowns[id];
        this.p.skillCooldowns[id] = Math.max(0, before - n);
        if (
          before > 0 &&
          this.p.skillCooldowns[id] === 0 &&
          profile(this.p).bar.includes(id)
        )
          this.combat.emit("skill.ready", { skillId: id });
      }
  }
  before(n: Node | undefined): boolean {
    this.ensure();
    if (!n) return true;
    if (n.type === "ultimate") {
      const amount = this.p.classId === "assassino" ? 8 : 60;
      const available =
        this.p.classId === "arcanista" ? this.p.mp : this.p.resource;
      if (available < amount) {
        this.combat.ctx.notify(
          `Suprema exige ${amount} ${this.p.classId === "arcanista" ? "Essência" : "de recurso"}.`,
        );
        return false;
      }
    }
    if (
      n.classId === "assassino" &&
      n.branch === 2 &&
      n.index === 4 &&
      !this.active("perfect")
    ) {
      this.combat.ctx.notify(
        "Contra-ataque exige uma esquiva precisa recente.",
      );
      return false;
    }
    if (
      n.classId === "assassino" &&
      n.branch === 0 &&
      n.index === 12 &&
      !this.combat.ctx.enemies.some(
        (e) => e.hp > 0 && e.hp / e.maxHp <= 0.4 && distance(e, this.p) < 10,
      )
    ) {
      this.combat.ctx.notify(
        "Execução Sombria exige um alvo com 40% de vida ou menos.",
      );
      return false;
    }
    return true;
  }
  cast(n: Node | undefined) {
    if (!n) return;
    const p = this.p;
    if (
      n.type !== "ultimate" &&
      p.classId !== "arcanista" &&
      p.resource >= (p.classId === "assassino" ? 3 : 20)
    ) {
      this.resource(-(p.classId === "assassino" ? 3 : 20));
      this.buffs.empowered = 1;
    }
    if (n.type === "ultimate") this.lastCombo = p.resource;
    if (n.type === "ultimate" && p.classId !== "arcanista")
      this.resource(-(p.classId === "assassino" ? 8 : 60));
    if (p.classId === "guerreiro" && n.branch === 0 && n.index === 13) {
      p.guard = 6;
      this.buffs.fortress = 6;
    }
    if (p.classId === "arcanista") {
      if (this.has(2, 5) && this.lastSkill && this.lastSkill !== n.id)
        this.reduceCooldowns(0.6);
      this.spellHistory.push(n.mechanic ?? n.skill?.kind ?? n.element);
      this.spellHistory = this.spellHistory.slice(-3);
      if (this.has(2, 9) && new Set(this.spellHistory).size === 3)
        this.buffs.convergence = 5;
      if (this.has(0, 10) && n.element === "fire") this.buffs.fuel = 4;
      if (hybrid(p, 1) && this.lastType !== n.element) this.buffs.solar = 4;
      if (hybrid(p, 2) && n.mechanic === "dash") this.buffs.duplicate = 5;
    }
    if (
      p.classId === "guerreiro" &&
      this.has(2, 7) &&
      this.lastSkill !== n.id &&
      n.element === "rune"
    )
      this.reduceCooldowns(0.8, "rune");
    if (p.classId === "assassino" && this.has(2, 7) && this.lastSkill !== n.id)
      this.resource(1);
    this.lastSkill = n.id;
    this.lastType = n.element;
  }
  resolve(a: PendingAttack): boolean {
    const definition = NODE_BY_ID.get(a.skill.id);
    const n = definition ? { ...definition, skill: a.skill } : undefined;
    if (!n || !n.mechanic) return false;
    const p = this.p,
      c = this.combat.ctx,
      near = c.enemies
        .filter((e) => e.hp > 0 && distance(e, p) < a.skill.range)
        .sort((x, y) => distance(x, p) - distance(y, p));
    const target = {
      x:
        p.x +
        a.aim.x * Math.min(a.target ? distance(p, a.target) : 3, a.skill.range),
      y:
        p.y +
        a.aim.y * Math.min(a.target ? distance(p, a.target) : 3, a.skill.range),
    };
    switch (n.mechanic) {
      case "guard":
        this.buffs[n.id] = 5;
        if (n.classId === "arcanista" && n.index === 8) this.buffs[n.id] = 6;
        p.guard = 5;
        this.buffs.guard = 5;
        this.buffs.perfectGuard = 0.65;
        this.shield = stats(p).maxHp * 0.2;
        this.buffs.shield = 5;
        this.combat.effect("heal", p, n.color, 1, 1);
        return true;
      case "stealth":
        this.buffs[n.id] = n.index === 8 ? 3 : 6;
        this.buffs.stealth = n.index === 8 ? 3 : 6;
        this.combat.effect("dash", p, n.color, 1, 0.5);
        return true;
      case "buff":
        this.buffs[n.element] = 7;
        this.buffs[n.id] = 7;
        if (n.element === "blood") {
          this.buffs.frenzy = 7;
          this.buffs.frenzyMax = 12;
        }
        if (n.classId === "atirador") this.buffs.focused = 8;
        this.combat.effect("heal", p, n.color, 1, 1);
        return true;
      case "cleanse":
        this.buffs.cleanse = 6;
        this.buffs.stealth = 0;
        p.invulnerable = 1;
        this.combat.effect("heal", p, n.color, 1, 1);
        return true;
      case "duplicate":
        this.buffs.duplicate = 7;
        this.combat.effect("heal", p, n.color, 1, 1);
        return true;
      case "mark": {
        const selected = near.sort(
          (e, f) =>
            Math.hypot(e.x - target.x, e.y - target.y) -
            Math.hypot(f.x - target.x, f.y - target.y),
        )[0];
        for (const e of n.classId === "guerreiro" || n.element === "device"
          ? near
          : selected
            ? [selected]
            : []) {
          this.apply(
            e,
            n.classId === "guerreiro" && n.branch === 0
              ? "taunt"
              : n.classId === "guerreiro" || n.element === "void"
                ? "root"
                : n.element === "poison"
                  ? "slow"
                  : "mark",
            8,
          );
          if (n.element === "poison") this.apply(e, "poison", 7, 2);
          if (n.element === "void") this.apply(e, "corruption", 8);
          if (n.type === "ultimate") this.apply(e, "exposed", 10, 3);
          this.combat.effect("impact", e, n.color, 1, 0.5);
        }
        return true;
      }
      case "trap":
      case "turret":
      case "zone":
      case "pull": {
        let time = n.type === "ultimate" ? 10 : 6;
        if (n.element === "device" && this.has(1, 3)) time *= 1.4;
        if (n.element === "device" && this.has(1, 13)) time += 2;
        const at = ["turret", "trap", "pull"].includes(n.mechanic)
          ? target
          : { x: p.x, y: p.y };
        this.zones.push({
          ...at,
          node: n,
          time,
          tick: 0,
          radius: n.type === "ultimate" ? 4 : n.mechanic === "turret" ? 6 : 2.5,
          age: 0,
          triggered: false,
        });
        if (n.element === "arcane" && n.index >= 12) {
          this.buffs.amplify = time;
          if (n.type === "ultimate") this.buffs.absolute = time;
        }
        if (n.element === "steel" && n.type === "ultimate") {
          p.guard = time;
          this.buffs.guard = time;
        }
        if (n.element === "device" && n.type === "ultimate")
          for (const kind of ["trap", "turret"] as const)
            this.zones.push({
              ...at,
              x: at.x + (kind === "trap" ? 1 : -1),
              node: { ...n, mechanic: kind },
              time,
              tick: 0,
              radius: kind === "turret" ? 6 : 2,
              age: 0,
              triggered: false,
            });
        return true;
      }
      case "detonate": {
        if (n.element === "device") {
          const devices = this.zones.filter(
            (z) => z.node.element === "device" && distance(z, p) < 12,
          );
          for (const z of devices) {
            for (const e of c.enemies)
              if (e.hp > 0 && distance(e, z) < 3)
                this.combat.hit(
                  e,
                  a.skill.damage + stats(p).attack * 0.3,
                  n.color,
                  n.id,
                );
            z.time = 0;
            this.combat.effect("nova", z, n.color, 3, 0.8);
          }
          return true;
        }
        for (const e of near) {
          const marks = this.get(
            e,
            n.element === "void" ? "corruption" : "rune",
          );
          if (marks) {
            this.combat.hit(
              e,
              (a.skill.damage + stats(p).attack * 0.3) *
                (1 + marks.stacks * 0.25),
              n.color,
              n.id,
            );
            marks.time = 0;
          }
        }
        this.combat.effect("nova", p, n.color, 3, 0.8);
        return true;
      }
      case "multi":
        for (let i = 0; i < 3; i++)
          for (const e of near) {
            this.echoes.push({
              enemy: e,
              damage:
                a.skill.damage *
                0.4 *
                (n.type === "ultimate" ? 1 + this.lastCombo * 0.08 : 1),
              time: 0.15 + i * 0.15,
            });
          }
        this.combat.effect(
          "slash",
          p,
          n.color,
          a.skill.range,
          0.7,
          Math.atan2(a.aim.y, a.aim.x),
        );
        return true;
      default:
        return false;
    }
  }
  projectile(n: Node | undefined) {
    if (!n) return { pierce: false, ricochet: false };
    const duplicate = this.active("duplicate");
    if (duplicate) this.buffs.duplicate = 0;
    return {
      pierce:
        n.element === "void" ||
        (this.p.classId === "atirador" &&
          profile(this.p).mastery === "atirador-mastery-0") ||
        (n.classId === "atirador" &&
          [4, 12, 14].includes(n.index) &&
          n.branch === 0),
      ricochet: n.classId === "atirador" && n.branch === 0 && n.index === 8,
      duplicate,
      boomerang: n.classId === "assassino" && n.branch === 0 && n.index === 10,
      ghost: n.classId === "atirador" && n.branch === 0 && n.index === 12,
    };
  }
  enchantment() {
    return [2, 1]
      .map((b) => NODE_BY_ID.get(`${this.p.classId}-${b}-0`))
      .find((n) => n?.mechanic === "buff" && this.active(n.id));
  }
  amplify(e: Enemy, amount: number, source?: string) {
    const p = this.p,
      n = NODE_BY_ID.get(source ?? ""),
      ratio = e.hp / e.maxHp;
    let factor = 1;
    const enchanted = this.enchantment();
    if (enchanted && owns(p, `${enchanted.id}-up-0`)) factor += 0.25;
    if (this.active("empowered") && n) factor += 0.25;
    if (this.active("rune")) factor += 0.2;
    if (this.get(e, "exposed")) factor += 0.2;
    if (this.get(e, "mark")) factor += 0.15;
    if (this.active("amplify")) factor += 0.25;
    if (this.active("absolute")) factor += 0.2;
    if (p.classId === "guerreiro") {
      if (this.has(1, 1)) factor += Math.min(5, this.stacks) * 0.04;
      if (this.has(1, 8) && ratio < 0.35) factor += 0.3;
      if (this.has(1, 6) && this.active("pain")) factor += 0.2;
      if (this.has(0, 3) && this.active("reactive")) {
        factor += 0.4;
        this.buffs.reactive = 0;
      }
      if (this.has(0, 12) && this.get(e, "taunt")) factor += 0.2;
      if (this.has(1, 12) && p.resource >= 90) {
        factor += 0.4;
        this.resource(-30);
      }
      if (this.active("frenzy")) factor += 0.3;
      if (n?.element === "rune" && this.has(2, 9)) {
        const item = ITEMS.find((i) => i.id === p.equipment.weapon);
        factor += item?.element === "rune" ? 0.3 : 0.15;
      }
      if (n?.branch === 1 && n.index === 3 && ratio > 0.7) factor += 0.5;
      if (n?.branch === 1 && n.index === 11 && ratio < 0.4) factor += 1;
      if (hybrid(p, 0) && this.active("reactiveHybrid")) {
        factor += 0.4;
        this.buffs.reactiveHybrid = 0;
      }
    }
    if (p.classId === "arcanista") {
      if (n?.element === "void" && this.get(e, "corruption") && this.has(1, 3))
        factor += 0.3;
      if (n?.element === "fire") {
        if (this.has(0, 4) && this.lastTarget === e.id)
          factor += Math.min(this.repeats, 4) * 0.06;
        if (this.active("fuel")) factor += 0.15;
        if (this.has(0, 13))
          factor +=
            this.combat.ctx.enemies.filter(
              (x) => x.hp > 0 && distance(x, e) < 2,
            ).length <= 1
              ? 0.35
              : -0.15;
        if (hybrid(p, 0) && this.get(e, "corruption")) factor += 0.35;
      }

      if (this.active("convergence")) factor += 0.2;
      if (this.active("distortion") && n?.skill?.kind === "projectile")
        factor += 0.15;
      if (this.active("solar")) factor += 0.2;
    }
    if (p.classId === "assassino") {
      const v = facing(e.direction),
        away = normalize({ x: p.x - e.x, y: p.y - e.y });
      const back = v.x * away.x + v.y * away.y < -0.4;
      if (back) factor += 0.2;
      if (this.active("stealth")) {
        if (this.has(0, 3)) factor += 0.6;
        if (n?.branch === 0 && n.index === 0) factor += 0.3;
        this.buffs.opening = 1;
        this.buffs.stealth = 0;
      }
      if (this.has(2, 5) && this.active("perfect")) factor += 0.35;
      if (this.has(2, 9) && this.active("reposition")) factor += 0.25;
      if (this.has(2, 11) && p.resource >= 9) {
        factor += 0.5;
        this.resource(-5);
      }
      if (n?.branch === 0 && n.index === 12 && ratio <= 0.4) factor += 1;
    }
    if (p.classId === "atirador") {
      if (this.has(0, 1) && this.stationary > 1) factor += 0.15;
      if (this.has(0, 3) && this.get(e, "mark")) factor += 0.3;
      if (this.has(0, 5) && this.idle < 2) factor += 0.1;
      if (this.has(0, 7) && this.get(e, "mark") && !this.get(e, "firstshot")) {
        factor += 0.4;
        this.apply(e, "firstshot", 8);
      }
      if (this.has(0, 11) && distance(p, e) >= 3 && distance(p, e) <= 8)
        factor += 0.25;
      if (this.has(0, 13) && e.maxHp >= 200 && this.lastTarget === e.id)
        factor += Math.min(this.repeats, 5) * 0.05;
      if (this.has(2, 5) && this.stationary > 2 && this.idle > 2) factor += 0.3;
      if (
        this.has(2, 7) &&
        this.combat.ctx.enemies.find((x) => x.id === this.lastTarget)?.type ===
          e.type
      )
        factor += Math.min(this.repeats, 5) * 0.04;
      if (this.has(1, 7) && this.get(e, "mark")) factor += 0.1;
      if (this.has(2, 13) && e.maxHp >= 200) factor += 0.25;
      if (this.active("focused")) {
        factor += 0.5;
        this.buffs.focused = 0;
      }
      if (n?.element === "hunt" && n.index === 4 && this.get(e, "mark"))
        factor += 0.5;
      if (hybrid(p, 1) && this.get(e, "mark"))
        factor += Math.min(this.repeats, 5) * 0.06;
    }
    if (n?.mechanic === "channel") factor += 0.5;
    if (
      n &&
      n.branch >= 0 &&
      profile(p).mastery === `${p.classId}-mastery-${n.branch}`
    )
      factor += 0.15;
    return amount * Math.max(0.1, factor);
  }
  afterHit(e: Enemy, damage: number, source?: string) {
    const p = this.p,
      n = NODE_BY_ID.get(source ?? "") ?? this.enchantment();
    this.combatTime = 6;
    this.repeats = this.lastTarget === e.id ? Math.min(5, this.repeats + 1) : 1;
    this.lastTarget = e.id;
    this.stacks = Math.min(5, this.stacks + 1);
    this.resource(
      p.classId === "guerreiro"
        ? this.has(1, 2)
          ? 12
          : 7
        : p.classId === "assassino"
          ? 1
          : p.classId === "atirador"
            ? this.get(e, "mark")
              ? this.has(0, 9)
                ? 15
                : 10
              : 4
            : 0,
    );
    if (p.classId === "guerreiro") {
      if (n?.branch === 1 && n.index === 7)
        p.mp = Math.max(0, p.mp - 2 * this.stacks);
      if (this.has(1, 4) && (n?.skill?.damage ?? 0) >= 50)
        this.apply(e, "bleed", 5);
      if (this.has(1, 10) && this.active("frenzy")) {
        const allowance = Math.max(0, stats(p).maxHp * 0.05 - this.lifeSpent);
        const healing = Math.min(allowance, damage * 0.12);
        p.hp = Math.min(stats(p).maxHp, p.hp + healing);
        this.lifeSpent += healing;
      }
      if (this.has(2, 1)) this.apply(e, "rune", 6);
      if (this.has(2, 9) && (this.active("rune") || n?.element === "rune")) {
        const element = ITEMS.find((i) => i.id === p.equipment.weapon)?.element;
        if (element === "fire") this.apply(e, "burn", 4);
        if (element === "lightning") this.apply(e, "slow", 2);
        if (element === "rune") this.apply(e, "rune", 6, 2);
      }
      if (this.has(2, 3) && this.get(e, "rune")) this.buffs.runeArmor = 4;
      if (n?.branch === 0 && [0, 11].includes(n.index))
        this.apply(
          e,
          n.index === 11 ? "root" : "stun",
          n.index === 11 ? 2 : 0.6,
        );
      if (n?.branch === 0 && n.index === 8) this.apply(e, "exposed", 5);
      if (
        n?.element === "rune" &&
        (this.has(2, 5) || hybrid(p, 2)) &&
        this.get(e, "rune")?.stacks === 5
      ) {
        this.get(e, "rune")!.time = 0;
        this.echoes.push({ enemy: e, damage: damage * 0.4, time: 0.3 });
        if (this.has(2, 10) || profile(p).mastery === `${p.classId}-mastery-2`)
          for (const other of this.combat.ctx.enemies)
            if (other !== e && other.hp > 0 && distance(other, e) < 2)
              this.apply(other, "rune", 6, 2);
      }
    }
    if (p.classId === "arcanista") {
      if (n?.branch === 2 && n.index === 10) this.apply(e, "stun", 0.8);
      if (n?.element === "fire") {
        this.apply(e, "burn", this.has(0, 2) ? 8 : 4);
        if (this.has(0, 12) && this.get(e, "burn")) this.resource(2);
      }
      if (n?.element === "void" && this.has(1, 1))
        this.apply(e, "corruption", this.has(1, 10) ? 10 : 6);
      if (this.has(1, 5) && this.get(e, "corruption")) this.resource(2);
      if (this.has(1, 9) && n)
        this.echoes.push({ enemy: e, damage: damage * 0.2, time: 0.6 });
    }
    if (p.classId === "assassino") {
      if (
        this.active("poison") ||
        n?.element === "poison" ||
        (hybrid(p, 0) && this.active("opening"))
      ) {
        const old = this.get(e, "poison");
        const time = this.has(1, 13) ? 8 : 5;
        this.apply(
          e,
          "poison",
          time,
          hybrid(p, 0) && this.active("opening") ? 2 : 1,
        );
        if (old && this.has(1, 3)) old.time = Math.min(12, old.time + 2);
        if (this.has(1, 5)) this.apply(e, "weaken", 4);
        if (this.has(1, 7) && this.repeats >= 2) this.apply(e, "slow", 3);
      }
      if (hybrid(p, 2) && this.get(e, "poison"))
        this.get(e, "poison")!.time = Math.min(
          12,
          this.get(e, "poison")!.time + 1,
        );
      const face = facing(e.direction),
        toward = normalize({ x: p.x - e.x, y: p.y - e.y });
      if (this.has(0, 7) && face.x * toward.x + face.y * toward.y < -0.4)
        for (const status of this.statuses.get(e.id) ?? [])
          status.time = Math.min(12, status.time + 1);
      if (this.has(0, 11) && this.active("opening"))
        this.echoes.push({ enemy: e, damage: damage * 0.3, time: 0.5 });
      if (n?.branch === 2 && n.index === 10) this.apply(e, "stun", 1);
      if (n?.element === "poison" && n.index === 8) this.apply(e, "exposed", 5);
      if (n?.element === "poison" && n.index === 11) {
        this.apply(e, "poison", 8, 2);
        this.apply(e, "slow", 3);
      }
    }
    if (p.classId === "atirador") {
      if (n?.element === "hunt" && [0, 12].includes(n.index))
        this.apply(e, "mark", 8);
      if (n?.branch === 0 && n.index === 10) this.apply(e, "weaken", 4);
      if (n?.element === "hunt" && n.index === 10) this.apply(e, "stun", 1);
      if (n?.element === "device" && hybrid(p, 0)) this.apply(e, "mark", 5);
    }
    if (n && owns(p, `${n.id}-up-1`)) {
      this.shield = stats(p).maxHp * 0.12;
      this.buffs.shield = 3;
    }
    if (n && owns(p, `${n.id}-up-2`)) this.apply(e, "exposed", 4);
    if (n && owns(p, `${n.id}-up-0`)) this.apply(e, "stun", 0.4);
    if (e.hp <= 0) this.killed(e, n);
    this.idle = 0;
  }
  killed(e: Enemy, n?: Node) {
    const p = this.p;
    p.challenges.kills++;
    if (p.classId === "guerreiro" && this.has(1, 13) && this.active("frenzy"))
      this.buffs.frenzy = Math.min(12, this.buffs.frenzy + 1.5);
    if (p.classId === "arcanista") {
      if (this.has(1, 12) && this.get(e, "corruption")) {
        this.resource(8);
        p.hp = Math.min(stats(p).maxHp, p.hp + 12);
      }
      if (this.has(2, 11) && n) this.resource(n.skill!.cost * 0.3);
      if (this.get(e, "burn"))
        for (const other of this.combat.ctx.enemies)
          if (other.hp > 0 && distance(e, other) < 2) {
            if (this.has(0, 8)) this.apply(other, "burn", 4);
            if (
              this.has(0, 6) ||
              profile(p).mastery === `${p.classId}-mastery-0`
            )
              this.echoes.push({ enemy: other, damage: 15, time: 0.3 });
          }
    }
    if (p.classId === "assassino") {
      if (this.has(0, 5) && this.active("opening"))
        this.buffs.hiddenPresence = 5;
      if (
        profile(p).mastery === `${p.classId}-mastery-0` &&
        this.active("opening")
      )
        this.buffs.stealth = 2;
      if (this.has(0, 13) && this.get(e, "mark"))
        this.reduceCooldowns(2, "shadow");
      if (this.has(1, 10) && this.get(e, "poison"))
        for (const other of this.combat.ctx.enemies)
          if (
            other.hp > 0 &&
            distance(e, other) <
              (profile(p).mastery === `${p.classId}-mastery-1` ? 3 : 2)
          )
            this.apply(other, "poison", 4);
    }
    if (p.classId === "atirador" && this.has(2, 11) && e.type === "wolf") {
      const before = p.potions[2];
      p.potions[2] = Math.min(20, p.potions[2] + 1);
      if (p.potions[2] > before) this.combat.ctx.pickup?.("potion-2");
    }
  }
  slow(e: Enemy) {
    if (this.get(e, "root") || this.get(e, "stun")) return 0;
    return this.get(e, "slow") ? 0.45 : 1;
  }
  detection() {
    return this.active("stealth")
      ? 0
      : this.active("hiddenPresence")
        ? 1.5
        : this.p.classId === "assassino" && this.has(0, 1)
          ? 3.5
          : 5.5;
  }
  outgoing(e: Enemy) {
    let factor = this.get(e, "weaken") ? 0.7 : 1;
    if (
      this.p.classId === "guerreiro" &&
      this.has(2, 12) &&
      this.get(e, "rune")
    )
      factor *= 0.8;
    return factor;
  }
  incoming(amount: number, attacker?: Enemy) {
    const p = this.p;
    this.combatTime = 6;
    if (p.invulnerable > 0) {
      if (p.classId === "assassino" && this.active("dodgeWindow")) {
        this.buffs.perfect = this.has(2, 1) ? 2 : 1;
        this.resource(2);
        if (this.has(2, 13))
          this.reduceCooldowns(
            profile(p).mastery === `${p.classId}-mastery-2` ? 2 : 1,
          );
        this.combat.ctx.notify("Esquiva precisa!");
      }
      return 0;
    }
    if (p.classId === "guerreiro") {
      if (this.has(0, 1) && (p.action !== "walk" || this.active("fortress")))
        amount *= 0.8;
      if (this.has(0, 5)) {
        amount *= 1 - Math.min(0.25, this.adaptiveStacks * 0.05);
        this.adaptiveStacks = Math.min(5, this.adaptiveStacks + 1);
        this.buffs.adaptive = 5;
      }
      if (this.has(0, 9)) amount *= 0.9;
      if (profile(p).mastery === `${p.classId}-mastery-0` && p.guard > 0)
        amount *= 0.65;
      if (
        this.has(0, 10) &&
        p.hp < stats(p).maxHp * 0.3 &&
        !this.active("lastLineCD")
      ) {
        this.shield = stats(p).maxHp * 0.25;
        this.buffs.shield = 4;
        this.buffs.lastLineCD = 30;
      }
      if (this.has(2, 3) && this.active("runeArmor")) amount *= 0.85;
      if (this.has(1, 6)) this.buffs.pain = 4;
      if (
        this.active("frenzy") &&
        profile(p).mastery !== `${p.classId}-mastery-1`
      )
        amount *= 1.2;
      if (p.guard > 0) {
        this.resource(10);
        if (this.has(0, 3)) this.buffs.reactive = 5;
        if (hybrid(p, 0)) this.buffs.reactiveHybrid = 5;
        if (this.has(0, 7) && this.active("perfectGuard") && attacker)
          this.combat.hit(
            attacker,
            stats(p).attack * 0.5,
            "#e0b780",
            undefined,
            true,
          );
        if (hybrid(p, 1) && attacker) this.apply(attacker, "weaken", 4);
      }
    }
    if (
      p.classId === "atirador" &&
      this.has(2, 3) &&
      attacker &&
      this.get(attacker, "mark")
    )
      this.buffs.huntSpeed = 3;
    if (this.active("cleanse")) amount *= 0.7;
    if (
      p.classId === "arcanista" &&
      this.active(`${p.classId}-2-8`) &&
      !this.active("etherCD")
    ) {
      this.shield += amount * 0.35;
      this.buffs.shield = 4;
      this.buffs.etherCD = 8;
    }
    const absorbed = Math.min(this.shield, amount);
    this.shield -= absorbed;
    return Math.max(0, amount - absorbed);
  }
  dash(n?: Node) {
    if (n?.element === "rune" && n.index === 6) {
      this.zones.push({
        x: this.p.x,
        y: this.p.y,
        node: { ...n, mechanic: "zone" },
        time: 4,
        tick: 0,
        radius: 1.5,
        age: 0,
        triggered: false,
      });
    }
    if (this.p.classId === "assassino") {
      this.buffs.dodgeWindow = this.has(2, 1) ? 0.65 : 0.45;
      this.buffs.reposition = 3;
      if (hybrid(this.p, 1)) this.buffs.stealth = 2;
    }
    if (this.p.classId === "arcanista" && this.has(1, 7))
      this.buffs.distortion = 4;
    if (n?.element === "hunt") {
      this.buffs.decoy = 4;
      if (this.has(2, 9))
        for (const e of this.combat.ctx.enemies)
          if (e.hp > 0 && distance(e, this.p) < 3) this.apply(e, "exposed", 4);
    }
  }
  attackSpeed() {
    return (
      (this.active("frenzy") ? 0.7 : 1) *
      (this.p.classId === "assassino" && this.has(2, 3)
        ? 1 - Math.min(5, this.stacks) * 0.04
        : 1)
    );
  }
  speed() {
    return this.p.classId === "atirador" &&
      profile(this.p).mastery === "atirador-mastery-2" &&
      this.combatTime > 0
      ? 1.15
      : this.active("fortress")
        ? 0.55
        : this.active("huntSpeed")
          ? 1.3
          : this.active("fire")
            ? 1.2
            : 1;
  }
  snapshot() {
    return {
      resource: this.p.classId === "arcanista" ? this.p.mp : this.p.resource,
      shield: this.shield,
      buffs: { ...this.buffs },
      zones: this.zones.map((z) => ({
        x: z.x,
        y: z.y,
        name: z.node.name,
        time: z.time,
      })),
      statuses: Object.fromEntries(this.statuses),
    };
  }
}
