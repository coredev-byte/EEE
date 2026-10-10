import {
  VIEW,
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
  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly assets: Assets,
    readonly world: World,
  ) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.ctx.imageSmoothingEnabled = false;
    this.floor = document.createElement("canvas");
    this.floorOrigin = (world.size * TILE.width) / 2;
    this.floor.width = (world.size + 1) * TILE.width;
    this.floor.height = (world.size + 2) * TILE.height;
    this.makeFloor();
  }
  makeFloor() {
    const c = this.floor.getContext("2d")!;
    c.imageSmoothingEnabled = false;
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
      }
  }
  project(p: Point): Point {
    return worldToScreen(p, this.camera);
  }
  worldAt(screen: Point): Point {
    return screenToWorld(screen, this.camera);
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
  ) {
    this.time += dt;
    const target = iso(p),
      f = 1 - Math.exp(-dt * 7);
    this.camera.x += (target.x - this.camera.x) * f;
    this.camera.y += (target.y - this.camera.y) * f;
    const c = this.ctx;
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#070d17";
    c.fillRect(0, 0, VIEW.width, VIEW.height);
    c.drawImage(
      this.floor,
      VIEW.focus.x - cameraPixels(this.camera).x - this.floorOrigin,
      VIEW.focus.y - cameraPixels(this.camera).y - this.floorOffsetY,
    );
    const entries: WorldDraw[] = this.world.props.map((prop) => ({
      point: prop,
      layer: 1,
      draw: () => this.prop(prop, p),
    }));
    for (const enemy of enemies)
      if (enemy.hp > 0 || enemy.timer < 2.5)
        entries.push({ point: enemy, layer: 1, draw: () => this.enemy(enemy) });
    entries.push({ point: p, layer: 1, draw: () => this.player(p) });
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
    // Pixel-locked foreground vignette, never filtering the sprites.
    for (let i = 0; i < 5; i++) {
      c.fillStyle = `rgba(2,5,12,${0.13 - i * 0.018})`;
      const edge = 12 + i * 8;
      c.fillRect(0, 0, VIEW.width, edge);
      c.fillRect(0, VIEW.height - edge, VIEW.width, edge);
      c.fillRect(0, edge, edge, VIEW.height - edge * 2);
      c.fillRect(VIEW.width - edge, edge, edge, VIEW.height - edge * 2);
    }
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
    this.shadow(s, e.type === "wolf" ? 19 : 15);
    const c = this.ctx;
    if (e.hp <= 0) c.globalAlpha = Math.max(0, 1 - (e.timer - 1) / 1.5);
    let col = 0;
    if (e.state === "dead") col = 5;
    else if (e.state === "hurt") col = e.type === "wolf" ? 4 : 2;
    else if (e.state === "attack")
      col =
        e.type === "wolf" ? (e.timer < 0.25 ? 2 : 3) : e.timer < 0.25 ? 3 : 4;
    else if (e.state === "chase" || e.state === "patrol")
      col = 1 + (Math.floor(e.animTime * 6) % 2);
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
      if (e.state === "alert") {
        c.fillStyle = "#edca80";
        c.font = "bold 14px monospace";
        c.fillText("!", s.x, s.y - 85);
      }
    }
  }
  prop(o: Prop, p: Player) {
    const s = this.project(o);
    const frame = o.kind === "npc" ? FRAMES.character : FRAMES.prop;
    if (!onScreen(spriteBounds(s, frame, o.scale))) return;
    const c = this.ctx;
    const objectIndex: Partial<Record<Prop["kind"], number>> = {
      bench: 0,
      fence: 1,
      fountain: 2,
      statue: 3,
    };
    if (objectIndex[o.kind] !== undefined) {
      this.assets.draw(
        c,
        "objects",
        objectIndex[o.kind]!,
        0,
        FRAMES.prop.width,
        FRAMES.prop.height,
        s.x,
        s.y,
        o.scale,
      );
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
        "GUARDIÃ DO ECO",
        s.x,
        Math.round(s.y - ACTOR_HEIGHT.head * o.scale - 12),
      );
      return;
    }
    if (
      (o.kind === "house" ||
        o.kind === "ruinHouse" ||
        o.kind === "tree" ||
        o.kind === "pine") &&
      o.x + o.y > p.x + p.y &&
      distance(o, p) < 2.8
    )
      c.globalAlpha = 0.48;
    if (o.opened) c.globalAlpha = 0.45;
    this.assets.draw(
      c,
      "props",
      map[o.kind] ?? 0,
      0,
      FRAMES.prop.width,
      FRAMES.prop.height,
      s.x,
      s.y,
      o.scale,
    );
    c.globalAlpha = 1;
    if (o.kind === "portal") {
      for (let i = 0; i < 12; i++) {
        c.fillStyle = i % 2 ? "#a283d3" : "#7295bf";
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
  }
  lanternLight(o: Prop) {
    const s = this.project(o),
      c = this.ctx;
    if (s.x < -80 || s.x > VIEW.width + 80) return;
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
  vfx(row: number, col: number, x: number, y: number, angle = 0, scale = 1) {
    const c = this.ctx;
    c.save();
    c.translate(Math.round(x), Math.round(y));
    c.rotate(angle);
    c.drawImage(
      this.assets.images.effects,
      col * FRAMES.effect.width,
      row * FRAMES.effect.height,
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
    this.vfx(
      b.color === "#fc8953" ? 0 : 1,
      2 + (Math.floor(this.time * 12) % 3),
      s.x,
      s.y - ACTOR_HEIGHT.projectile,
      Math.atan2(screen.y, screen.x),
      0.6,
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
      this.vfx(0, col, s.x, s.y - ACTOR_HEIGHT.slash, angle, 1);
    } else if (e.kind === "nova")
      this.vfx(2, col, s.x, s.y - ACTOR_HEIGHT.nova, 0, 1.4);
    else if (e.kind === "heal") this.vfx(4, col, s.x, s.y - ACTOR_HEIGHT.heal);
    else if (e.kind === "impact")
      this.vfx(3, col, s.x, s.y - ACTOR_HEIGHT.impact, 0, 0.7);
    else if (e.kind === "death") this.vfx(5, col, s.x, s.y - ACTOR_HEIGHT.nova);
    else if (e.kind === "dash")
      this.vfx(1, col, s.x, s.y - ACTOR_HEIGHT.impact, 0, 0.5);
    c.globalAlpha = 1;
  }
}
