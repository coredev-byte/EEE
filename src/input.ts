import type { Point } from "./world";
export class Input {
  keys = new Set<string>();
  pointer: Point = { x: 0, y: 0 };
  pointerActive = false;
  onKey: (key: string) => void = () => {};
  onAttack: () => void = () => {};
  constructor(readonly canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", (e) => {
      if (e.target instanceof HTMLInputElement) return;
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k))
        e.preventDefault();
      if (!e.repeat) this.onKey(k);
      this.keys.add(k);
    });
    window.addEventListener("keyup", (e) =>
      this.keys.delete(e.key.toLowerCase()),
    );
    window.addEventListener("blur", () => this.keys.clear());
    canvas.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      this.pointer = {
        x: ((e.clientX - r.left) * 960) / r.width,
        y: ((e.clientY - r.top) * 540) / r.height,
      };
      this.pointerActive = true;
    });
    canvas.addEventListener("pointerdown", (e) => {
      if (e.button === 0) {
        this.pointerActive = true;
        this.onAttack();
      }
    });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  movement(): Point {
    const x =
      Number(this.keys.has("arrowright")) - Number(this.keys.has("arrowleft"));
    const y =
      Number(this.keys.has("arrowdown")) - Number(this.keys.has("arrowup"));
    const n = Math.hypot(x, y) || 1;
    return { x: x / n, y: y / n };
  }
}
