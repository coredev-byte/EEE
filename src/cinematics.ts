import { SCENES, type Scene } from "./prologue-story";
import type { Point } from "./world";
export interface CinematicFrame {
  camera: Point;
  zoom: number;
  fade: number;
  pulse: number;
  speaker: string;
  text: string;
  title: string;
}
/** Transient visual state is deliberately not saved. Interrupted shots restart safely. */
export class Cinematics {
  scene: Scene | null = null;
  elapsed = 0;
  start(id: string) {
    this.scene = SCENES.find((s) => s.id === id) ?? null;
    this.elapsed = 0;
  }
  get id() {
    return this.scene?.id ?? null;
  }
  get duration() {
    return this.scene?.shots.reduce((n, s) => n + s.duration, 0) ?? 0;
  }
  update(dt: number) {
    if (this.scene) this.elapsed += dt;
    return !!this.scene && this.elapsed >= this.duration;
  }
  finish() {
    const id = this.id;
    this.scene = null;
    this.elapsed = 0;
    return id;
  }
  frame(reduced = false, player?: Point): CinematicFrame | null {
    if (!this.scene) return null;
    let t = this.elapsed,
      shot = this.scene.shots.at(-1)!;
    for (const s of this.scene.shots) {
      shot = s;
      if (t < s.duration) break;
      t -= s.duration;
    }
    const f = Math.min(1, t / shot.duration),
      ease = f * f * (3 - 2 * f);
    const returnToPlayer =
      player &&
      !["silence", "signal"].includes(this.scene.id) &&
      this.elapsed > this.duration - 1.5;
    const camera = reduced
      ? { ...shot.to }
      : {
          x: shot.from.x + (shot.to.x - shot.from.x) * ease,
          y: shot.from.y + (shot.to.y - shot.from.y) * ease,
        };
    const returnFactor = returnToPlayer
      ? reduced
        ? 1
        : Math.min(1, (this.elapsed - (this.duration - 1.5)) / 1.5)
      : 0;
    if (player) {
      camera.x += (player.x - camera.x) * returnFactor;
      camera.y += (player.y - camera.y) * returnFactor;
    }
    return {
      camera: camera,
      zoom: reduced ? 1 : shot.zoom + (1 - shot.zoom) * returnFactor,
      fade: shot.fade ? Math.max(0, 1 - t / 2) : 0,
      pulse: shot.pulse ? (reduced ? 0.08 : 0.12 + 0.12 * Math.sin(t * 3)) : 0,
      speaker: shot.speaker,
      text: shot.text,
      title: this.scene.title,
    };
  }
}
