// Procedural development audio; replace via the documented asset manifest for final production.
export class AudioEngine {
  context: AudioContext | null = null;
  enabled = true;
  volume = 0.12;
  ambient: OscillatorNode | null = null;
  ambientGain: GainNode | null = null;
  unlock() {
    if (!this.enabled) return;
    this.context ??= new AudioContext();
    void this.context.resume();
    if (!this.ambient) {
      const o = this.context.createOscillator();
      const g = this.context.createGain();
      o.type = "sine";
      o.frequency.value = 55;
      g.gain.value = this.volume * 0.1;
      o.connect(g).connect(this.context.destination);
      o.start();
      this.ambient = o;
      this.ambientGain = g;
    }
  }
  toggle() {
    this.enabled = !this.enabled;
    if (this.ambientGain)
      this.ambientGain.gain.value = this.enabled ? this.volume * 0.1 : 0;
    if (this.enabled) this.unlock();
  }
  skill(element: string) {
    if (!this.enabled || !this.context) return;
    const c = this.context;
    const frequency: Record<string, number> = {
      steel: 160,
      blood: 95,
      rune: 330,
      fire: 220,
      void: 75,
      arcane: 660,
      shadow: 130,
      poison: 280,
      precision: 950,
      device: 430,
      hunt: 510,
    };
    const o = c.createOscillator(),
      g = c.createGain();
    o.type = ["steel", "blood", "precision", "device"].includes(element)
      ? "triangle"
      : "sine";
    o.frequency.setValueAtTime(frequency[element] ?? 350, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.25);
    g.gain.setValueAtTime(this.volume * 0.45, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.28);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.3);
  }
  sound(kind: "attack" | "hit" | "magic" | "step" | "death" | "interact") {
    if (!this.enabled || !this.context) return;
    const c = this.context;
    const o = c.createOscillator(),
      g = c.createGain();
    const f = {
      attack: 190,
      hit: 95,
      magic: 680,
      step: 65,
      death: 55,
      interact: 480,
    }[kind];
    o.type = kind === "magic" || kind === "interact" ? "sine" : "triangle";
    o.frequency.setValueAtTime(f, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(20, f * 0.3),
      c.currentTime + 0.15,
    );
    g.gain.setValueAtTime(
      this.volume * (kind === "step" ? 0.18 : 0.6),
      c.currentTime,
    );
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.21);
  }
}
