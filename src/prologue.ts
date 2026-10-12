import { Cinematics } from "./cinematics";
import { HINTS, TutorialHints } from "./tutorial-hints";
import type { Point } from "./world";
export const STEPS = HINTS.map((h) => h.id);
export interface PrologueSave {
  version: 1;
  step: string;
  scenes: string[];
  hints: string[];
  events: string[];
  moved: number;
  ran: number;
  complete: boolean;
}
export const freshPrologue = (): PrologueSave => ({
  version: 1,
  step: "move",
  scenes: [],
  hints: [],
  events: [],
  moved: 0,
  ran: 0,
  complete: false,
});
export function restorePrologue(raw: unknown): PrologueSave | null {
  if (raw == null) return null; // Legacy journeys retain their existing campaign, never replay rewards.
  const s = raw as PrologueSave;
  const ids = [
    "silence",
    "signal",
    "awakening",
    "anomaly",
    "threat",
    "evidence",
    "handover",
  ];
  if (
    s.version !== 1 ||
    !STEPS.includes(s.step) ||
    typeof s.complete !== "boolean" ||
    ![s.moved, s.ran].every((n) => Number.isFinite(n) && n >= 0 && n < 1e7) ||
    !Array.isArray(s.scenes) ||
    s.scenes.some((i) => !ids.includes(i)) ||
    new Set(s.scenes).size !== s.scenes.length ||
    !Array.isArray(s.hints) ||
    s.hints.some((i) => !STEPS.includes(i)) ||
    new Set(s.hints).size !== s.hints.length ||
    !Array.isArray(s.events) ||
    s.events.length > 100 ||
    s.events.some((e) => typeof e !== "string" || e.length > 80) ||
    new Set(s.events).size !== s.events.length
  )
    return null;
  return structuredClone(s);
}
export interface TutorialFacts {
  kills: number;
  foundSeal: boolean;
  seal: boolean;
  accepted: boolean;
  chests: number;
  skills: boolean;
  resourcesFull: boolean;
  potion: boolean;
  inventory: boolean;
  journal: boolean;
  classes: boolean;
  tree: boolean;
}
/** Observational FSM. Never spawns enemies, grants points, coins or quest rewards. */
export class Prologue {
  cinematic = new Cinematics();
  hints = new TutorialHints();
  previous: Point | null = null;
  dirty = false;
  constructor(public state: PrologueSave | null = null) {}
  get active() {
    return !!this.state && !this.state.complete;
  }
  get locked() {
    return this.active && !!this.cinematic.id;
  }
  event(id: string) {
    if (this.state && !this.state.events.includes(id)) {
      this.state.events.push(id);
      this.dirty = true;
    }
  }
  seen(id: string) {
    return this.state?.events.includes(id) ?? false;
  }
  movement(p: Point, run: boolean) {
    if (this.active && !this.locked && this.previous) {
      const d = Math.hypot(p.x - this.previous.x, p.y - this.previous.y);
      if (d < 0.5) {
        this.state!.moved += d;
        if (run) this.state!.ran += d;
      }
    }
    this.previous = { x: p.x, y: p.y };
  }
  begin() {
    this.previous = null;
    this.hints.reset();
    if (this.active) this.nextScene();
  }
  private nextScene(f?: TutorialFacts) {
    const s = this.state!;
    const id =
      ["silence", "signal", "awakening"].find((id) => !s.scenes.includes(id)) ??
      (f && f.kills >= 1 && !s.scenes.includes("anomaly")
        ? "anomaly"
        : f && f.kills >= 2 && f.kills < 3 && !s.scenes.includes("threat")
          ? "threat"
          : f?.seal && !s.scenes.includes("evidence")
            ? "evidence"
            : f?.seal && !s.scenes.includes("handover")
              ? "handover"
              : null);
    if (id) {
      this.cinematic.start(id);
      this.hints.reset();
      this.dirty = true;
    }
  }
  finishScene() {
    const id = this.cinematic.finish();
    if (id && this.state && !this.state.scenes.includes(id)) {
      this.state.scenes.push(id);
      this.dirty = true;
    }
    this.previous = null;
  }
  update(dt: number, f: TutorialFacts) {
    if (!this.active) return;
    const s = this.state!;
    if (this.locked) {
      if (this.cinematic.update(dt)) this.finishScene();
      return;
    }
    this.nextScene(f);
    if (this.locked) return;
    const done: Record<string, boolean> = {
      move: s.moved >= 1.5 && s.ran >= 0.5,
      guardian: f.accepted,
      explore: f.foundSeal,
      combat: f.kills >= 1,
      skills: f.skills,
      potions: f.potion || (s.step === "potions" && f.resourcesFull),
      chest: f.chests > 0,
      inventory: f.inventory,
      journal: f.journal,
      classes: f.classes,
      tree: f.tree,
      threats: f.kills >= 3,
      seal: f.seal,
    };
    for (const id of STEPS) if (done[id]) this.event(`done:${id}`);
    const step = STEPS.find((id) => !this.seen(`done:${id}`));
    if (!step && s.scenes.includes("handover")) {
      s.complete = true;
      this.hints.reset();
      this.dirty = true;
      return;
    }
    if (step && step !== s.step) {
      s.step = step;
      this.hints.reset();
      this.dirty = true;
    }
    this.hints.update(
      dt,
      HINTS.filter((h) => h.id === s.step),
      s.hints,
      true,
    );
  }
}
