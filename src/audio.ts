import {
  AUDIO_FILES,
  DEFAULT_AUDIO,
  AUDIO_SETTINGS_KEY,
  readSettings,
  soundSpec,
  spatialMix,
  MUSIC_LEVELS,
  type AudioSettings,
  type AudioBus,
  type AudioEvent,
  type AudioCue,
  type MusicState,
  type Soundscape,
} from "./audio-catalog";
interface Voice {
  source: AudioBufferSourceNode;
  gain: GainNode;
  panner?: StereoPannerNode;
  priority: number;
  owner?: string;
  bus: AudioBus;
  loop: boolean;
}
export interface AudioEnvironment {
  createContext?: () => AudioContext;
  fetch?: (url: string) => Promise<Response>;
  storage?: Storage;
  random?: () => number;
}
export class AudioEngine {
  context: AudioContext | null = null;
  settings: AudioSettings;
  private buses = new Map<AudioBus, GainNode>();
  private master: GainNode | null = null;
  private duck: GainNode | null = null;
  private bytes = new Map<string, Promise<ArrayBuffer | null>>();
  private buffers = new Map<string, AudioBuffer>();
  private voices = new Set<Voice>();
  private loops = new Map<string, Voice>();
  private last = new Map<string, number>();
  private choices = new Map<string, number>();
  private pendingLoot: {
    event: AudioEvent;
    cue: AudioCue;
    rank: number;
  } | null = null;
  private lootTimer: ReturnType<typeof setTimeout> | null = null;
  private listener = { x: 12, y: 12 };
  private region: Soundscape = "village";
  private music: MusicState = "menu";
  private paused = false;
  private hidden = false;
  private transport = 0;
  private cueUntil = 0;
  private cueState: MusicState = "safe";
  private loading: Promise<void> | null = null;
  errors: string[] = [];
  played: {
    event: string;
    time: number;
    families: string[];
    owner?: string;
    position?: { x: number; y: number };
    pan: number;
    gain: number;
  }[] = [];
  suppressed = 0;
  constructor(readonly env: AudioEnvironment = {}) {
    let storage = env.storage;
    try {
      storage ??=
        typeof localStorage === "undefined" ? undefined : localStorage;
    } catch {}
    this.settings = readSettings(storage);
    this.env.storage = storage;
  }
  get enabled() {
    return !this.settings.muted;
  }
  prepare() {
    for (const paths of Object.values(AUDIO_FILES))
      for (const path of paths)
        if (!this.bytes.has(path))
          this.bytes.set(
            path,
            (this.env.fetch ?? fetch)(path)
              .then(async (r) => {
                if (!r.ok) throw Error(`HTTP ${r.status}`);
                return await r.arrayBuffer();
              })
              .catch((e) => {
                this.error(`${path}: ${String(e)}`);
                return null;
              }),
          );
  }
  private error(message: string) {
    if (!this.errors.includes(message)) {
      this.errors.push(message);
      console.warn(`[Distrito Zero / áudio] ${message}`);
    }
  }
  unlock() {
    if (!this.context) {
      try {
        this.context = this.env.createContext?.() ?? new AudioContext();
        this.master = this.context.createGain();
        this.duck = this.context.createGain();
        const compressor = this.context.createDynamicsCompressor();
        compressor.threshold.value = -8;
        compressor.knee.value = 8;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.15;
        this.duck.connect(this.master).connect(compressor);
        connectLimiter(this.context, compressor);
        for (const bus of [
          "music",
          "ambience",
          "combat",
          "ui",
          "voices",
        ] as AudioBus[]) {
          const gain = this.context.createGain();
          gain.connect(this.duck);
          this.buses.set(bus, gain);
        }
        this.transport = this.context.currentTime;
        this.applySettings();
      } catch (e) {
        this.error(`AudioContext: ${String(e)}`);
        return;
      }
    }
    void this.context.resume().catch((e) => this.error(`resume: ${String(e)}`));
    if (!this.loading) {
      this.prepare();
      this.loading = this.load().then(() => this.refreshLoops());
    }
  }
  private async load() {
    const context = this.context;
    await Promise.all(
      [...this.bytes].map(async ([url, request]) => {
        const raw = await request;
        if (!raw || !context) return;
        try {
          const decoded = await context.decodeAudioData(raw.slice(0));
          if (this.context === context) this.buffers.set(url, decoded);
        } catch (e) {
          this.error(`decode ${url}: ${String(e)}`);
        }
      }),
    );
  }
  async ready() {
    await this.loading;
  }
  setVolume(bus: keyof Omit<AudioSettings, "muted">, value: number) {
    if (!Number.isFinite(value)) return;
    this.settings[bus] = Math.max(0, Math.min(1, value));
    this.applySettings();
    this.persist();
  }
  toggle() {
    this.settings.muted = !this.settings.muted;
    this.applySettings();
    this.persist();
    if (!this.context) this.unlock();
  }
  private persist() {
    try {
      this.env.storage?.setItem(
        AUDIO_SETTINGS_KEY,
        JSON.stringify(this.settings),
      );
    } catch (e) {
      this.error(`configurações não salvas: ${String(e)}`);
    }
  }
  private ramp(param: AudioParam, value: number, seconds = 0.04) {
    if (!this.context) return;
    const now = this.context.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + seconds);
  }
  private applySettings() {
    if (!this.context || !this.master) return;
    this.ramp(
      this.master.gain,
      this.settings.muted || this.hidden ? 0 : this.settings.master,
    );
    for (const [id, gain] of this.buses)
      this.ramp(
        gain.gain,
        this.settings[id] * (this.paused && id === "combat" ? 0 : 1),
      );
  }
  emit(event: AudioEvent, cue: AudioCue = {}): boolean {
    if (
      !this.context ||
      this.context.state !== "running" ||
      this.settings.muted ||
      this.hidden
    )
      return false;
    if (event.startsWith("loot.") && event !== "loot.denied") {
      const rank =
        (
          {
            "loot.coins": 0,
            "loot.material": 1,
            "loot.common": 1,
            "loot.rare": 2,
            "loot.epic": 3,
            "loot.legendary": 4,
            "loot.quest": 5,
          } as Partial<Record<AudioEvent, number>>
        )[event] ??
        (cue.rarity === "Comum" ? 1 : cue.rarity === "Rúnica" ? 3 : 2);
      if (!this.pendingLoot || rank > this.pendingLoot.rank)
        this.pendingLoot = { event, cue: { ...cue }, rank };
      if (!this.lootTimer)
        this.lootTimer = setTimeout(() => {
          const pending = this.pendingLoot;
          this.pendingLoot = null;
          this.lootTimer = null;
          if (pending) this.play(pending.event, pending.cue);
        }, 70);
      return true;
    }
    return this.play(event, cue);
  }
  private play(event: AudioEvent, cue: AudioCue = {}): boolean {
    const c = this.context;
    if (!c || c.state !== "running" || this.settings.muted || this.hidden)
      return false;
    const spec = soundSpec(event, cue);
    if (this.paused && spec.bus === "combat") return false;
    const spatial = spatialMix(
      spec.spatial ? cue.position : undefined,
      this.listener,
    );
    if (
      spatial.gain === 0 ||
      this.settings.master === 0 ||
      this.settings[spec.bus] === 0
    )
      return false;
    const now = c.currentTime,
      key = spec.key;
    if (now - (this.last.get(key) ?? -Infinity) < spec.interval / 1000) {
      this.suppressed++;
      return false;
    }
    if (
      spec.loop &&
      cue.owner &&
      [...this.voices].some((v) => v.loop && v.owner === cue.owner)
    )
      return false;
    const available = spec.families
      .map((family) => {
        const paths = AUDIO_FILES[family] ?? [],
          prev = this.choices.get(family) ?? -1;
        let pick = Math.floor(
          (this.env.random ?? Math.random)() * paths.length,
        );
        if (paths.length > 1 && pick === prev) pick = (pick + 1) % paths.length;
        this.choices.set(family, pick);
        return { family, buffer: this.buffers.get(paths[pick]) };
      })
      .filter((x) => x.buffer);
    if (!available.length) return false;
    this.last.set(key, now);
    let count = 0;
    for (const { buffer } of available) {
      if (this.voices.size >= 18) {
        const lowest = [...this.voices].sort(
          (a, b) => a.priority - b.priority,
        )[0];
        if (lowest.priority >= spec.priority) {
          this.suppressed++;
          continue;
        }
        this.stopVoice(lowest, true);
      }
      const source = c.createBufferSource(),
        gain = c.createGain();
      source.buffer = buffer!;
      source.loop = !!spec.loop;
      source.playbackRate.value = spec.loop
        ? spec.rate
        : spec.rate * (0.97 + (this.env.random ?? Math.random)() * 0.06);
      gain.gain.value =
        (spec.gain * spatial.gain) / Math.sqrt(available.length);
      let panner: StereoPannerNode | undefined;
      if (spec.spatial && typeof c.createStereoPanner === "function") {
        panner = c.createStereoPanner();
        panner.pan.value = spatial.pan;
        source.connect(gain).connect(panner).connect(this.buses.get(spec.bus)!);
      } else source.connect(gain).connect(this.buses.get(spec.bus)!);
      const voice: Voice = {
        source,
        gain,
        panner,
        priority: spec.priority,
        owner: cue.owner,
        bus: spec.bus,
        loop: !!spec.loop,
      };
      this.voices.add(voice);
      source.onended = () => {
        this.voices.delete(voice);
        source.disconnect();
        gain.disconnect();
        panner?.disconnect();
      };
      source.start();
      if (spec.loop) source.stop(now + Math.min(20, cue.duration ?? 8));
      count++;
    }
    if (count) {
      this.played.push({
        event,
        time: now,
        families: available.map((x) => x.family),
        owner: cue.owner,
        position: cue.position ? { ...cue.position } : undefined,
        pan: spec.spatial ? spatial.pan : 0,
        gain: spec.gain * spatial.gain,
      });
      this.played = this.played.slice(-120);
      if (spec.priority >= 8) this.duckBackground(0.6);
    }
    return count > 0;
  }
  private duckBackground(amount: number) {
    if (!this.context) return;
    for (const id of ["music", "ambience"] as const) {
      const bus = this.buses.get(id)!;
      const now = this.context.currentTime;
      bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(bus.gain.value, now);
      bus.gain.linearRampToValueAtTime(this.settings[id] * amount, now + 0.03);
      bus.gain.linearRampToValueAtTime(this.settings[id], now + 0.7);
    }
  }
  private stopVoice(v: Voice, immediate = false) {
    if (!this.context) return;
    this.ramp(v.gain.gain, 0, 0.02);
    try {
      v.source.stop(this.context.currentTime + (immediate ? 0 : 0.025));
    } catch {}
    this.voices.delete(v);
  }
  stopPreviews() {
    for (const v of this.voices)
      if (v.owner?.startsWith("preview:")) this.stopVoice(v);
  }
  stopOwner(owner: string) {
    for (const v of this.voices) if (v.owner === owner) this.stopVoice(v);
  }
  stopEffects() {
    if (this.lootTimer) clearTimeout(this.lootTimer);
    this.lootTimer = null;
    this.pendingLoot = null;
    for (const v of [...this.voices]) this.stopVoice(v);
    this.last.clear();
  }
  setPaused(paused: boolean) {
    if (this.paused === paused) return;
    this.paused = paused;
    if (paused)
      for (const v of [...this.voices])
        if (v.bus === "combat") this.stopVoice(v);
    this.applySettings();
  }
  setHidden(hidden: boolean) {
    this.hidden = hidden;
    if (hidden) {
      this.stopEffects();
      void this.context?.suspend().catch((e) => this.error(String(e)));
    } else if (this.context)
      void this.context.resume().catch((e) => this.error(String(e)));
    this.applySettings();
  }
  setListener(point: { x: number; y: number }) {
    this.listener = { ...point };
  }
  sustain(owner: string, cue: AudioCue) {
    if (this.paused) return;
    const voices = [...this.voices].filter((v) => v.loop && v.owner === owner);
    if (!voices.length) {
      this.emit("skill.sustain", {
        ...cue,
        owner,
        duration: cue.duration ?? 8,
      });
      return;
    }
    const mix = spatialMix(cue.position, this.listener);
    for (const v of voices) {
      this.ramp(v.gain.gain, 0.1 * mix.gain, 0.1);
      if (v.panner) this.ramp(v.panner.pan, mix.pan, 0.1);
    }
  }
  scene(region: Soundscape, state: MusicState) {
    const actual =
      this.context && this.context.currentTime < this.cueUntil
        ? this.cueState
        : state;
    if (region === this.region && actual === this.music) return;
    this.region = region;
    this.music = actual;
    this.refreshLoops();
  }
  cue(state: MusicState, duration = 3) {
    if (!this.context) return;
    this.cueState = state;
    this.cueUntil = this.context.currentTime + duration;
    this.music = state;
    this.refreshLoops();
  }
  private refreshLoops() {
    if (!this.context) return;
    const c = this.context;
    const targets: Record<string, number> = {
      wind: this.region === "ruins" ? 0.3 : 0.2,
      water: this.region === "village" ? 0.16 : 0.03,
      insects: this.region === "forest" ? 0.25 : 0.04,
      structure:
        this.region === "ruins" ? 0.14 : this.region === "village" ? 0.11 : 0,
      pad: MUSIC_LEVELS[this.music][0],
      pulse: MUSIC_LEVELS[this.music][1],
      motif: MUSIC_LEVELS[this.music][2],
    };
    for (const [id, level] of Object.entries(targets)) {
      let v = this.loops.get(id);
      if (!v) {
        const buffer = this.buffers.get(AUDIO_FILES[id][0]);
        if (!buffer) continue;
        const source = c.createBufferSource(),
          gain = c.createGain(),
          bus: AudioBus = ["pad", "pulse", "motif"].includes(id)
            ? "music"
            : "ambience";
        source.buffer = buffer;
        source.loop = true;
        gain.gain.value = 0;
        source.connect(gain).connect(this.buses.get(bus)!);
        v = { source, gain, priority: 0, bus, loop: true };
        this.loops.set(id, v);
        source.start(0, (c.currentTime - this.transport) % buffer.duration);
      }
      this.ramp(v.gain.gain, level, 1.2);
    }
  }
  reset() {
    this.stopEffects();
    this.cueUntil = 0;
    this.paused = false;
    this.applySettings();
  }
  dispose() {
    this.stopEffects();
    for (const v of this.loops.values()) {
      try {
        v.source.stop();
      } catch {}
      v.source.disconnect();
      v.gain.disconnect();
    }
    this.loops.clear();
    void this.context?.close();
    this.context = null;
    this.buses.clear();
    this.master?.disconnect();
    this.duck?.disconnect();
    this.master = null;
    this.duck = null;
    this.buffers.clear();
    this.loading = null;
  }
  snapshot() {
    return {
      context: this.context?.state ?? "locked",
      settings: { ...this.settings },
      loaded: this.buffers.size,
      total: Object.values(AUDIO_FILES).flat().length,
      errors: [...this.errors],
      effects: this.voices.size,
      loops: this.loops.size,
      region: this.region,
      music: this.music,
      transport: this.transport,
      paused: this.paused,
      suppressed: this.suppressed,
      played: this.played.slice(-40),
    };
  }
}

// Smooth final safety ceiling, after dynamics; prevents summed transients exceeding full scale.
export function connectLimiter(context: BaseAudioContext, input: AudioNode) {
  const limiter = context.createWaveShaper();
  const curve = new Float32Array(4097);
  for (let i = 0; i < curve.length; i++)
    curve[i] = 0.9 * Math.tanh(1.2 * ((2 * i) / (curve.length - 1) - 1));
  limiter.curve = curve;
  limiter.oversample = "4x";
  // Oversampling filters can overshoot during extreme transients. A final
  // non-oversampled ceiling bounds the actual PCM delivered to the device.
  const ceiling = context.createWaveShaper(),
    bounds = new Float32Array(4097);
  for (let i = 0; i < bounds.length; i++)
    bounds[i] = Math.max(
      -0.88,
      Math.min(0.88, (2 * i) / (bounds.length - 1) - 1),
    );
  ceiling.curve = bounds;
  ceiling.oversample = "none";
  input.connect(limiter).connect(ceiling).connect(context.destination);
  return ceiling;
}
