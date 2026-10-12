import { afterEach, describe, it, expect, vi } from "vitest";
import { AudioEngine } from "../src/audio";
import {
  AUDIO_FILES,
  DEFAULT_AUDIO,
  SKILL_AUDIO,
  readSettings,
  soundSpec,
  spatialMix,
} from "../src/audio-catalog";
import { NODES } from "../src/skills";
import { Combat, type CombatContext } from "../src/combat";
import { createPlayer, createEnemies } from "../src/state";
import { World } from "../src/world";
class Param {
  value = 1;
  cancelScheduledValues() {}
  setValueAtTime(v: number) {
    this.value = v;
  }
  linearRampToValueAtTime(v: number) {
    this.value = v;
  }
}
class Node {
  gain = new Param();
  pan = new Param();
  playbackRate = new Param();
  threshold = new Param();
  knee = new Param();
  ratio = new Param();
  attack = new Param();
  release = new Param();
  buffer: any;
  loop = false;
  onended: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  disconnect = vi.fn();
  connect(n: any) {
    return n;
  }
}
class Context {
  state = "running";
  currentTime = 0;
  destination = new Node();
  sources: Node[] = [];
  createWaveShaper() {
    return new Node();
  }
  createGain() {
    return new Node();
  }
  createStereoPanner() {
    return new Node();
  }
  createDynamicsCompressor() {
    return new Node();
  }
  createBufferSource() {
    const n = new Node();
    this.sources.push(n);
    return n;
  }
  async decodeAudioData() {
    return { duration: 16 };
  }
  async resume() {
    this.state = "running";
  }
  async suspend() {
    this.state = "suspended";
  }
  async close() {
    this.state = "closed";
  }
}
async function engine(fail = false) {
  const ctx = new Context(),
    storage = { getItem: () => null, setItem: vi.fn() } as any;
  const fetch = vi.fn(
    async (url: string) =>
      ({
        ok: !(fail && url.includes("fire-0")),
        status: 404,
        arrayBuffer: async () => new ArrayBuffer(4),
      }) as Response,
  );
  const a = new AudioEngine({
    createContext: () => ctx as any,
    fetch,
    storage,
    random: () => 0.5,
  });
  a.prepare();
  a.unlock();
  await a.ready();
  return { a, ctx, fetch, storage };
}
afterEach(() => vi.useRealTimers());
describe("Áudio central", () => {
  it("troca o tema da capa pela música do jogo e o restaura no menu", async () => {
    const { a } = await engine();
    a.scene("ruins", "menu");
    expect(a.snapshot().loopLevels["title-theme"]).toBeGreaterThan(0);
    expect(a.snapshot().loopLevels.pad).toBe(0);
    a.scene("village", "safe");
    expect(a.snapshot().loopLevels["title-theme"]).toBe(0);
    expect(a.snapshot().loopLevels.pad).toBeGreaterThan(0);
    a.scene("ruins", "menu");
    expect(a.snapshot().loopLevels["title-theme"]).toBeGreaterThan(0);
    a.dispose();
  });
  it("cacheia arquivos reais uma única vez e libera após gesto", async () => {
    const { a, fetch, ctx } = await engine();
    a.prepare();
    a.unlock();
    await a.ready();
    expect(fetch).toHaveBeenCalledTimes(55);
    expect(a.snapshot().loaded).toBe(55);
    expect(ctx.sources).toHaveLength(9);
    a.dispose();
    expect(ctx.state).toBe("closed");
    expect(a.snapshot().loops).toBe(0);
  });
  it("falha parcial não bloqueia outros efeitos", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { a } = await engine(true);
    expect(a.snapshot().loaded).toBe(54);
    expect(a.errors[0]).toContain("fire-0");
    expect(a.emit("ui.open")).toBe(true);
    a.dispose();
    warning.mockRestore();
  });
  it("limita rajadas, permite prioridade e cancela sustentações pelo dono", async () => {
    const { a, ctx } = await engine();
    for (let i = 0; i < 50; i++) {
      ctx.currentTime += 0.01;
      a.emit("step", { owner: String(i), position: { x: 12, y: 12 } });
    }
    expect(a.snapshot().effects).toBe(18);
    expect(a.emit("player.hurt")).toBe(true);
    expect(a.snapshot().effects).toBe(18);
    a.stopEffects();
    a.sustain("zone", { skillId: "arcanista-0-0", position: { x: 12, y: 12 } });
    a.sustain("zone", { skillId: "arcanista-0-0", position: { x: 12, y: 12 } });
    expect(a.snapshot().effects).toBe(1);
    a.stopOwner("zone");
    expect(a.snapshot().effects).toBe(0);
    a.dispose();
  });
  it("suprime duplicatas e combate em menus, mantendo interface e prévia", async () => {
    const { a } = await engine();
    expect(a.emit("impact.hit")).toBe(true);
    expect(a.emit("impact.hit")).toBe(false);
    a.setPaused(true);
    expect(a.snapshot().effects).toBe(0);
    expect(a.emit("attack.swing")).toBe(false);
    expect(a.emit("ui.open")).toBe(true);
    expect(
      a.emit("skill.activate", { preview: true, owner: "preview:x" }),
    ).toBe(true);
    a.stopPreviews();
    expect(a.snapshot().effects).toBe(1);
    a.dispose();
  });
  it("agrupa múltiplos drops pelo mais importante e cancela fila no reinício", async () => {
    vi.useFakeTimers();
    const { a, ctx } = await engine();
    a.emit("loot.coins");
    a.emit("loot.item", { rarity: "Rúnica" });
    a.emit("loot.item", { rarity: "Comum" });
    await vi.advanceTimersByTimeAsync(80);
    expect(a.played.filter((p) => p.event.startsWith("loot."))).toHaveLength(1);
    expect(a.played.at(-1)?.families).toContain("rune");
    ctx.currentTime = 1;
    a.emit("loot.coins");
    a.reset();
    await vi.advanceTimersByTimeAsync(80);
    expect(a.played.filter((p) => p.event.startsWith("loot."))).toHaveLength(1);
    a.dispose();
  });
  it("mantém o transporte de música em transições e encerra cenas", async () => {
    const { a, ctx } = await engine();
    const transport = a.snapshot().transport;
    ctx.currentTime = 4;
    a.scene("forest", "combat");
    a.scene("industrial", "combat");
    expect(a.snapshot().region).toBe("industrial");
    a.scene("ruins", "boss");
    expect(ctx.sources).toHaveLength(9);
    expect(a.snapshot().transport).toBe(transport);
    expect(a.snapshot().music).toBe("boss");
    a.emit("attack.swing");
    a.setHidden(true);
    expect(a.snapshot().effects).toBe(0);
    expect(ctx.state).toBe("suspended");
    a.setHidden(false);
    expect(ctx.state).toBe("running");
    a.dispose();
    a.unlock();
    await a.ready();
    expect(a.snapshot().loaded).toBe(55);
    a.dispose();
  });
  it("persiste volumes, mute e rejeita configuração inválida", async () => {
    const { a, storage } = await engine();
    a.setVolume("music", 0.23);
    a.toggle();
    const saved = JSON.parse(storage.setItem.mock.calls.at(-1)[1]);
    expect(saved.music).toBe(0.23);
    expect(saved.muted).toBe(true);
    expect(a.emit("ui.open")).toBe(false);
    expect(readSettings({ getItem: () => JSON.stringify(saved) })).toEqual(
      saved,
    );
    expect(readSettings({ getItem: () => "{broken" })).toEqual(DEFAULT_AUDIO);
    expect(
      readSettings({ getItem: () => JSON.stringify({ ...saved, master: 2 }) }),
    ).toEqual(DEFAULT_AUDIO);
    a.dispose();
  });
  it("espacializa mundo, mantém UI central e cobre cada habilidade", () => {
    expect(spatialMix({ x: 30, y: 30 }, { x: 0, y: 0 }).gain).toBe(0);
    expect(spatialMix({ x: 3, y: 0 }, { x: 0, y: 0 }).pan).toBeGreaterThan(0);
    expect(spatialMix({ x: 0, y: 3 }, { x: 0, y: 0 }).pan).toBeLessThan(0);
    expect(soundSpec("ui.open", { position: { x: 20, y: 20 } }).spatial).toBe(
      false,
    );
    for (const n of NODES) {
      expect(SKILL_AUDIO[n.id]).toBeDefined();
      for (const event of [
        "attack.prepare",
        "skill.activate",
        "skill.sustain",
        "skill.end",
      ] as const)
        for (const f of soundSpec(event, { skillId: n.id }).families)
          expect(AUDIO_FILES[f]?.length).toBeGreaterThan(0);
    }
    expect(
      soundSpec("attack.swing", { classId: "arcanista" }).families,
    ).not.toEqual(soundSpec("impact.hit", { classId: "arcanista" }).families);
  });
});
describe("Sincronização com combate real", () => {
  function combat() {
    const events: string[] = [];
    const c: CombatContext = {
      player: createPlayer(),
      enemies: createEnemies().slice(0, 1),
      world: new World(),
      projectiles: [],
      texts: [],
      effects: [],
      quest: { stage: 0, kills: 0, rewardClaimed: false },
      sound: () => {},
      notify: () => {},
      audioEvent: (event) => {
        events.push(event);
        return true;
      },
    };
    const b = new Combat(c);
    return { b, c, events };
  }
  it("prepara antes do contato, golpe e impacto só no quadro de resolução", () => {
    const { b, c, events } = combat();
    c.enemies[0].x = c.player.x + 0.8;
    c.enemies[0].y = c.player.y;
    expect(b.attack(c.enemies[0])).toBe(true);
    expect(events).toEqual(["attack.prepare"]);
    b.update(0.1);
    expect(events).toEqual(["attack.prepare"]);
    b.update(0.07);
    expect(events).toContain("attack.swing");
    expect(events).toContain("impact.hit");
    expect(events.indexOf("attack.swing")).toBeLessThan(
      events.indexOf("impact.hit"),
    );
  });
  it("erro não emite impacto, morte dá recompensa uma vez", () => {
    const { b, c, events } = combat();
    c.enemies[0].x = 25;
    c.enemies[0].y = 25;
    b.attack({ x: 10, y: 10 });
    b.update(0.17);
    expect(events).toContain("attack.miss");
    expect(events).not.toContain("impact.hit");
    b.hit(c.enemies[0], 9999, "#fff");
    b.hit(c.enemies[0], 9999, "#fff");
    expect(events.filter((x) => x === "enemy.death")).toHaveLength(1);
    expect(c.quest.kills).toBe(1);
  });
});
