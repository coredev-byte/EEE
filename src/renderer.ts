import { canvasViewport } from "./viewport";
import { paintRuinsFloor } from "./ruins-scenery";
import { paintChapterEnemy, paintTelegraph, paintRune } from "./chapter-art";
import type { CinematicFrame } from "./cinematics";
import { Occlusion, type VisibilityTarget } from "./occlusion";
import {
  placeObjective,
  objectiveIcon,
  type Objective,
  type ScreenRect,
} from "./objectives";
import { effectFrame } from "./effect-art";
import { NODE_BY_ID, profile } from "./skills";
import {
  PROP_HEIGHT,
  spriteBounds,
  onScreen,
  TILE,
  FRAMES,
  ACTOR_HEIGHT,
  cameraPixels,
  worldToScreen,
  screenToWorld,
} from "./spatial";
import { paintWorld, effectPosition, type WorldDraw } from "./render-order";
import { ITEMS, DIRS } from "./data";
import { spriteIndex, frame } from "./animation";
import { World, iso, distance, type Point, type Prop } from "./world";
import type { Player, Enemy, Effect, DamageText, Projectile } from "./state";
import { Assets } from "./assets";
export class Renderer {
  ctx: CanvasRenderingContext2D;
  camera: Point = { x: 0, y: 0 };
  floor: HTMLCanvasElement;
  floorOrigin: number;
  readonly floorOffsetY = TILE.height * 0.75;
  time = 0;
  cinematic: CinematicFrame | null = null;
  hudBounds: ScreenRect[] = [];
  private occlusion: Occlusion;
  private visibility: VisibilityTarget[] = [];
  private frameDt = 0;
  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly assets: Assets,
    readonly world: World,
  ) {
    this.occlusion = new Occlusion(assets);
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.ctx.imageSmoothingEnabled = false;
    this.floor = document.createElement("canvas");
    this.floorOrigin = (world.size * TILE.width) / 2;
    this.floor.width = (world.size + 1) * TILE.width;
    this.floor.height = (world.size + 2) * TILE.height;
    this.makeFloor();
  }
  makeFloor() {
    this.occlusion.reset();
    this.floorOrigin = (this.world.size * TILE.width) / 2;
    this.floor.width = (this.world.size + 1) * TILE.width;
    this.floor.height = (this.world.size + 2) * TILE.height;
    const c = this.floor.getContext("2d")!;
    c.imageSmoothingEnabled = false;
    if (this.world.region === "ruins") {
      paintRuinsFloor(c, this.world, this.assets, this.floorOrigin, this.floorOffsetY);
      return;
    }
    c.fillStyle = "#070e15";
    c.fillRect(0, 0, this.floor.width, this.floor.height);
    for (let y = 0; y < this.world.size; y++)
      for (let x = 0; x < this.world.size; x++) {
        const s = iso({ x, y });
        const sx = s.x + this.floorOrigin,
          sy = s.y + this.floorOffsetY;
        c.fillStyle = this.world.tile(x, y) < 3 ? "#222b35" : "#132620";
        c.beginPath();
        c.moveTo(sx, sy - TILE.height / 2);
        c.lineTo(sx + TILE.width / 2, sy);
        c.lineTo(sx, sy + TILE.height / 2);
        c.lineTo(sx - TILE.width / 2, sy);
        c.fill();
        c.drawImage(
          this.assets.images.tiles,
          this.world.tile(x, y) * TILE.width,
          0,
          TILE.width,
          TILE.height,
          sx - TILE.width / 2,
          sy - TILE.height / 2,
          TILE.width,
          TILE.height,
        );
        if (this.world.region === "ferrugem") {
          c.fillStyle = "rgba(112,58,26,.22)";
          c.beginPath();
          c.moveTo(sx, sy - TILE.height / 2);
          c.lineTo(sx + TILE.width / 2, sy);
          c.lineTo(sx, sy + TILE.height / 2);
          c.lineTo(sx - TILE.width / 2, sy);
          c.fill();
        }
      }
  }
  get view() { return canvasViewport(this.canvas); }
  project(p: Point): Point {
    return worldToScreen(p, this.camera, this.view);
  }
  worldAt(screen: Point): Point {
    return screenToWorld(screen, this.camera, this.view);
  }
  snap(p: Point) {
    this.camera = iso(p);
  }
  draw(
    p: Player,
    enemies: Enemy[],
    effects: Effect[],
    texts: DamageText[],
    projectiles: Projectile[],
    dt: number,
    objective: Objective | null = null,
  ) {
    this.time += dt;
    const target = iso(this.cinematic?.camera ?? p),
      f = 1 - Math.exp(-dt * 7);
    if (this.cinematic) this.camera = target;
    this.camera.x += (target.x - this.camera.x) * f;
    this.camera.y += (target.y - this.camera.y) * f;
    const c = this.ctx;
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#070d17";
    c.fillRect(0, 0, this.view.width, this.view.height);
    c.save();
    if (this.cinematic) {
      c.translate(this.view.width / 2, this.view.height / 2);
      c.scale(this.cinematic.zoom, this.cinematic.zoom);
      c.translate(-this.view.width / 2, -this.view.height / 2);
    }
    c.drawImage(
      this.floor,
      this.view.focus.x - cameraPixels(this.camera).x - this.floorOrigin,
      this.view.focus.y - cameraPixels(this.camera).y - this.floorOffsetY,
    );
    this.frameDt = dt;
    this.visibility = [
      {
        id: "player",
        foot: this.project(p),
        depth: p.x + p.y,
        height: 84,
        width: 26,
      },
    ];
    for (const e of enemies)
      if (e.hp > 0 && (e.state !== "patrol" || distance(e, p) < 3))
        this.visibility.push({
          id: `enemy:${e.id}`,
          foot: this.project(e),
          depth: e.x + e.y,
          height: e.appearance === "kharn" ? 160 : e.type === "wolf" ? 40 : 76,
          width: e.type === "wolf" ? 48 : 26,
        });
    if (objective && !this.visibility.some((t) => t.id === objective.id))
      this.visibility.push({
        id: objective.id,
        foot: this.project(objective),
        depth: objective.x + objective.y,
        height: Math.min(88, objective.height),
        width: 30,
      });
    for (const o of this.world.props)
      if (
        (["npc", "chest"].includes(o.kind) || !!o.interaction) &&
        !o.opened &&
        distance(o, p) < 2.5
      )
        this.visibility.push({
          id: o.id,
          foot: this.project(o),
          depth: o.x + o.y,
          height: o.kind === "npc" ? 64 : 40,
          width: 30,
        });
    for (const e of enemies)
      if (e.bossAttack && !e.dormant)
        paintTelegraph(c, e.bossAttack, (p) => this.project(p));
    const entries: WorldDraw[] = this.world.props.map((prop) => ({
      point: prop,
      layer: 1,
      draw: () => this.prop(prop, p),
    }));
    for (const enemy of enemies)
      if (
        !enemy.dormant &&
        (enemy.hp > 0 || enemy.timer < 2.5 || enemy.appearance === "kharn")
      )
        entries.push({ point: enemy, layer: 1, draw: () => this.enemy(enemy) });
    entries.push({
      point: p,
      layer: 1,
      draw: () =>
        this.player(
          this.cinematic?.actor && p.hp > 0
            ? { ...p, action: this.cinematic.actor }
            : p,
        ),
    });
    for (const projectile of projectiles)
      entries.push({
        point: projectile,
        layer: 2,
        draw: () => this.projectile(projectile),
      });
    for (const effect of effects) {
      const samples = effect.kind === "dash" ? 4 : 1;
      for (let i = 0; i < samples; i++) {
        const point = effectPosition(effect, i);
        entries.push({
          point,
          layer: effect.kind === "nova" ? 0 : 2,
          draw: () => this.effect(effect, point),
        });
      }
    }
    paintWorld(entries);
    for (const prop of this.world.props.filter((o) => o.kind === "lantern"))
      this.lanternLight(prop);
    for (const t of texts) {
      const s = this.project(t);
      c.globalAlpha = Math.max(0, 1 - t.time / 1.1);
      c.font = "bold 14px monospace";
      c.textAlign = "center";
      c.fillStyle = "#03050a";
      c.fillText(t.text, s.x + 1, s.y - ACTOR_HEIGHT.text - t.time * 25 + 1);
      c.fillStyle = t.color;
      c.fillText(t.text, s.x, s.y - ACTOR_HEIGHT.text - t.time * 25);
      c.globalAlpha = 1;
    }
    c.restore();
    if (this.cinematic) {
      const frame = this.cinematic;
      if (frame.pulse) {
        c.fillStyle = `rgba(137,167,244,${frame.pulse})`;
        c.fillRect(0, 0, this.view.width, this.view.height);
        const base = this.project(frame.pulseAt);
        const at = {
          x: this.view.width / 2 + (base.x - this.view.width / 2) * frame.zoom,
          y: this.view.height / 2 + (base.y - this.view.height / 2) * frame.zoom,
        };
        for (let i = 0; i < 18; i++) {
          const a = i * 2.4 + this.time * 0.5,
            r = 18 + (i % 5) * 10;
          c.fillStyle = "#b8cafa";
          c.fillRect(
            Math.round(at.x + Math.cos(a) * r),
            Math.round(at.y - 30 + Math.sin(a) * r),
            2,
            2,
          );
        }
      }
      c.fillStyle = `rgba(2,5,12,${frame.fade})`;
      c.fillRect(0, 0, this.view.width, this.view.height);
    }
    // Pixel-locked foreground vignette, never filtering the sprites.
    for (let i = 0; i < 5; i++) {
      c.fillStyle = `rgba(2,5,12,${0.13 - i * 0.018})`;
      const edge = 12 + i * 8;
      c.fillRect(0, 0, this.view.width, edge);
      c.fillRect(0, this.view.height - edge, this.view.width, edge);
      c.fillRect(0, edge, edge, this.view.height - edge * 2);
      c.fillRect(this.view.width - edge, edge, edge, this.view.height - edge * 2);
    }
    if (objective) this.goal(objective, p);
  }
  shadow(s: Point, rx = 16) {
    const c = this.ctx;
    c.fillStyle = "rgba(2,5,9,.48)";
    c.beginPath();
    c.ellipse(s.x, s.y + 1, rx, rx * 0.32, 0, 0, Math.PI * 2);
    c.fill();
  }
  player(p: Player) {
    const s = this.project(p);
    this.shadow(s);
    const c = this.ctx;
    if (p.invulnerable > 0 && p.hp > 0 && Math.floor(this.time * 12) % 2 === 0)
      c.globalAlpha = 0.65;
    if (p.stealth) c.globalAlpha = 0.35;
    const index = spriteIndex(p.direction, p.action, p.animTime);
    if (p.classId === "guerreiro")
      this.assets.draw(
        c,
        "hero",
        index % 12,
        Math.floor(index / 12),
        FRAMES.character.width,
        FRAMES.character.height,
        s.x,
        s.y,
        1,
      );
    else if (p.action === "idle" || p.action === "walk") {
      if (p.direction === "left")
        this.assets.draw(
          c,
          p.classId,
          frame(p.action, p.animTime),
          0,
          FRAMES.character.width,
          FRAMES.character.height,
          s.x,
          s.y,
          1,
        );
      else {
        const base =
          p.direction === "front" ? 0 : p.direction === "back" ? 4 : 8;
        const f =
          p.action === "walk" ? 1 + (Math.floor(p.animTime / 0.17) % 3) : 0;
        this.assets.draw(
          c,
          `${p.classId}-directions`,
          base + f,
          0,
          FRAMES.character.width,
          FRAMES.character.height,
          s.x,
          s.y,
          1,
        );
      }
    } else if (
      p.action === "attack" ||
      p.action === "cast" ||
      p.action === "hurt" ||
      p.action === "dead"
    ) {
      const col =
        p.action === "attack"
          ? Math.min(2, Math.floor(p.animTime / 0.16))
          : p.action === "cast"
            ? p.animTime < 0.16
              ? 0
              : p.animTime < 0.32
                ? p.classId === "atirador"
                  ? 1
                  : 4
                : 2
            : p.action === "hurt"
              ? 3
              : p.animTime < 0.25
                ? 3
                : 5;
      const row = DIRS.indexOf(p.direction);
      this.assets.draw(
        c,
        `${p.classId}-combat`,
        col,
        row,
        FRAMES.character.width,
        FRAMES.character.height,
        s.x,
        s.y,
        1,
        false,
      );
    } else
      this.assets.draw(
        c,
        "hero",
        index % 12,
        Math.floor(index / 12),
        FRAMES.character.width,
        FRAMES.character.height,
        s.x,
        s.y,
        1,
      );
    c.globalAlpha = 1;
    const mastery = NODE_BY_ID.get(profile(p).mastery ?? "");
    if (mastery && p.hp > 0) {
      c.fillStyle = mastery.color;
      for (let i = 0; i < 4; i++)
        c.fillRect(
          s.x + Math.round(Math.cos(this.time + i * 1.57) * 18),
          s.y - 2 + Math.round(Math.sin(this.time + i * 1.57) * 6),
          2,
          2,
        );
    }
    const weapon = ITEMS.find((i) => i.id === p.equipment.weapon);
    if (weapon && p.hp > 0) {
      const wx = p.direction === "left" ? -12 : 12;
      // Weapons belong to the animation artwork. A rotated inventory icon here
      // floated over the hands and appeared as a blue cylinder during movement.
      if (
        weapon.element === "fire" ||
        weapon.element === "lightning" ||
        weapon.element === "rune"
      ) {
        const col =
          weapon.element === "fire"
            ? "#efa06e"
            : weapon.element === "lightning"
              ? "#8fc4fa"
              : "#d096f4";
        for (let i = 0; i < 4; i++) {
          c.fillStyle = col;
          c.fillRect(
            s.x + wx + Math.round(Math.sin(this.time * 3 + i) * 8),
            s.y - 20 - i * 7 - (Math.round(this.time * 5) % 6),
            2,
            2,
          );
        }
      }
    }
    if (p.guard > 0) {
      this.assets.icon(c, 8, s.x - 13, s.y - ACTOR_HEIGHT.head, 26);
    }
  }
  enemy(e: Enemy) {
    const s = this.project(e);
    this.shadow(s, e.appearance === "kharn" ? 30 : e.type === "wolf" ? 19 : 15);
    const c = this.ctx;
    if (e.hp <= 0 && e.appearance !== "kharn")
      c.globalAlpha = Math.max(0, 1 - (e.timer - 1) / 1.5);
    let col = 0;
    if (e.state === "dead") col = 5;
    else if (e.state === "hurt") col = e.type === "wolf" ? 4 : 2;
    else if (e.state === "attack")
      col =
        e.type === "wolf" ? (e.timer < 0.25 ? 2 : 3) : e.timer < 0.25 ? 3 : 4;
    else if (e.state === "chase" || e.state === "patrol")
      col = 1 + (Math.floor(e.animTime * 6) % 2);
    if (e.appearance === "kharn") {
      const col =
        e.hp <= 0 || this.cinematic?.bossPose === "kneel"
          ? 7
          : this.cinematic?.bossPose
            ? 4
            : e.state === "attack"
              ? e.bossAttack && e.bossAttack.remaining < 0.2
                ? 5
                : 4
              : e.state === "recover"
                ? 6
                : e.state === "chase"
                  ? 2 + (Math.floor(e.animTime * 5) % 2)
                  : Math.floor(e.animTime * 2) % 2;
      this.assets.draw(
        c,
        "kharn",
        col,
        (e.phase ?? 1) - 1,
        FRAMES.guardian.width,
        FRAMES.guardian.height,
        s.x,
        s.y,
        1.1,
        e.direction === "left",
      );
    } else if (["bizel", "sentinel"].includes(e.appearance ?? "")) {
      const col =
        e.state === "attack"
          ? 4 + (Math.floor(e.animTime * 6) % 2)
          : e.hp <= 0
            ? 7
            : Math.floor(e.animTime * 6) % 4;
      this.assets.draw(
        c,
        "chapter-enemies",
        col,
        e.appearance === "sentinel" ? 1 : 0,
        96,
        96,
        s.x,
        s.y,
        1,
        e.direction === "left",
      );
    } else if (e.appearance === "machine") this.machine(e, s);
    else
      this.assets.draw(
        c,
        "enemies",
        col,
        e.type === "wolf" ? 1 : 0,
        FRAMES.character.width,
        FRAMES.character.height,
        s.x,
        s.y,
        1,
        e.direction === "left",
      );
    c.globalAlpha = 1;
    if (e.hp > 0) {
      const statusColors: Record<string, string> = {
        burn: "#fa8c55",
        poison: "#8dc98b",
        bleed: "#e57683",
        rune: "#94b4f5",
        corruption: "#b48fe7",
        mark: "#e9ce85",
        root: "#87bdcf",
        stun: "#e0d29a",
        exposed: "#df956c",
      };
      for (const [i, kind] of (e.statusKinds ?? [])
        .filter((k) => statusColors[k])
        .slice(0, 5)
        .entries()) {
        c.fillStyle = statusColors[kind];
        c.fillRect(s.x - 14 + i * 6, s.y - (e.type === "wolf" ? 50 : 81), 4, 4);
      }
      if (e.appearance !== "kharn") {
        c.fillStyle = "#080b12";
        c.fillRect(s.x - 19, s.y - (e.type === "wolf" ? 43 : 74), 38, 6);
        c.fillStyle = "#724452";
        c.fillRect(s.x - 18, s.y - (e.type === "wolf" ? 42 : 73), 36, 4);
        c.fillStyle = "#cc5362";
        c.fillRect(
          s.x - 18,
          s.y - (e.type === "wolf" ? 42 : 73),
          Math.round((36 * e.hp) / e.maxHp),
          3,
        );
      }
      if (e.state === "alert" && e.appearance !== "kharn") {
        c.fillStyle = "#edca80";
        c.font = "bold 14px monospace";
        c.fillText("!", s.x, s.y - 85);
      }
      if (
        e.name &&
        e.appearance !== "kharn" &&
        (e.boss || e.optional || distance(e, this.cameraPoint()) < 8)
      ) {
        c.fillStyle = e.boss ? "#efb06a" : "#b5c1ca";
        c.font = e.boss ? "bold 11px monospace" : "9px monospace";
        c.textAlign = "center";
        c.fillText(e.name, s.x, s.y - (e.boss ? 104 : 91));
      }
    }
  }
  cameraPoint() {
    return this.worldAt(this.view.focus);
  }
  machine(e: Enemy, s: Point) {
    const c = this.ctx;
    c.save();
    c.translate(Math.round(s.x), Math.round(s.y));
    const scale = e.boss ? 1.35 : 1;
    c.scale(scale, scale);
    const stride =
      e.state === "chase" || e.state === "patrol"
        ? Math.floor(Math.sin(e.animTime * 9) * 3)
        : 0;
    const rect = (
      color: string,
      x: number,
      y: number,
      w: number,
      h: number,
    ) => {
      c.fillStyle = color;
      c.fillRect(x, y, w, h);
    };
    rect("#080b10", -21, -68, 42, 54);
    rect("#563d32", -15, -57, 30, 37);
    rect("#a3754d", -15, -57, 6, 31);
    rect("#343d45", -8, -55, 24, 28);
    rect("#747e83", -8, -55, 24, 4);
    rect("#151c22", -7, -47, 17, 20);
    rect(e.phase === 2 ? "#ffdf87" : "#f07836", -4, -44, 11, 15);
    for (let y = -43; y < -28; y += 4) rect("#493125", -7, y, 18, 2);
    rect("#1c262f", -10, -75, 21, 16);
    rect("#b08763", -10, -75, 21, 3);
    rect("#edc272", -6, -69, 4, 3);
    rect("#edc272", 3, -69, 4, 3);
    rect("#7b5940", -23, -58, 9, 29);
    rect("#b19061", -23, -58, 9, 4);
    rect("#555f67", 16, -57, 10, 28);
    rect("#9a7b54", 20, -47, 13, 19);
    rect("#282e34", -14, -22, 10, 18 + stride);
    rect("#282e34", 5, -22, 10, 18 - stride);
    rect("#8a755d", -17, -5 + stride, 15, 5);
    rect("#8a755d", 3, -5 - stride, 15, 5);
    for (let i = 0; i < 3; i++) rect("#a56f44", -17 + i * 4, -51 + i * 6, 2, 2);
    c.restore();
  }
  prop(o: Prop, p: Player) {
    const s = this.project(o);
    if (this.world.region === "ruins" && o.kind === "statue" && o.interaction) {
      paintRune(
        this.ctx,
        s,
        o.interaction === "prism-blue" ? "#73ddfa" : "#b19afc",
        o.interaction === "fragment" ? 55 : 35,
      );
    }
    const frame = o.kind === "npc" ? FRAMES.character : FRAMES.prop;
    if (!onScreen(spriteBounds(s, frame, o.scale), this.view)) return;
    const c = this.ctx;
    if (
      this.world.region === "ruins" &&
      ["statue", "portal", "wall", "fountain", "bench"].includes(o.kind)
    ) {
      const col =
        o.kind === "portal" || o.name === "Arco do Núcleo" || o.interaction === "arena"
          ? 3
          : o.kind === "wall"
            ? 4
            : o.kind === "fountain"
              ? 6
              : o.kind === "bench"
                ? 7
                : o.interaction === "fragment"
                  ? 5
                  : o.interaction === "prism-blue"
                    ? 1
                    : o.interaction === "prism-violet"
                      ? 2
                      : 0;
      if (o.lock && o.opened) c.globalAlpha = 0.16;
      this.occlusion.draw(
        c,
        o.id,
        "ruin-props",
        col,
        s,
        o.scale,
        o.x + o.y,
        this.visibility,
        this.frameDt,
      );
      c.globalAlpha = 1;
      this.propCaption(o, p, s);
      return;
    }
    const objectIndex: Partial<Record<Prop["kind"], number>> = {
      bench: 0,
      fence: 1,
      fountain: 2,
      statue: 3,
    };
    if (objectIndex[o.kind] !== undefined) {
      this.occlusion.draw(
        c,
        o.id,
        "objects",
        objectIndex[o.kind]!,
        s,
        o.scale,
        o.x + o.y,
        this.visibility,
        this.frameDt,
      );
      if (o.kind === "statue" && this.world.region === "kharn") {
        const name =
          o.x === 8
            ? "MARCO DA VIGIA"
            : o.x === 18
              ? "MARCO DO CANAL"
              : "MARCO DA MEMÓRIA";
        c.font = "9px monospace";
        c.textAlign = "center";
        c.fillStyle = "#d1b88e";
        c.fillText(name, s.x, s.y - FRAMES.prop.pivot.y * o.scale - 12);
      }
      this.propCaption(o, p, s);
      return;
    }
    const map: Partial<Record<Prop["kind"], number>> = {
      house: 0,
      ruinHouse: 1,
      portal: 2,
      wall: 3,
      tree: 4,
      deadTree: 5,
      pine: 6,
      rock: 7,
      lantern: 8,
      barrel: 9,
      crate: 10,
      chest: 11,
      fence: 3,
      bench: 10,
    };
    if (o.kind === "npc") {
      this.assets.draw(
        c,
        "arcanista",
        0,
        0,
        FRAMES.character.width,
        FRAMES.character.height,
        s.x,
        s.y,
        o.scale,
      );
      c.fillStyle = "#d5c195";
      c.font = "10px monospace";
      c.textAlign = "center";
      c.fillText(
        o.name ??
          (this.world.region === "kharn"
            ? "IRIA · CARTÓGRAFA"
            : "GUARDIÃ DO ECO"),
        s.x,
        Math.round(s.y - ACTOR_HEIGHT.head * o.scale - 12),
      );
      return;
    }
    if (o.opened) c.globalAlpha = 0.45;
    this.occlusion.draw(
      c,
      o.id,
      "props",
      map[o.kind] ?? 0,
      s,
      o.scale,
      o.x + o.y,
      this.visibility,
      this.frameDt,
    );
    c.globalAlpha = 1;
    if (o.kind === "portal") {
      for (let i = 0; i < 12; i++) {
        c.fillStyle = o.locked
          ? "#c97248"
          : this.world.region === "ferrugem"
            ? "#d3a56f"
            : i % 2
              ? "#a283d3"
              : "#7295bf";
        c.globalAlpha = 0.5 + Math.sin(this.time * 2 + i) * 0.3;
        c.fillRect(
          s.x + Math.round(Math.sin(i * 3.2 + this.time) * 27),
          s.y -
            PROP_HEIGHT.portalParticles -
            Math.round((this.time * 12 + i * 8) % 100),
          2,
          3,
        );
      }
      c.globalAlpha = 1;
    }
    this.propCaption(o, p, s);
  }
  propCaption(o: Prop, p: Player, s: Point) {
    if (
      this.cinematic ||
      !o.name ||
      distance(o, p) > 2.5 ||
      (o.opened && !o.lock)
    )
      return;
    if (["wall", "lantern", "statue"].includes(o.kind) && !o.interaction)
      return;
    const c = this.ctx;
    c.font = "9px monospace";
    c.textAlign = "center";
    c.fillStyle = o.locked || (o.solid && o.lock) ? "#e49c73" : "#ccbd95";
    c.fillText(
      `${o.name}${o.locked ? " · BLOQUEADA" : o.lock && o.solid ? " · FECHADO" : ""}`,
      s.x,
      s.y - (o.kind === "portal" ? 174 : 103),
    );
    if (o.locked && distance(o, p) < 2.5)
      c.fillText(o.blockedReason ?? "Passagem bloqueada", s.x, s.y - 162);
  }
  goal(goal: Objective, player: Player) {
    const foot = this.project(goal),
      head = { x: foot.x, y: foot.y - goal.height };
    const at = placeObjective(head, this.view.width, this.view.height, this.hudBounds);
    const c = this.ctx;
    c.save();
    c.fillStyle = "rgba(4,10,18,.9)";
    c.fillRect(Math.round(at.x) - 13, Math.round(at.y) - 13, 26, 26);
    objectiveIcon(
      c,
      goal.kind,
      at.x,
      at.y,
      14,
      goal.category === "secondary" ? "#efb74e" : "#e8bd68",
    );
    if (at.outside) {
      c.translate(at.x, at.y);
      c.rotate(at.angle);
      c.fillStyle = "#e8bd68";
      c.beginPath();
      c.moveTo(21, 0);
      c.lineTo(15, -4);
      c.lineTo(15, 4);
      c.closePath();
      c.fill();
    } else if (distance(goal, player) < 5) {
      c.font = "11px monospace";
      c.textAlign = "center";
      const width = c.measureText(goal.label).width + 16;
      const x = Math.max(
        width / 2 + 4,
        Math.min(this.view.width - width / 2 - 4, at.x),
      );
      c.fillRect(x - width / 2, at.y + 17, width, 20);
      c.fillStyle = "#f4d698";
      c.fillText(goal.label, x, at.y + 31);
    }
    c.restore();
  }
  lanternLight(o: Prop) {
    const s = this.project(o),
      c = this.ctx;
    if (s.x < -80 || s.x > this.view.width + 80) return;
    const flicker = Math.floor(this.time * 8) % 3;
    for (let ring = 5; ring > 0; ring--) {
      c.fillStyle = `rgba(228,138,55,${0.009 + 0.006 * (6 - ring)})`;
      const r = ring * 13 + flicker;
      c.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        const x = Math.round(s.x + Math.cos(a) * r),
          y = Math.round(s.y - PROP_HEIGHT.light + Math.sin(a) * r * 0.6);
        if (!i) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.closePath();
      c.fill();
    }
  }
  vfx(
    row: number,
    col: number,
    x: number,
    y: number,
    angle = 0,
    scale = 1,
    color?: string,
  ) {
    const c = this.ctx;
    c.save();
    c.translate(Math.round(x), Math.round(y));
    c.rotate(angle);
    c.drawImage(
      effectFrame(this.assets.images.effects, row, col, color),
      0,
      0,
      FRAMES.effect.width,
      FRAMES.effect.height,
      Math.round(-FRAMES.effect.pivot.x * scale),
      Math.round(-FRAMES.effect.pivot.y * scale),
      Math.round(FRAMES.effect.width * scale),
      Math.round(FRAMES.effect.height * scale),
    );
    c.restore();
  }
  projectile(b: Projectile) {
    const s = this.project(b);
    const screen = iso({ x: b.vx, y: b.vy });
    this.ctx.fillStyle = b.color;
    this.ctx.fillRect(s.x - 2, s.y - ACTOR_HEIGHT.projectile - 2, 4, 4);
    this.vfx(
      b.color === "#fc8953" ? 0 : 1,
      2 + (Math.floor(this.time * 12) % 3),
      s.x,
      s.y - ACTOR_HEIGHT.projectile,
      Math.atan2(screen.y, screen.x),
      0.6,
      b.color,
    );
  }
  effect(e: Effect, position = effectPosition(e)) {
    const s = this.project(position),
      c = this.ctx,
      t = e.time / e.duration,
      col = Math.min(7, Math.floor(t * 8));
    if (e.kind === "slash") {
      const n = iso({ x: Math.cos(e.angle), y: Math.sin(e.angle) });
      const angle = Math.atan2(n.y, n.x);
      this.vfx(0, col, s.x, s.y - ACTOR_HEIGHT.slash, angle, 1, e.color);
    } else if (e.kind === "nova")
      this.vfx(2, col, s.x, s.y - ACTOR_HEIGHT.nova, 0, 1.4, e.color);
    else if (e.kind === "heal")
      this.vfx(4, col, s.x, s.y - ACTOR_HEIGHT.heal, 0, 1, e.color);
    else if (e.kind === "impact")
      this.vfx(3, col, s.x, s.y - ACTOR_HEIGHT.impact, 0, 0.7, e.color);
    else if (e.kind === "death")
      this.vfx(5, col, s.x, s.y - ACTOR_HEIGHT.nova, 0, 1, e.color);
    else if (e.kind === "dash")
      this.vfx(1, col, s.x, s.y - ACTOR_HEIGHT.impact, 0, 0.5, e.color);
    c.globalAlpha = 1;
    if (e.kind !== "death") {
      c.fillStyle = e.color;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + e.time * 4;
        c.fillRect(
          s.x + Math.round(Math.cos(a) * 12),
          s.y - ACTOR_HEIGHT.impact + Math.round(Math.sin(a) * 8),
          2,
          2,
        );
      }
    }
  }
}
