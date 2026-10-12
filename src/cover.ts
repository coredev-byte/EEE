import type { Assets } from "./assets";

// Decorative title scene only: no combat entities or saved game state are changed.
export class CoverScene {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly image: HTMLImageElement;
  private readonly reduced = matchMedia("(prefers-reduced-motion: reduce)");
  private readonly resize: ResizeObserver;
  private frame = 0;
  private last = 0;
  private time = 0;
  private disposed = false;
  private readonly visibility = () => this.resume();
  private readonly motion = () => this.resume();

  constructor(private canvas: HTMLCanvasElement, private assets: Assets) {
    this.ctx = canvas.getContext("2d")!;
    this.image = canvas.parentElement!.querySelector<HTMLImageElement>(".cover-art")!;
    this.resize = new ResizeObserver(() => this.draw());
    this.resize.observe(canvas);
    document.addEventListener("visibilitychange", this.visibility);
    this.reduced.addEventListener("change", this.motion);
    void this.image.decode().then(() => this.resume()).catch(() => {});
  }

  private resume() {
    if (this.disposed) return;
    cancelAnimationFrame(this.frame);
    this.last = 0;
    this.draw();
    this.canvas.dataset.active = String(!document.hidden && !this.reduced.matches);
    if (!document.hidden && !this.reduced.matches)
      this.frame = requestAnimationFrame((now) => this.tick(now));
  }

  private tick(now: number) {
    if (this.disposed) return;
    if (!this.last || now - this.last >= 1000 / 30) {
      if (this.last) this.time += Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      this.draw();
      this.canvas.dataset.frames = String(Number(this.canvas.dataset.frames ?? 0) + 1);
    }
    this.frame = requestAnimationFrame((stamp) => this.tick(stamp));
  }

  private wind(points: number[][], top: number, bottom: number, strength: number, phase: number) {
    const c = this.ctx;
    c.save();
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.closePath();
    c.clip();
    for (let y = top; y < bottom; y += 2) {
      const bend = Math.sin(this.time * 2.2 + y * 0.055 + phase) * strength
        * Math.min(1, (y - top) / 30);
      c.drawImage(this.image, 0, y, 1672, 2, bend, y, 1672, 2);
    }
    c.restore();
  }

  private enemy(x: number, y: number, column: number, flip: boolean, scale = 0.35) {
    const c = this.ctx;
    c.save();
    c.globalAlpha = 0.82;
    c.fillStyle = "#04091899";
    c.beginPath();
    c.ellipse(x, y, 11, 3, 0, 0, Math.PI * 2);
    c.fill();
    this.assets.draw(c, "enemies", column, 0, 96, 112, x, y, scale, flip);
    c.restore();
  }

  private battle(left: number, right: number, y: number, offset: number) {
    const c = this.ctx;
    const phase = (this.time + offset) % 18;
    const approach = phase < 5 ? phase / 5 : phase < 12 ? 1 : Math.max(0, 1 - (phase - 12) / 6);
    const center = (left + right) / 2;
    const a = left + (center - 15 - left) * approach;
    const b = right - (right - center - 15) * approach;
    const fighting = phase >= 5 && phase < 12;
    const swing = Math.floor(this.time * 5) % 4;
    const walk = 1 + Math.floor(this.time * 6) % 2;
    this.enemy(a, y, fighting ? (swing < 2 ? 3 : 4) : walk, false);
    this.enemy(b, y + 3, fighting ? (swing < 2 ? 2 : 3) : walk, true);
    if (fighting) {
      c.save();
      c.strokeStyle = "#ffe39c";
      c.globalAlpha = 0.65;
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(center, y - 16, 15, this.time * 8, this.time * 8 + 1.2);
      c.stroke();
      if (swing === 0) {
        c.fillStyle = "#ffd87a";
        for (let i = 0; i < 5; i++)
          c.fillRect(center + Math.cos(i * 1.3 + this.time) * 11, y - 16 + Math.sin(i * 1.3) * 9, 2, 2);
      }
      c.restore();
    }
  }

  private draw() {
    if (this.disposed || !this.image.complete || !this.image.naturalWidth) return;
    const { width, height } = this.canvas.getBoundingClientRect();
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.round(width * ratio), h = Math.round(height * ratio);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, w, h);
    const scale = Math.max(w / 1672, h / 941);
    c.setTransform(scale, 0, 0, scale, (w - 1672 * scale) / 2, (h - 941 * scale) / 2);
    c.imageSmoothingEnabled = false;
    c.drawImage(this.image, 0, 0, 1672, 941);
    if (this.reduced.matches) return;
    this.wind([[478,529],[512,518],[546,532],[546,570],[495,579],[476,558]], 518, 580, 2.6, 1);
    this.wind([[448,574],[495,576],[512,603],[501,642],[463,674],[409,667],[435,628]], 574, 675, 3.5, 0);
    this.wind([[167,93],[243,106],[239,360],[223,383],[192,362],[172,383]], 93, 385, 3.6, 2);
    this.wind([[1408,540],[1467,536],[1456,663],[1432,681],[1412,672]], 536, 684, 3, 1);
    c.save();
    c.globalCompositeOperation = "screen";
    const moonX = 1198 + Math.sin(this.time * 0.25) * 3;
    const glow = c.createRadialGradient(moonX, 60, 12, moonX, 60, 105);
    glow.addColorStop(0, `rgba(145,194,255,${0.045 + (Math.sin(this.time * 0.55) + 1) * 0.035})`);
    glow.addColorStop(1, "rgba(145,194,255,0)");
    c.fillStyle = glow;
    c.fillRect(1080, 0, 240, 170);
    c.restore();
    this.battle(1128, 1325, 340, 0);
    this.battle(1010, 1170, 510, 8);
    this.canvas.dataset.scene = this.time % 18 >= 5 && this.time % 18 < 12 ? "combat" : "patrol";
    // Wind-borne dust and embers add motion without obscuring the menu.
    c.fillStyle = "#f3c778";
    for (let i = 0; i < 22; i++) {
      const x = (i * 173 + this.time * (10 + i % 4)) % 1672;
      const y = 220 + (i * 83) % 620 + Math.sin(this.time + i) * 10;
      c.globalAlpha = 0.16 + (Math.sin(this.time * 0.8 + i) + 1) * 0.1;
      c.fillRect(x, y, 2, 2);
    }
    c.globalAlpha = 1;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resize.disconnect();
    document.removeEventListener("visibilitychange", this.visibility);
    this.reduced.removeEventListener("change", this.motion);
  }
}
