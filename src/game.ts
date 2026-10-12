import {
  REGIONS,
  ANCHORS,
  freshExploration,
  kharnEnemies,
  ferrugemEnemies,
  PASSAGES,
  passageOpen,
  passageKey,
  type RegionId,
} from "./regions";
import { type AudioEvent, type AudioCue } from "./audio-catalog";
import { syncPoints, learn, profile, equippedSkills } from "./skills";
import type { Objective } from "./objectives";
import {
  missionViews,
  selectedMission,
  acceptMission,
  recordMissionEvent,
} from "./missions";
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
import {
  World,
  distance,
  normalize,
  PORTAL,
  type Point,
  type Prop,
} from "./world";
import { Prologue, freshPrologue } from "./prologue";
export class Game {
  prologue = new Prologue();
  world = new World();
  exploration = freshExploration();
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
  dialogueNPC = "";
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
      if (!this.paused && !this.prologue.locked)
        this.combat.attack(this.target());
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
      this.exploration = s.exploration;
      this.prologue = new Prologue(s.prologue);
      this.mountRegion(this.exploration.region);
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
  audioEvent = (event: AudioEvent, cue: AudioCue = {}) => {
    if (event === "skill.activate" && cue.skillId && !cue.preview) {
      const slot = profile(this.player).bar.indexOf(cue.skillId);
      if (slot >= 0) this.prologue.event(`skill:${slot}`);
    }
    return this.audio.emit(event, {
      classId: this.player.classId,
      weaponId: this.player.equipment.weapon,
      armorId: this.player.equipment.armor,
      ...cue,
    });
  };
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
      this.prologue = new Prologue(freshPrologue());
      this.player = createPlayer(classId);
      this.exploration = freshExploration();
      this.mountRegion("pedralta");
      this.quest = { stage: 0, kills: 0, rewardClaimed: false };
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
    this.prologue.begin();
    if (this.player.hp <= 0) this.onDeath();
    else this.notify(this.objective());
    this.save();
  }
  key(k: string) {
    if (k === "escape") {
      if (this.started) this.onMenu("pause");
      return;
    }
    if (!this.started) return;
    if (this.prologue.locked) {
      if (!this.paused && (k === "enter" || k === " ")) this.skipCinematic();
      return;
    }
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
      if (!this.prologue.locked) this.update(dt);
      else this.player.animTime += dt;
      const previousScene = this.prologue.cinematic.id;
      const p = this.player,
        max = stats(p);
      this.prologue.movement(p, this.input.keys.has("shift"));
      if (p.hp > 0)
        this.prologue.update(dt, {
          kills: this.quest.kills,
          foundSeal: this.quest.stage > 0,
          seal: this.quest.rewardClaimed,
          accepted: !!this.quest.accepted || this.quest.rewardClaimed,
          chests: p.challenges.chests,
          skills:
            this.prologue.seen("skill:0") && this.prologue.seen("skill:1"),
          resourcesFull: p.hp >= max.maxHp && p.mp >= max.maxMp - 1,
          potion: this.prologue.seen("potion"),
          inventory: this.prologue.seen("inventory-action"),
          journal: this.prologue.seen("panel:quests"),
          classes: this.prologue.seen("panel:classes"),
          tree: this.prologue.seen("panel:skills"),
        });
      if (previousScene !== this.prologue.cinematic.id) {
        this.input.keys.clear();
        if (["signal", "evidence"].includes(this.prologue.cinematic.id ?? ""))
          this.audioEvent("object.portal", { position: PORTAL });
      }
      if (this.prologue.dirty) {
        this.prologue.dirty = false;
        this.save();
      }
    }
    this.audio.setListener(this.player);
    const region =
      this.world.region === "ferrugem"
        ? "industrial"
        : this.world.region === "kharn"
          ? "ruins"
          : distance(this.player, PORTAL) < 5
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
        : this.dialogueOpen || this.prologue.locked
          ? "narrative"
          : this.inCombat()
            ? this.enemies.some(
                (e) =>
                  e.hp > 0 && e.maxHp >= 200 && distance(e, this.player) < 6,
              )
              ? this.enemies.some(
                  (e) => e.boss && e.hp > 0 && distance(e, this.player) < 6,
                )
                ? "boss"
                : "elite"
              : "combat"
            : this.enemies.some((e) => e.hp > 0 && distance(e, this.player) < 8)
              ? "danger"
              : "safe";
    this.audio.scene(region, mood);
    this.renderer.cinematic = this.prologue.cinematic.frame(
      matchMedia("(prefers-reduced-motion: reduce)").matches,
      this.player,
    );
    this.renderer.draw(
      this.player,
      this.enemies,
      this.effects,
      this.texts,
      this.projectiles,
      this.paused ? 0 : dt,
      this.prologue.locked ? null : this.activeObjective(),
    );
    this.onUpdate();
    requestAnimationFrame((n) => this.tick(n));
  }
  update(dt: number) {
    const p = this.player;
    const progress = this.exploration.regions[this.world.region];
    progress.discovered = this.world.discover(p, progress.discovered);
    this.syncPassages();
    this.syncMissions();
    this.discoverSites();
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
      if (
        this.world.region === "pedralta" &&
        e.hp <= 0 &&
        e.timer > 90 &&
        distance(p, e.home) > 8
      ) {
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
    if (
      this.world.region === "pedralta" &&
      this.quest.stage === 0 &&
      distance(p, PORTAL) < 2.5
    ) {
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
      .filter(
        (o) =>
          !o.opened &&
          [
            "portal",
            "chest",
            "npc",
            ...(this.world.region === "ferrugem"
              ? ["crate", "fountain", "bench"]
              : []),
            ...(this.world.region === "kharn" ? ["statue"] : []),
          ].includes(o.kind) &&
          (this.world.region !== "ferrugem" ||
            ["npc", "portal", "chest"].includes(o.kind) ||
            !!o.interaction),
      )
      .sort((a, b) => distance(a, this.player) - distance(b, this.player))
      .find(
        (o) =>
          distance(o, this.player) < 1.5 &&
          this.world.canInteract(this.player, o),
      );
  }
  skipCinematic() {
    if (!this.prologue.locked) return;
    this.prologue.finishScene();
    this.input.keys.clear();
    this.renderer.snap(this.player);
    this.save();
  }
  interact() {
    if (this.prologue.locked) return false;
    const o = this.nearby();
    if (!o) {
      this.notify(
        "Aproxime-se de um baú, da guardiã ou da entrada das ruínas.",
      );
      return false;
    }
    this.player.action = "interact";
    this.player.animTime = 0;
    if (this.world.region === "ferrugem" && o.interaction)
      return this.interactFerrugem(o);
    if (this.world.region === "kharn" && o.kind === "statue") {
      if (!this.exploration.campaign.accepted) {
        this.notify("Converse primeiro com Iria junto ao aqueduto.");
        return false;
      }
      const anchor = ANCHORS.find((a) => a.x === o.x && a.y === o.y)!;
      if (this.exploration.campaign.attuned.includes(anchor.id)) {
        this.notify(`${anchor.name} já está afinado.`);
        return true;
      }
      if (this.enemies.some((e) => e.id === anchor.guardian && e.hp > 0)) {
        this.notify(`Silencie o vigia que protege o ${anchor.name}.`);
        this.audioEvent("skill.denied");
        return false;
      }
      this.exploration.campaign.attuned.push(anchor.id);
      this.audioEvent("quest.complete");
      this.combat.effect("nova", o, "#b790e5", 2, 1);
      this.save();
      this.notify(`${anchor.name} afinado. ${this.objective()}`);
      return true;
    }
    if (o.kind === "npc") {
      this.dialogueOpen = true;
      this.dialogueStep = 0;
      this.onDialogue();
    }
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
      const passage = PASSAGES.find(
        (p) => p.region === this.world.region && p.id === o.id,
      );
      if (
        passage &&
        !(this.world.region === "pedralta" && !this.quest.rewardClaimed)
      ) {
        if (!passageOpen(passage, this.exploration, this.quest.rewardClaimed)) {
          this.notify(`${passage.name} bloqueada. ${passage.blocked}.`);
          return false;
        }
        return this.changeRegion(passage.destination);
      }
      if (this.world.region === "kharn") {
        return this.changeRegion("pedralta");
      }
      if (this.quest.rewardClaimed) {
        return this.changeRegion("kharn");
      }
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
          `O Eco de Kharn concluído! +200 XP, +250 moedas e Memória de Kharn. Pressione F no selo para entrar na Margem de Kharn.${levels ? " Você evoluiu!" : ""}`,
        );
      } else
        this.notify("O selo foi rompido. A primeira missão está concluída.");
    }
    this.save();
    return true;
  }
  potion(i: number) {
    if (this.prologue.locked) return false;
    const p = this.player;
    if (p.hp <= 0 || p.potions[i] <= 0) return false;
    const s = stats(p);
    if ((i === 0 && p.hp >= s.maxHp) || (i === 1 && p.mp >= s.maxMp)) {
      this.notify(
        i === 0 ? "Sua vida já está completa." : "Sua mana já está completa.",
      );
      return false;
    }
    if (i === 2 && p.hp >= s.maxHp && p.mp >= s.maxMp) return false;
    p.potions[i]--;
    this.prologue.event("potion");
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
      this.prologue.event("inventory-action");
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
    if (this.world.region !== "pedralta") {
      this.captureRegion();
      this.mountRegion("pedralta");
    }
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
  captureRegion() {
    const r = this.exploration.regions[this.world.region];
    r.opened = this.world.props.filter((p) => p.opened).map((p) => p.id);
    r.killed = this.enemies.filter((e) => e.rewarded).map((e) => e.id);
    r.encounters = this.enemies.map((e) => ({
      id: e.id,
      x: e.x,
      y: e.y,
      hp: e.hp,
      maxHp: e.maxHp,
      rewarded: e.rewarded,
    }));
  }
  mountRegion(id: RegionId) {
    this.exploration.region = id;
    this.world.setRegion(id);
    const progress = this.exploration.regions[id];
    this.enemies =
      id === "pedralta"
        ? createEnemies()
        : id === "kharn"
          ? kharnEnemies()
          : ferrugemEnemies();
    for (const p of this.world.props) p.opened = progress.opened.includes(p.id);
    this.syncPassages();
    this.world.applyChanges(this.exploration.changes);
    for (const e of this.enemies) {
      const saved = progress.encounters.find((s) => s.id === e.id);
      if (saved) Object.assign(e, saved);
      else if (progress.killed.includes(e.id)) {
        e.hp = 0;
        e.rewarded = true;
      }
      const at = this.world.nearestFree(e, 0.23);
      e.x = at.x;
      e.y = at.y;
      if (e.hp <= 0) {
        e.state = "dead";
        e.timer = 3;
      }
    }
    this.syncMissions();
    this.renderer?.makeFloor();
  }
  changeRegion(id: RegionId) {
    const passage = PASSAGES.find(
      (p) => p.region === this.world.region && p.destination === id,
    );
    if (
      !passage ||
      !passageOpen(passage, this.exploration, this.quest.rewardClaimed) ||
      id === this.world.region ||
      !this.quest.rewardClaimed ||
      this.player.hp <= 0
    )
      return false;
    this.captureRegion();
    this.combat.engine.cancelAudio();
    this.audio.stopEffects();
    this.mountRegion(id);
    const at = this.world.nearestFree(passage.arrival);
    Object.assign(this.player, at, {
      action: "idle",
      animTime: 0,
      attackTimer: 0,
      guard: 0,
      invulnerable: 2,
      stealth: false,
    });
    this.effects = [];
    this.projectiles = [];
    this.texts = [];
    this.pickups = [];
    this.input.keys.clear();
    this.combat = new Combat(this);
    this.stepTimer = 0;
    const first = !this.exploration.campaign.entered;
    if (id === "kharn") this.exploration.campaign.entered = true;
    if (!this.exploration.visited.includes(id)) {
      this.exploration.visited.push(id);
      this.audioEvent("area.discover");
    }
    if (id === "ferrugem") this.missionEvent("enter:ferrugem", false);
    const r = this.exploration.regions[id];
    r.discovered = this.world.discover(this.player, r.discovered);
    this.renderer.snap(this.player);
    this.audio.setListener(this.player);
    if (first && id === "kharn") this.audioEvent("area.discover");
    this.save();
    this.notify(`${REGIONS[id].name}. ${this.objective()}`);
    return true;
  }
  syncPassages() {
    for (const p of PASSAGES) {
      const open = passageOpen(p, this.exploration, this.quest.rewardClaimed);
      const key = passageKey(p);
      if (open && !this.exploration.unlocked.includes(key))
        this.exploration.unlocked.push(key);
      if (p.region !== this.world.region) continue;
      const prop = this.world.props.find((o) => o.id === p.id);
      if (prop)
        Object.assign(prop, {
          name: p.name,
          locked: !open,
          blockedReason: p.blocked,
        });
      if (
        (distance(p, this.player) < 4.5 ||
          (p.requirement === "memories" && open)) &&
        !this.exploration.knownPassages.includes(key)
      )
        this.exploration.knownPassages.push(key);
    }
  }
  missionEvent(event: string, persist = true) {
    const changed = recordMissionEvent(this.exploration, event);
    this.syncMissions();
    if (changed && persist) this.save();
    return changed;
  }
  syncMissions() {
    if (this.exploration.campaign.rewardClaimed)
      acceptMission(this.exploration, this.quest, "machines");
    for (const v of missionViews(this.exploration, this.quest)) {
      if (v.status !== "ativa" || v.stage !== v.definition.steps.length)
        continue;
      const { id, reward, name } = v.definition;
      this.exploration.journal.completed.push(id);
      this.player.coins += reward.coins;
      this.pickup("coins", reward.coins);
      if (reward.item && !this.player.inventory.includes(reward.item)) {
        this.player.inventory.push(reward.item);
        this.pickup(reward.item);
      }
      if (reward.potions) {
        this.player.potions[0] += reward.potions;
        this.pickup("potion-0", reward.potions);
      }
      if (
        reward.consequence &&
        !this.exploration.changes.includes(reward.consequence)
      )
        this.exploration.changes.push(reward.consequence);
      if (gainXp(this.player, reward.xp)) this.audioEvent("level.up");
      this.audioEvent("quest.complete");
      if (this.exploration.journal.tracked === id)
        this.exploration.journal.tracked = null;
      this.notify(
        `${name} concluída! +${reward.xp} XP · +${reward.coins} moedas.${id === "machines" ? " O manifesto revela fragmentos do Núcleo enviados ao Jardim do Véu; a rota adiante ainda precisa ser investigada." : ""}`,
      );
    }
    this.world.applyChanges(this.exploration.changes);
    const nara = this.world.props.find((p) => p.interaction === "nara");
    if (nara && this.exploration.changes.includes("nara-safe"))
      Object.assign(nara, { x: 7.5, y: 20, name: "NARA" });
  }
  acceptSideMission(id: string) {
    if (!acceptMission(this.exploration, this.quest, id)) return false;
    this.exploration.journal.tracked = id;
    this.audioEvent("quest.accept");
    this.syncMissions();
    this.save();
    return true;
  }
  trackMission(id: string) {
    if (
      !missionViews(this.exploration, this.quest).some(
        (v) => v.definition.id === id && v.status === "ativa",
      )
    )
      return false;
    this.exploration.journal.tracked = id;
    this.save();
    return true;
  }
  onEnemyDefeated = (enemy: Enemy) => {
    if (this.world.region !== "ferrugem") return;
    if ([203, 204].includes(enemy.id)) {
      const id = `ferrugem:${enemy.id}`;
      if (!this.exploration.bosses.includes(id))
        this.exploration.bosses.push(id);
      this.missionEvent(`defeat:${enemy.id}`);
    } else this.save();
  };
  interactFerrugem(o: Prop) {
    const event = o.interaction!;
    const known = (id: string) => this.exploration.journal.events.includes(id);
    if (event === "elcio") {
      this.missionEvent("talk:elcio", false);
      for (const id of ["machines", "workers"]) {
        const v = missionViews(this.exploration, this.quest).find(
          (v) => v.definition.id === id,
        )!;
        if (v.status === "ativa" && v.stage === v.definition.steps.length - 1)
          this.missionEvent(`report:${id}`, false);
      }
    } else if (event === "nara") {
      if (!known("defeat:204")) {
        this.notify(
          "Nara: o Sucateiro ainda ronda a saída. Silencie-o antes de me escoltar ao abrigo.",
        );
        return false;
      }
      if (!known("talk:nara")) {
        this.exploration.changes.push("nara-safe");
        this.missionEvent("talk:nara", false);
        this.notify(
          "Nara voltou ao abrigo de Elcio. Conte a ele o que aconteceu.",
        );
      }
    } else {
      if (event === "pump" && !["talk:elcio", "gear", "fuse"].every(known)) {
        this.notify(
          "Bomba parada: converse com Elcio e recupere a engrenagem e o fusível.",
        );
        return false;
      }
      if (
        event === "bridge" &&
        (!known("crank") ||
          !this.exploration.journal.accepted.includes("bridge"))
      ) {
        this.notify(
          "Guincho sem manivela. Elcio pode orientar a restauração da passarela.",
        );
        return false;
      }
      if (event === "pump" || event === "bridge") {
        if (!this.exploration.changes.includes(event))
          this.exploration.changes.push(event);
      }
      this.missionEvent(event, false);
      o.opened = true;
      this.audioEvent(
        event === "worker-log" || event === "manifest"
          ? "loot.quest"
          : "object.chest",
        { position: o },
      );
      const texts: Record<string, string> = {
        gear: "Engrenagem recuperada e guardada com os componentes da missão.",
        fuse: "Fusível de cobre recuperado.",
        pump: "Refrigeração restaurada. O portão térmico da Fornalha abriu.",
        manifest:
          "Manifesto: fragmentos do Núcleo foram levados ao Jardim do Véu por ordem de uma autoridade apagada dos registros. A Fornalha manteve as máquinas sob comando.",
        "worker-log":
          "Diário de Nara: escondi-me junto ao depósito norte, perto da oficina. O Sucateiro não permite que eu saia.",
        crank: "Manivela recuperada. Leve-a ao guincho do canal sul.",
        bridge:
          "Passarela restaurada. Agora você pode cruzar o canal pelo sul.",
      };
      if (this.messageTimer <= 0 || !this.message.includes("concluída!"))
        this.notify(texts[event] ?? o.name ?? "Registro encontrado.");
      this.save();
      return true;
    }
    this.dialogueNPC = event;
    this.dialogueOpen = true;
    this.dialogueStep = 0;
    this.save();
    this.onDialogue();
    return true;
  }
  buySupplies() {
    if (
      !this.exploration.changes.includes("merchant") ||
      this.world.region !== "ferrugem" ||
      this.dialogueNPC !== "elcio" ||
      this.player.coins < 50
    ) {
      this.notify("A provisão custa 50 moedas e exige resgatar Nara.");
      return false;
    }
    this.player.coins -= 50;
    this.player.potions[0]++;
    this.pickup("potion-0");
    this.save();
    return true;
  }
  discoverSites() {
    if (this.world.region !== "ferrugem") return;
    for (const site of [
      { id: "depot", name: "Depósito abandonado", x: 9, y: 14 },
      { id: "canal", name: "Canal de refrigeração", x: 17, y: 16 },
      { id: "furnace", name: "Pátio da Fornalha", x: 21, y: 8 },
      { id: "cache", name: "Esconderijo dos sucateiros", x: 5, y: 8 },
    ]) {
      if (
        distance(site, this.player) < 2 &&
        recordMissionEvent(this.exploration, `site:${site.id}`)
      ) {
        this.audioEvent("area.discover");
        this.notify(`Local descoberto: ${site.name}.`);
        this.save();
      }
    }
  }
  missionObjective(): Objective | null {
    const mission = selectedMission(this.exploration, this.quest);
    const step = mission?.definition.steps[mission.stage];
    if (!mission || !step) return null;
    const category = mission.definition.main ? "main" : "secondary";
    if (step.region !== this.world.region) {
      const passage =
        PASSAGES.find(
          (p) =>
            p.region === this.world.region && p.destination === step.region,
        ) ??
        PASSAGES.find(
          (p) => p.region === this.world.region && p.destination === "kharn",
        );
      return passage
        ? {
            x: passage.x,
            y: passage.y,
            id: passage.id,
            kind: "reach",
            label: `${passage.name} · F`,
            height: 180,
            category,
          }
        : null;
    }
    if (step.target.startsWith("enemy:")) {
      const enemy = this.enemies.find(
        (e) => e.id === Number(step.target.slice(6)) && e.hp > 0,
      );
      return enemy
        ? {
            x: enemy.x,
            y: enemy.y,
            id: step.target,
            kind: "defeat",
            label: enemy.name ?? step.text,
            height: enemy.boss ? 108 : 82,
            category,
          }
        : null;
    }
    const prop = this.world.props.find((p) => p.id === step.target);
    return prop
      ? {
          x: prop.x,
          y: prop.y,
          id: prop.id,
          kind: step.kind,
          label: step.text,
          height: prop.kind === "npc" ? 80 : prop.kind === "portal" ? 180 : 100,
          category,
        }
      : null;
  }
  objective() {
    if (this.exploration.campaign.rewardClaimed) {
      const mission = selectedMission(this.exploration, this.quest);
      return (
        mission?.definition.steps[mission.stage]?.text ??
        "Fornalha silenciada. Explore os depósitos e ajude os moradores."
      );
    }
    if (!this.quest.rewardClaimed)
      return this.quest.stage === 0
        ? "Encontre a entrada das ruínas"
        : this.quest.kills >= 3
          ? "Atravesse o selo de Kharn · F"
          : `Silencie as ameaças da vila · ${Math.min(3, this.quest.kills)}/3`;
    const c = this.exploration.campaign;
    if (c.rewardClaimed)
      return "Memórias reunidas. Explore as duas regiões e os baús restantes.";
    if (c.attuned.length === 3)
      return this.world.region === "kharn"
        ? "Retorne pelo selo e entregue as memórias à Guardiã"
        : "Fale com a Guardiã de Pedralta · F";
    if (this.world.region === "pedralta")
      return "Entre na Margem de Kharn pelo selo a nordeste · F";
    if (!c.accepted) return "Converse com Iria junto ao aqueduto · F";
    const next = ANCHORS.find((a) => !c.attuned.includes(a.id))!;
    const alive = this.enemies.some((e) => e.id === next.guardian && e.hp > 0);
    return `${alive ? "Derrote o vigia do" : "Afine o"} ${next.name} · ${c.attuned.length}/3`;
  }
  activeObjective(): Objective | null {
    if (
      this.prologue.active &&
      ["guardian", "chest"].includes(this.prologue.state!.step)
    ) {
      const kind = this.prologue.state!.step === "guardian" ? "npc" : "chest";
      const target = this.world.props
        .filter((p) => p.kind === kind && !p.opened)
        .sort((a, b) => distance(a, this.player) - distance(b, this.player))[0];
      if (target)
        return {
          ...target,
          kind: kind === "npc" ? "talk" : "interact",
          label: kind === "npc" ? "Guardiã de Pedralta" : "Baú de suprimentos",
          height: 85,
        };
    }
    if (this.exploration.campaign.rewardClaimed) return this.missionObjective();
    const prop = (
      kind: string,
      type: Objective["kind"],
      label: string,
    ): Objective | null => {
      const o = this.world.props.find((o) => o.kind === kind);
      return o
        ? {
            x: o.x,
            y: o.y,
            id: o.id,
            kind: type,
            label,
            height: (kind === "npc" ? 88 : 156) * o.scale + 18,
          }
        : null;
    };
    const foe = (id?: number): Objective | null => {
      const e = this.enemies
        .filter((e) => e.hp > 0 && (id === undefined || e.id === id))
        .sort((a, b) => distance(a, this.player) - distance(b, this.player))[0];
      return e
        ? {
            x: e.x,
            y: e.y,
            id: `enemy:${e.id}`,
            kind: "defeat",
            label: id === undefined ? "Derrote a ameaça" : "Derrote o vigia",
            height: e.type === "wolf" ? 60 : 92,
          }
        : null;
    };
    if (!this.quest.rewardClaimed) {
      if (this.quest.stage === 1 && this.quest.kills < 3) return foe();
      return prop(
        "portal",
        this.quest.stage === 0 ? "investigate" : "interact",
        this.quest.stage === 0 ? "Entrada das ruínas" : "Abra o selo · F",
      );
    }
    const c = this.exploration.campaign;
    if (c.rewardClaimed) return null;
    if (this.world.region === "pedralta")
      return c.attuned.length === 3
        ? prop("npc", "talk", "Entregue as memórias · F")
        : prop("portal", "reach", "Passagem para Kharn · F");
    if (c.attuned.length === 3)
      return prop("portal", "reach", "Retorne a Pedralta · F");
    if (!c.accepted) return prop("npc", "talk", "Converse com Iria · F");
    const a = ANCHORS.find((a) => !c.attuned.includes(a.id))!;
    const guardian = foe(a.guardian);
    if (guardian) return guardian;
    const o = this.world.props.find(
      (o) => o.kind === "statue" && o.x === a.x && o.y === a.y,
    );
    return o
      ? {
          x: o.x,
          y: o.y,
          id: o.id,
          kind: "interact",
          label: `Afine o ${a.name} · F`,
          height: 156 * o.scale + 18,
        }
      : null;
  }
  objectivePoint(): Point {
    return this.activeObjective() ?? REGIONS[this.world.region].connection;
  }
  acceptCampaign() {
    if (!this.quest.rewardClaimed) return false;
    this.exploration.campaign.accepted = true;
    this.audioEvent("quest.accept");
    this.save();
    return true;
  }
  claimCampaign() {
    const c = this.exploration.campaign;
    if (
      this.world.region !== "pedralta" ||
      c.attuned.length !== 3 ||
      c.rewardClaimed
    )
      return false;
    c.rewardClaimed = true;
    this.player.coins += 180;
    this.pickup("coins", 180);
    if (!this.player.inventory.includes("amuleto")) {
      this.player.inventory.push("amuleto");
      this.pickup("amuleto");
    }
    if (gainXp(this.player, 300)) this.audioEvent("level.up");
    this.audioEvent("quest.complete");
    this.audio.cue("victory", 4);
    this.save();
    this.notify(
      "As Memórias da Margem reunidas! +300 XP, +180 moedas e Olho de Kharn. Iria revelou a Estrada das Caldeiras: retorne a Kharn e siga para Ferrugem.",
    );
    this.syncMissions();
    this.syncPassages();
    this.save();
    return true;
  }
  save() {
    try {
      this.captureRegion();
      const previous = localStorage.getItem(SAVE_KEY);
      if (previous) {
        let version = 0;
        try {
          version = JSON.parse(previous).version;
        } catch {
          /* A corrupt old save must not prevent starting a new journey. */
        }
        if (
          [1, 2, 3].includes(version) &&
          !localStorage.getItem(`${SAVE_KEY}:backup:v${version}`)
        )
          localStorage.setItem(`${SAVE_KEY}:backup:v${version}`, previous);
      }
      localStorage.setItem(
        SAVE_KEY,
        serialize(
          this.player,
          this.quest,
          this.world.props.filter((p) => p.opened).map((p) => p.id),
          this.enemies.filter((e) => e.rewarded).map((e) => e.id),
          this.exploration,
          this.prologue.state,
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
      prologue: {
        state: structuredClone(this.prologue.state),
        scene: this.prologue.cinematic.id,
        locked: this.prologue.locked,
        hint: this.prologue.hints.active?.id ?? null,
      },
      region: this.world.region,
      exploration: structuredClone(this.exploration),
      objective: this.objective(),
      activeObjective: this.activeObjective(),
      pointsOfInterest: this.world.props
        .filter(
          (o) =>
            ["npc", "portal", "statue", "chest"].includes(o.kind) ||
            !!o.interaction,
        )
        .map((o) => ({
          id: o.id,
          kind: o.kind,
          x: o.x,
          y: o.y,
          opened: !!o.opened,
          interaction: o.interaction,
          name: o.name,
          locked: o.locked,
        })),
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
