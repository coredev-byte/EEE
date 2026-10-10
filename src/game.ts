import { type AudioEvent, type AudioCue } from "./audio-catalog";
import { syncPoints, learn, profile, equippedSkills } from "./skills";
import { ACTOR_HEIGHT } from "./spatial";
import { CLASSES, ITEMS, type ClassId } from "./data";
import { direction } from "./animation";
import { Assets } from "./assets";
import { AudioEngine } from "./audio";
import { Combat } from "./combat";
import { updateEnemies } from "./enemies";
import { Input } from "./input";
import { Renderer } from "./renderer";
import { load, serialize, SAVE_KEY } from "./save";
import {
  createPlayer,
  createEnemies,
  gainXp,
  stats,
  equip,
  type Player,
  type Enemy,
  type Effect,
  type DamageText,
  type Projectile,
  type Quest,
} from "./state";
import { World, distance, normalize, PORTAL, type Point } from "./world";
export class Game {
  world = new World();
  player: Player = createPlayer();
  enemies: Enemy[] = createEnemies();
  quest: Quest = { stage: 0, kills: 0, rewardClaimed: false };
  effects: Effect[] = [];
  texts: DamageText[] = [];
  projectiles: Projectile[] = [];
  assets = new Assets();
  audio = new AudioEngine();
  input!: Input;
  renderer!: Renderer;
  combat: Combat;
  paused = true;
  started = false;
  time = 0;
  saveTimer = 0;
  stepTimer = 0;
  saveStatus = "Ainda não salvo";
  message = "";
  messageTimer = 0;
  onUpdate: () => void = () => {};
  onMenu: (panel: string) => void = () => {};
  onDialogue: () => void = () => {};
  dialogueOpen = false;
  dialogueStep = 0;
  pickups: {
    id: string;
    name: string;
    rarity: string;
    description: string;
    icon: number;
    count: number;
    time: number;
  }[] = [];
  onDeath: () => void = () => {};
  onStart: () => void = () => {};
  last = 0;
  canvas!: HTMLCanvasElement;
  constructor() {
    this.combat = new Combat(this);
  }
  bindInput(canvas: HTMLCanvasElement) {
    this.input = new Input(canvas);
    this.combat = new Combat(this);
    this.input.onAttack = () => {
      this.audio.unlock();
      if (!this.paused) this.combat.attack(this.target());
    };
    this.input.onKey = (k) => this.key(k);
  }
  async init() {
    this.canvas = document.querySelector<HTMLCanvasElement>("#game")!;
    this.bindInput(this.canvas);
    this.audio.prepare();
    await this.assets.load();
    this.renderer = new Renderer(this.canvas, this.assets, this.world);
    const s = load();
    if (s) {
      this.player = s.player;
      this.quest = s.quest;
      for (const p of this.world.props) p.opened = s.opened.includes(p.id);
      for (const e of this.enemies)
        if (s.killed.includes(e.id)) {
          e.hp = 0;
          e.rewarded = true;
          e.state = "dead";
          e.timer = 3;
        }
    }
    this.renderer.snap(this.player);
    requestAnimationFrame((t) => this.tick(t));
  }
  skillHeld = (id: string) => {
    const index = profile(this.player).bar.indexOf(id);
    return index >= 0 && this.input?.keys.has(String(index + 1));
  };
  audioSustain = (owner: string, cue: AudioCue) =>
    this.audio.sustain(owner, cue);
  audioStopOwner = (owner: string) => this.audio.stopOwner(owner);
  audioEvent = (event: AudioEvent, cue: AudioCue = {}) =>
    this.audio.emit(event, {
      classId: this.player.classId,
      weaponId: this.player.equipment.weapon,
      armorId: this.player.equipment.armor,
      ...cue,
    });
  sound = (kind: "attack" | "hit" | "magic" | "death") =>
    this.audioEvent(
      (
        {
          attack: "attack.swing",
          hit: "impact.hit",
          magic: "skill.activate",
          death: "enemy.death",
        } as const
      )[kind],
      { position: this.player },
    );
  pickup = (id: string, count = 1) => {
    const item = ITEMS.find((i) => i.id === id),
      potion = id.startsWith("potion-") ? Number(id.slice(7)) : -1;
    const details = item
      ? {
          name: item.name,
          rarity: item.rarity,
          description: item.description,
          icon: item.icon,
        }
      : id === "coins"
        ? {
            name: "Moedas de Pedralta",
            rarity: "Comum",
            description: "Moeda usada em equipamentos e reconfigurações.",
            icon: 8,
          }
        : {
            name:
              ["Poção de vida", "Poção de mana", "Elixir"][potion] ?? "Recurso",
            rarity: "Comum",
            description: "Consumível adicionado à mochila.",
            icon: potion + 4,
          };
    const old = this.pickups.find((x) => x.id === id && x.time < 1);
    if (old) {
      old.count += count;
      old.time = 0;
    } else this.pickups.push({ id, ...details, count, time: 0 });
    this.pickups = this.pickups.slice(-4);
    this.audioEvent(
      id === "coins"
        ? "loot.coins"
        : id === "runa"
          ? "loot.quest"
          : details.rarity === "Comum"
            ? "loot.common"
            : "loot.rare",
      {
        rarity: details.rarity,
      },
    );
  };
  notify = (text: string) => {
    this.message = text;
    this.messageTimer = 4;
    this.onUpdate();
  };
  target(): Point | undefined {
    if (!this.input.pointerActive) return undefined;
    const pointer = this.input.pointer;
    const clicked = this.enemies
      .filter((e) => e.hp > 0)
      .map((e) => ({ enemy: e, screen: this.renderer.project(e) }))
      .sort(
        (a, b) =>
          Math.hypot(
            a.screen.x - pointer.x,
            a.screen.y - ACTOR_HEIGHT.aim - pointer.y,
          ) -
          Math.hypot(
            b.screen.x - pointer.x,
            b.screen.y - ACTOR_HEIGHT.aim - pointer.y,
          ),
      )[0];
    if (
      clicked &&
      Math.hypot(
        clicked.screen.x - pointer.x,
        clicked.screen.y - ACTOR_HEIGHT.aim - pointer.y,
      ) < 38
    )
      return { x: clicked.enemy.x, y: clicked.enemy.y };
    return this.renderer.worldAt({
      x: pointer.x,
      y: pointer.y + ACTOR_HEIGHT.aim,
    });
  }
  start(classId?: ClassId) {
    this.audio.reset();
    if (classId) {
      this.pickups = [];
      this.player = createPlayer(classId);
      this.enemies = createEnemies();
      this.quest = { stage: 0, kills: 0, rewardClaimed: false };
      for (const p of this.world.props) p.opened = false;
      this.effects = [];
      this.projectiles = [];
      this.texts = [];
      this.combat.pending = null;
      this.renderer.snap(this.player);
    }
    this.started = true;
    this.paused = false;
    this.audio.unlock();
    this.onStart();
    if (this.player.hp <= 0) this.onDeath();
    else
      this.notify(
        "Pedralta guarda mais do que ruínas. Encontre a entrada a nordeste.",
      );
    this.save();
  }
  key(k: string) {
    if (k === "escape") {
      if (this.started) this.onMenu("pause");
      return;
    }
    if (!this.started) return;
    const panels: Record<string, string> = {
      i: "inventory",
      c: "classes",
      j: "quests",
      k: "skills",
      m: "settings",
    };
    if (panels[k]) {
      this.onMenu(panels[k]);
      return;
    }
    if (this.paused) return;
    if (["1", "2", "3", "4"].includes(k))
      this.combat.attack(this.target(), Number(k) - 1);
    if (k === "f") this.interact();
    if (["z", "x", "v"].includes(k)) this.potion(["z", "x", "v"].indexOf(k));
  }
  tick(t: number) {
    const dt = Math.min(0.04, (t - this.last) / 1000 || 0.016);
    this.last = t;
    if (!this.paused) {
      this.time += dt;
      this.update(dt);
    }
    this.audio.setListener(this.player);
    const region =
      distance(this.player, PORTAL) < 5
        ? "ruins"
        : this.world.tile(
              Math.floor(this.player.x),
              Math.floor(this.player.y),
            ) >= 3
          ? "forest"
          : "village";
    const mood = !this.started
      ? "menu"
      : this.player.hp <= 0
        ? "defeat"
        : this.dialogueOpen
          ? "narrative"
          : this.inCombat()
            ? this.enemies.some(
                (e) =>
                  e.hp > 0 && e.maxHp >= 200 && distance(e, this.player) < 6,
              )
              ? "elite"
              : "combat"
            : this.enemies.some((e) => e.hp > 0 && distance(e, this.player) < 8)
              ? "danger"
              : "safe";
    this.audio.scene(region, mood);
    this.renderer.draw(
      this.player,
      this.enemies,
      this.effects,
      this.texts,
      this.projectiles,
      this.paused ? 0 : dt,
    );
    this.onUpdate();
    requestAnimationFrame((n) => this.tick(n));
  }
  update(dt: number) {
    const p = this.player;
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    p.guard = Math.max(0, p.guard - dt);
    for (const id in p.skillCooldowns) {
      const before = p.skillCooldowns[id];
      p.skillCooldowns[id] = Math.max(0, before - dt);
      if (
        before > 0 &&
        p.skillCooldowns[id] === 0 &&
        profile(p).bar.includes(id)
      )
        this.audioEvent("skill.ready", { skillId: id });
    }
    p.cooldowns = equippedSkills(p).map((s) =>
      s ? (p.skillCooldowns[s.id] ?? 0) : 0,
    );
    p.mp = Math.min(stats(p).maxMp, p.mp + dt * 2.2);
    p.animTime += dt;
    if (p.hp > 0) {
      const move = this.input.movement();
      const moving = move.x !== 0 || move.y !== 0;
      if (
        p.attackTimer <= 0 &&
        p.action !== "hurt" &&
        p.action !== "interact"
      ) {
        if (moving) {
          const n = normalize({ x: move.x + move.y, y: move.y - move.x });
          p.direction = direction(n);
          if (p.action !== "walk") {
            p.action = "walk";
            p.animTime = 0;
          }
          const speed =
            stats(p).speed *
            this.combat.engine.speed() *
            (this.input.keys.has("shift") ? 1.45 : 1);
          const before = { x: p.x, y: p.y };
          this.world.move(p, { x: n.x * speed * dt, y: n.y * speed * dt });
          if (this.input.keys.has("shift")) p.animTime += dt * 0.45;
          this.stepTimer += distance(p, before);
          if (this.stepTimer > 0.85) {
            this.stepTimer = 0;
            this.audioEvent("step", {
              position: p,
              terrain: this.terrain(p),
              stealth: this.combat.engine.active("stealth"),
            });
          }
        } else if (p.action !== "idle") {
          p.action = "idle";
          p.animTime = 0;
        }
      }
      if (
        (p.action === "hurt" && p.animTime > 0.25) ||
        (p.action === "interact" && p.animTime > 0.5)
      ) {
        p.action = "idle";
        p.animTime = 0;
      }
      this.combat.update(dt);
      p.stealth = this.combat.engine.active("stealth");
      for (const e of this.enemies)
        e.statusKinds = (this.combat.engine.statuses.get(e.id) ?? []).map(
          (s) => s.kind,
        );
      updateEnemies(this.enemies, p, this.world, this.combat, dt, this.time);
    } else {
      this.combat.pending = null;
      p.action = "dead";
      updateEnemies(this.enemies, p, this.world, this.combat, dt, this.time);
      if (p.animTime > 0.8) {
        this.paused = true;
        this.onDeath();
      }
    }
    for (const e of this.enemies) {
      if (e.hp <= 0 && e.timer > 90 && distance(p, e.home) > 8) {
        e.x = e.home.x;
        e.y = e.home.y;
        e.maxHp = (e.type === "wolf" ? 75 : 100) + Math.max(0, p.level - 1) * 8;
        e.hp = e.maxHp;
        e.rewarded = false;
        e.state = "patrol";
        e.timer = 0;
        e.animTime = 0;
      }
    }
    for (const pickup of this.pickups) pickup.time += dt;
    this.pickups = this.pickups.filter((x) => x.time < 4);
    for (const e of this.effects) e.time += dt;
    this.effects = this.effects.filter((e) => e.time < e.duration);
    for (const t of this.texts) t.time += dt;
    this.texts = this.texts.filter((t) => t.time < 1.1);
    this.messageTimer = Math.max(0, this.messageTimer - dt);
    this.saveTimer += dt;
    if (this.saveTimer > 8) {
      this.saveTimer = 0;
      this.save();
    }
    if (this.quest.stage === 0 && distance(p, PORTAL) < 2.5) {
      this.quest.stage = 1;
      this.audioEvent("area.discover", { position: PORTAL });
      this.notify(
        "Entrada encontrada. Elimine três ameaças e atravesse o portal com F.",
      );
      this.save();
    }
  }
  nearby() {
    return this.world.props
      .filter((o) => !o.opened && ["portal", "chest", "npc"].includes(o.kind))
      .sort((a, b) => distance(a, this.player) - distance(b, this.player))
      .find((o) => distance(o, this.player) < 1.5);
  }
  interact() {
    const o = this.nearby();
    if (!o) {
      this.notify(
        "Aproxime-se de um baú, da guardiã ou da entrada das ruínas.",
      );
      return false;
    }
    this.player.action = "interact";
    this.player.animTime = 0;
    if (o.kind === "npc") {
      this.dialogueOpen = true;
      this.dialogueStep = 0;
      this.onDialogue();
    }
    if (o.kind === "npc")
      this.notify(
        this.quest.stage === 2
          ? "Guardiã: Você trouxe o eco de volta. Pedralta se lembra."
          : "Guardiã: Kharn aguarda a nordeste. Vença três ameaças antes de atravessar o selo.",
      );
    if (o.kind === "chest") {
      o.opened = true;
      this.player.challenges.chests++;
      this.audioEvent("object.chest", { position: o });
      this.player.coins += 75;
      this.pickup("coins", 75);
      this.pickup("potion-0");
      this.pickup(o.x < 10 ? "couraça" : "amuleto");
      this.player.potions[0]++;
      this.player.inventory.push(o.x < 10 ? "couraça" : "amuleto");
      this.notify("Baú aberto: +75 moedas, +1 poção e um equipamento raro.");
    }
    if (o.kind === "portal") {
      this.audioEvent("object.portal", { position: o });
      if (this.quest.kills < 3) {
        this.quest.stage = 1;
        this.notify(
          `O selo resiste. Derrote três ameaças (${Math.min(3, this.quest.kills)}/3).`,
        );
      } else if (!this.quest.rewardClaimed) {
        this.quest.stage = 2;
        this.quest.rewardClaimed = true;
        this.player.challenges.seal = true;
        this.audioEvent("quest.complete");
        this.audio.cue("victory", 4);
        this.player.coins += 250;
        this.pickup("coins", 250);
        if (!this.player.inventory.includes("runa")) {
          this.player.inventory.push("runa");
          this.pickup("runa");
        }
        const levels = gainXp(this.player, 200);
        if (levels) this.audioEvent("level.up");
        this.combat.effect("nova", o, "#b790e5", 3, 1.3);
        this.notify(
          `O Eco de Kharn concluído! +200 XP, +250 moedas e Memória de Kharn.${levels ? " Você evoluiu!" : ""}`,
        );
      } else
        this.notify("O selo foi rompido. A primeira missão está concluída.");
    }
    this.save();
    return true;
  }
  potion(i: number) {
    const p = this.player;
    if (p.hp <= 0 || p.potions[i] <= 0) return false;
    const s = stats(p);
    if ((i === 0 && p.hp >= s.maxHp) || (i === 1 && p.mp >= s.maxMp)) {
      this.notify(
        i === 0 ? "Sua vida já está completa." : "Sua mana já está completa.",
      );
      return false;
    }
    p.potions[i]--;
    if (i === 0) p.hp = Math.min(s.maxHp, p.hp + 100);
    if (i === 1) p.mp = Math.min(s.maxMp, p.mp + 70);
    if (i === 2) {
      p.hp = Math.min(s.maxHp, p.hp + 50);
      p.mp = Math.min(s.maxMp, p.mp + 40);
    }
    this.combat.effect("heal", p, ["#e28291", "#76b9e9", "#88c497"][i], 1, 0.8);
    this.audioEvent("potion.use");
    this.save();
    return true;
  }
  changeClass(id: ClassId) {
    const ratio = this.player.hp / stats(this.player).maxHp;
    this.audio.stopEffects();
    this.player.classId = id;
    syncPoints(this.player);
    this.player.resource = 0;
    this.player.mp = Math.min(this.player.mp, stats(this.player).maxMp);
    this.combat.engine.ensure();
    this.player.hp = Math.max(1, Math.round(stats(this.player).maxHp * ratio));
    this.player.cooldowns = [0, 0, 0, 0];
    this.combat.pending = null;
    this.player.attackTimer = 0;
    this.save();
    this.notify(`Caminho escolhido: ${CLASSES[id].name}.`);
  }
  equip(id: string | null, slot?: "weapon" | "armor" | "accessory") {
    const previous = slot ? this.player.equipment[slot] : null;
    const ok = equip(this.player, id, slot);
    if (ok) {
      this.save();
      this.audioEvent(id === null ? "equipment.remove" : "equipment.equip", {
        itemId: id ?? previous,
      });
    }
    return ok;
  }
  unlock(id?: string) {
    const target =
      id ??
      `${this.player.classId}-base-${profile(this.player).nodes.includes(`${this.player.classId}-base-2`) ? 3 : 2}`;
    const ok = learn(this.player, target);
    if (ok) this.save();
    return ok;
  }
  inCombat() {
    return (
      this.combat.engine.combatTime > 0 ||
      this.enemies.some(
        (e) =>
          e.hp > 0 &&
          ["attack", "chase", "alert"].includes(e.state) &&
          distance(e, this.player) < 5.5,
      )
    );
  }
  terrain(point: Point): "stone" | "grass" | "wood" {
    return this.world.tile(Math.floor(point.x), Math.floor(point.y)) >= 3 &&
      distance(point, PORTAL) > 5
      ? "grass"
      : "stone";
  }
  respawn() {
    this.audio.reset();
    this.pickups = [];
    this.player.x = 12;
    this.player.y = 12;
    this.player.hp = stats(this.player).maxHp;
    this.player.mp = stats(this.player).maxMp;
    this.player.coins = Math.max(0, this.player.coins - 25);
    this.player.action = "idle";
    this.player.animTime = 0;
    this.player.invulnerable = 3;
    this.combat = new Combat(this);
    this.player.resource = 0;
    for (const e of this.enemies)
      if (e.hp > 0) {
        e.x = e.home.x;
        e.y = e.home.y;
        e.state = "patrol";
        e.timer = 0;
      }
    this.renderer.snap(this.player);
    this.paused = false;
    this.combat.pending = null;
    this.player.attackTimer = 0;
    this.onStart();
    this.save();
    this.notify("Você desperta em Pedralta. O eco ainda espera. −25 moedas.");
  }
  save() {
    try {
      localStorage.setItem(
        SAVE_KEY,
        serialize(
          this.player,
          this.quest,
          this.world.props.filter((p) => p.opened).map((p) => p.id),
          this.enemies.filter((e) => e.rewarded).map((e) => e.id),
        ),
      );
      this.saveStatus = "Progresso salvo";
      return true;
    } catch {
      this.saveStatus = "Salvamento indisponível";
      this.notify(
        "O navegador bloqueou o salvamento local. Seu progresso só será mantido nesta sessão.",
      );
      return false;
    }
  }
  snapshot() {
    return {
      started: this.started,
      paused: this.paused,
      player: structuredClone(this.player),
      stats: stats(this.player),
      enemies: structuredClone(this.enemies),
      quest: structuredClone(this.quest),
      nearby: this.nearby()?.kind,
      audio: this.audio.snapshot(),
      pickups: structuredClone(this.pickups),
      skills: this.combat.engine.snapshot(),
      projectiles: this.projectiles.length,
      effects: this.effects.length,
      saveStatus: this.saveStatus,
      camera: { ...this.renderer.camera },
    };
  }
}
