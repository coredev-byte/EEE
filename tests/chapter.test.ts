import { describe, it, expect, vi } from "vitest";
import { Game } from "../src/game";
import { freshExploration, PASSAGES, passageOpen } from "../src/regions";
import {
  freshChapter,
  ruinEnemies,
  CHAPTER_ID,
  KHARN_ID,
  chapterScene,
} from "../src/chapter-data";
import { World, distance } from "../src/world";
import { findPath } from "../src/navigation";
import { stats, createPlayer } from "../src/state";
import { serialize, deserialize } from "../src/save";
import { missionViews, selectedMission } from "../src/missions";
import {
  updateChapterBoss,
  patternHits,
  type BossAttack,
} from "../src/chapter-boss";
const early = [
  "talk:lenir",
  "ash-record",
  "talk:witness",
  "defeat:300",
  "bizel-record",
  "report:lenir",
  "enter:ruins",
];
const prepared = [
  ...early,
  "ruins-record",
  "defeat:301",
  "prism-blue",
  "oath",
  "defeat:302",
  "prism-violet",
  "core-record",
];
function game(legacy = false) {
  const g = new Game();
  g.input = { keys: new Set(), movement: () => ({ x: 0, y: 0 }) } as any;
  g.renderer = { makeFloor: vi.fn(), snap: vi.fn() } as any;
  g.save = vi.fn(() => true);
  g.audioEvent = () => true;
  g.quest = { stage: 2, kills: 3, rewardClaimed: true };
  g.exploration = freshExploration();
  g.exploration.chapter = freshChapter(legacy);
  g.exploration.campaign = {
    entered: true,
    accepted: true,
    attuned: ["vigia", "canal", "memoria"],
    rewardClaimed: true,
  };
  g.player.level = 5;
  g.player.hp = stats(g.player).maxHp;
  g.player.mp = stats(g.player).maxMp;
  g.syncMissions();
  return g;
}
function ruins() {
  const g = game();
  g.exploration.journal.events = [...prepared];
  g.exploration.changes = ["prism-blue", "prism-violet"];
  g.exploration.visited.push("kharn", "ruins");
  g.mountRegion("ruins");
  Object.assign(g.player, { x: 14, y: 12 });
  return g;
}
function use(g: Game, id: string) {
  const prop = g.world.props.find((o) => o.interaction === id)!;
  expect(prop).toBeTruthy();
  Object.assign(g.player, g.world.nearestFree(prop));
  return g.interact();
}
describe("Continuidade e Ruínas Esquecidas", () => {
  it("reposiciona um save da planta antiga em chão seguro sem reiniciar o capítulo", () => {
    const g=ruins();
    Object.assign(g.player,{x:18.4,y:20.4,coins:317});
    const events=[...g.exploration.journal.events], inventory=[...g.player.inventory];
    expect(g.world.blocked(g.player)).toBe(true);
    g.mountRegion("ruins");
    expect(g.world.blocked(g.player)).toBe(false);
    expect(g.player.coins).toBe(317);
    expect(g.player.inventory).toEqual(inventory);
    expect(g.exploration.journal.events).toEqual(events);
    expect(g.exploration.changes).toEqual(["prism-blue","prism-violet"]);
  });

  it("nova campanha encaminha ao capítulo; legado mantém a estrada e rastreamento industrial", () => {
    const g = game(),
      old = game(true);
    expect(selectedMission(g.exploration, g.quest)?.definition.id).toBe(
      CHAPTER_ID,
    );
    expect(selectedMission(old.exploration, old.quest)?.definition.id).toBe(
      "machines",
    );
    const p = PASSAGES.find((p) => p.destination === "ferrugem")!;
    expect(passageOpen(p, g.exploration, true)).toBe(false);
    expect(passageOpen(p, old.exploration, true)).toBe(true);
  });
  it("migra save v4 antigo sem apagar Ferrugem, moedas, build nem memórias", () => {
    const g = game(true);
    g.changeRegion("kharn");
    g.changeRegion("ferrugem");
    g.captureRegion();
    const raw = JSON.parse(serialize(g.player, g.quest, [], [], g.exploration));
    delete raw.exploration.chapter;
    delete raw.exploration.regions.ruins;
    const s = deserialize(JSON.stringify(raw))!;
    expect(s.exploration.region).toBe("ferrugem");
    expect(s.exploration.chapter?.legacyRoad).toBe(true);
    expect(s.player.coins).toBe(g.player.coins);
    expect(s.player.trees).toEqual(g.player.trees);
  });
  it("investigação tem pré-requisitos reais e Bizel só aparece após a testemunha", () => {
    const g = game();
    expect(use(g, "ash-record")).toBe(false);
    expect(use(g, "lenir")).toBe(true);
    expect(use(g, "ash-record")).toBe(true);
    Object.assign(g.player, { x: 10, y: 14 });
    g.interact();
    expect(g.chapter.known("talk:witness")).toBe(true);
    g.chapter.update(0.01);
    const boss = g.enemies.find((e) => e.id === 300)!;
    expect(boss).toBeTruthy();
    expect(boss.dormant).toBe(true);
    Object.assign(g.player, g.world.nearestFree({ x: 23, y: 20 }));
    g.chapter.update(0.01);
    expect(g.chapter.cinematic.id).toBe("bizel-intro");
    g.chapter.finishScene();
    expect(boss.dormant).toBe(false);
  });
  it("Bizel deixa consequência e registro antes da passagem, sem repetir a missão inicial", () => {
    const g = game();
    g.exploration.journal.events = [...early.slice(0, 3)];
    g.chapter.mount();
    const boss = g.enemies.find((e) => e.id === 300)!;
    boss.dormant = false;
    g.combat.hit(boss, 999, "#fff");
    expect(g.chapter.known("defeat:300")).toBe(true);
    expect(g.quest.rewardClaimed).toBe(true);
    expect(use(g, "bizel-record")).toBe(true);
    expect(use(g, "lenir")).toBe(true);
    expect(g.chapter.known("report:lenir")).toBe(true);
    expect(
      passageOpen(
        PASSAGES.find((p) => p.destination === "ruins")!,
        g.exploration,
        true,
      ),
    ).toBe(true);
  });
  it("composição própria contém chão e abismos reais, não a Margem renomeada", () => {
    const w = new World("ruins"),
      old = new World("kharn");
    expect(w.props).not.toEqual(old.props);
    expect(w.blocked({ x: 4, y: 10 })).toBe(true);
    expect(w.blocked({ x: 14, y: 24 })).toBe(false);
    expect(
      findPath(w, { x: 14, y: 24 }, { x: 5, y: 20 }, 0.3).length,
    ).toBeGreaterThan(0);
    expect(findPath(w, { x: 14, y: 24 }, { x: 14, y: 12 }, 0.3)).toEqual([]);
  });
  it("prismas abrem colisões, permitem caminhos e persistem com investigações", () => {
    const g = game();
    g.exploration.journal.events = [...early, "ruins-record"];
    g.exploration.visited.push("kharn", "ruins");
    g.mountRegion("ruins");
    expect(use(g, "prism-blue")).toBe(false);
    const guardian = g.enemies.find((e) => e.id === 301)!;
    g.combat.hit(guardian, 999, "#fff");
    expect(use(g, "prism-blue")).toBe(true);
    expect(
      g.world.props
        .filter((p) => p.lock === "prism-blue")
        .every((p) => !p.solid),
    ).toBe(true);
    expect(
      findPath(g.world, { x: 14, y: 24 }, { x: 14, y: 12 }, 0.3).length,
    ).toBeGreaterThan(0);
    g.captureRegion();
    const s = deserialize(serialize(g.player, g.quest, [], [], g.exploration))!;
    expect(s.exploration.changes).toContain("prism-blue");
  });
  it("atalho lateral só muda a passagem ao ser acionado", () => {
    const g = ruins(),
      walls = g.world.props.filter((p) => p.lock === "ruins-shortcut");
    expect(walls.every((p) => p.solid)).toBe(true);
    use(g, "ruins-shortcut");
    expect(walls.every((p) => !p.solid)).toBe(true);
    expect(g.exploration.changes).toContain("ruins-shortcut");
  });
  it("fonte restaura recursos e grava checkpoint sem conceder poções ou pontos", () => {
    const g = ruins();
    g.player.hp = 1;
    g.player.mp = 0;
    const potions = [...g.player.potions],
      points = g.player.skillPoints;
    use(g, "rest");
    expect(g.player.hp).toBe(stats(g.player).maxHp);
    expect(g.player.mp).toBe(stats(g.player).maxMp);
    expect(g.player.potions).toEqual(potions);
    expect(g.player.skillPoints).toBe(points);
    expect(g.chapter.state.checkpoint).toBe(true);
  });
  it("apresentação usa sequenciador compartilhado, fecha arena e skip inicia combate", () => {
    const g = ruins();
    use(g, "arena");
    expect(g.controlsLocked).toBe(true);
    expect(g.chapter.cinematic.id).toBe("kharn-intro");
    expect(g.enemies.find((e) => e.id === 310)?.dormant).toBe(false);
    expect(
      g.world.props
        .filter((p) => p.lock === "prism-violet")
        .every((p) => p.solid),
    ).toBe(true);
    g.skipCinematic();
    expect(g.chapter.fighting).toBe(true);
    expect(g.controlsLocked).toBe(false);
    expect(g.chapter.state.scenes).toContain("kharn-intro");
  });
  it("fechar durante apresentação recupera a mesma arena e chefe único", () => {
    const g = ruins();
    use(g, "arena");
    g.captureRegion();
    const s = deserialize(serialize(g.player, g.quest, [], [], g.exploration))!;
    expect(s.exploration.chapter?.arena).toBe("intro");
    const h = game();
    h.exploration = s.exploration;
    h.player = s.player;
    h.mountRegion("ruins");
    h.chapter.resume();
    expect(h.chapter.cinematic.id).toBe("kharn-intro");
    expect(h.enemies.filter((e) => e.id === KHARN_ID)).toHaveLength(1);
  });
  it("retomada de combate começa em ponto seguro, conserva mecanismos e restaura chefe", () => {
    const g = ruins();
    use(g, "arena");
    g.skipCinematic();
    g.chapter.state.checkpoint = true;
    g.enemies.find((e) => e.id === 310)!.hp = 345;
    g.captureRegion();
    const s = deserialize(serialize(g.player, g.quest, [], [], g.exploration))!;
    const h = game();
    h.exploration = s.exploration;
    h.player = s.player;
    h.mountRegion("ruins");
    expect(h.chapter.state.arena).toBe("ready");
    expect(h.player).toMatchObject({ x: 14, y: 12 });
    expect(h.enemies.find((e) => e.id === 310)?.hp).toBe(720);
    expect(h.exploration.changes).toContain("prism-violet");
  });
  it("morte retorna à fonte, preserva salas e permite segunda apresentação pulável", () => {
    const g = ruins();
    use(g, "arena");
    g.skipCinematic();
    g.player.hp = 0;
    g.paused = true;
    const coins = g.player.coins;
    g.respawn();
    expect(g.world.region).toBe("ruins");
    expect(g.player.hp).toBe(stats(g.player).maxHp);
    expect(g.player.coins).toBe(coins - 25);
    expect(g.chapter.state.arena).toBe("ready");
    expect(g.exploration.changes).toContain("prism-blue");
    expect(use(g, "arena")).toBe(true);
    g.skipCinematic();
    expect(g.chapter.fighting).toBe(true);
  });
  it("cada limiar preserva três fases até em ataques muito fortes", () => {
    const g = ruins();
    use(g, "arena");
    g.skipCinematic();
    const e = g.enemies.find((e) => e.id === 310)!;
    g.combat.hit(e, 9999, "#fff");
    expect(e.hp).toBe(468);
    updateChapterBoss(e, g.player, g.world, g.combat, 0.04, (e) =>
      g.chapter.phase(e),
    );
    expect(e.phase).toBe(2);
    expect(g.chapter.cinematic.id).toBe("kharn-phase-2");
    g.skipCinematic();
    g.combat.hit(e, 9999, "#fff");
    expect(e.hp).toBe(216);
    updateChapterBoss(e, g.player, g.world, g.combat, 0.04, (e) =>
      g.chapter.phase(e),
    );
    expect(e.phase).toBe(3);
  });
  it("desfecho próprio mantém Kharn no salão, concede recompensa única e abre estrada", () => {
    const g = ruins();
    use(g, "arena");
    g.skipCinematic();
    const e = g.enemies.find((e) => e.id === 310)!;
    e.phase = 3;
    g.combat.hit(e, 9999, "#fff");
    expect(g.chapter.state.arena).toBe("ending");
    expect(g.effects.some((e) => e.kind === "death")).toBe(false);
    expect(g.chapter.cinematic.id).toBe("kharn-outro");
    const coins = g.player.coins;
    g.skipCinematic();
    expect(g.chapter.state.arena).toBe("cleared");
    expect(g.player.coins).toBe(coins + 220);
    expect(g.player.inventory).toContain("selo-vigia");
    expect(g.exploration.journal.completed).toContain(CHAPTER_ID);
    g.chapter.finishScene();
    g.syncMissions();
    expect(g.player.coins).toBe(coins + 220);
    g.captureRegion();
    expect(
      deserialize(serialize(g.player, g.quest, [], [], g.exploration))!
        .exploration.chapter?.arena,
    ).toBe("cleared");
  });
  it("desfecho interrompido mantém derrota e não entrega recompensa antes da cena", () => {
    const g = ruins();
    use(g, "arena");
    g.skipCinematic();
    const e = g.enemies.find((e) => e.id === 310)!;
    e.phase = 3;
    g.combat.hit(e, 9999, "#fff");
    g.captureRegion();
    const s = deserialize(serialize(g.player, g.quest, [], [], g.exploration))!;
    expect(s.exploration.chapter?.arena).toBe("ending");
    expect(s.exploration.journal.completed).not.toContain(CHAPTER_ID);
    expect(s.exploration.journal.events).toContain("defeat:310");
  });
  it("recusa capítulo inventado, cena inválida e recompensa sem revelação", () => {
    const g = ruins();
    for (const mutate of [
      (s: any) => (s.exploration.chapter.arena = "fake"),
      (s: any) => (s.exploration.chapter.scenes = ["fake"]),
      (s: any) => s.exploration.journal.completed.push(CHAPTER_ID),
    ]) {
      const raw = JSON.parse(
        serialize(g.player, g.quest, [], [], g.exploration),
      );
      mutate(raw);
      expect(deserialize(JSON.stringify(raw))).toBe(null);
    }
  });
});
describe("Padrões justos de Kharn", () => {
  const attack = (kind: BossAttack["kind"]): BossAttack => ({
    kind,
    origin: { x: 14, y: 5 },
    target: { x: 14, y: 7 },
    areas: [{ x: 14, y: 7 }],
    angle: Math.PI / 2,
    remaining: 1,
    duration: 1,
    resolved: false,
    travel: 0,
  });
  it("cone, cruz, anel e cristais possuem zonas seguras verificáveis", () => {
    expect(patternHits(attack("cleave"), { x: 14, y: 6 })).toBe(true);
    expect(patternHits(attack("cleave"), { x: 14, y: 4 })).toBe(false);
    expect(patternHits(attack("cross"), { x: 16, y: 7 })).toBe(false);
    expect(patternHits(attack("oath"), { x: 14, y: 5 })).toBe(false);
    expect(patternHits(attack("oath"), { x: 16, y: 5 })).toBe(true);
    expect(patternHits(attack("shards"), { x: 11, y: 7 })).toBe(false);
  });
  it("dano só acontece após indicação, seguido de recuperação real", () => {
    const g = ruins(),
      e = g.enemies.find((e) => e.id === 310)!;
    e.dormant = false;
    e.phase = 1;
    e.bossCycle = 1;
    e.timer = 3;
    Object.assign(g.player, { x: 14, y: 7 });
    updateChapterBoss(e, g.player, g.world, g.combat, 0.04, () => {});
    const hp = g.player.hp;
    expect(e.bossAttack?.kind).toBe("slam");
    updateChapterBoss(e, g.player, g.world, g.combat, 0.5, () => {});
    expect(g.player.hp).toBe(hp);
    updateChapterBoss(e, g.player, g.world, g.combat, 0.6, () => {});
    expect(g.player.hp).toBeLessThan(hp);
    expect(e.state).toBe("recover");
  });
  it("golpes recebidos não reiniciam preparação ou recuperação, evitando stun lock trivial", () => {
    const g = ruins(),
      e = g.enemies.find((e) => e.id === 310)!;
    e.dormant = false;
    e.phase = 1;
    e.state = "recover";
    e.timer = 0.8;
    g.combat.hit(e, 5, "#fff");
    expect(e.timer).toBe(0.8);
    expect(e.state).toBe("recover");
  });
  it.each(["guerreiro", "arcanista", "assassino", "atirador"] as const)(
    "IA pressiona pontos distantes da arena sem atravessar paredes para %s",
    (id) => {
      const g = ruins();
      g.player = createPlayer(id);
      Object.assign(g.player, { x: 18, y: 8 });
      const e = g.enemies.find((e) => e.id === 310)!;
      e.dormant = false;
      e.phase = 3;
      let patterns = new Set<string>();
      for (let i = 0; i < 300; i++) {
        updateChapterBoss(e, g.player, g.world, g.combat, 0.04, () => {});
        if (e.bossAttack) patterns.add(e.bossAttack.kind);
        expect(g.world.blocked(e, 0.23)).toBe(false);
        if (g.player.hp === 0) {
          g.player.hp = stats(g.player).maxHp;
        }
      }
      expect(patterns.size).toBeGreaterThan(1);
      expect(distance(e, e.home)).toBeLessThan(6);
    },
  );
});

describe("Entrada e contratos de arte", () => {
  it("entrada nova não fica dentro de uma árvore ou outro collider da Margem", () => {
    const w = new World("kharn"),
      p = w.props.find((p) => p.id === "portal-25-6")!;
    expect(w.blocked(p)).toBe(false);
    expect(w.canInteract({ x: 24.5, y: 6 }, p)).toBe(true);
  });
  it("todos os objetos da masmorra são alcançáveis e interativos após os mecanismos", () => {
    const w = new World("ruins");
    w.applyChanges(["prism-blue", "prism-violet", "ruins-shortcut"]);
    for (const p of w.props.filter(
      (p) =>
        !p.solid && (p.interaction || ["portal", "chest"].includes(p.kind)),
    )) {
      const at = w.nearestFree(p);
      expect(
        findPath(w, { x: 14, y: 24 }, at, 0.3).length,
        p.id,
      ).toBeGreaterThan(0);
      expect(w.canInteract(at, p), p.id).toBe(true);
    }
  });
});

describe("Consequências e posicionamento", () => {
  it("Bizel não participa do respawn dos bandidos comuns", () => {
    const g = game();
    g.exploration.journal.events = [...early.slice(0, 5)];
    g.chapter.state.scenes = ["bizel-intro"];
    g.chapter.mount();
    const e = g.enemies.find((e) => e.id === 300)!;
    e.timer = 120;
    Object.assign(g.player, { x: 12, y: 12 });
    g.update(0.04);
    expect(e.hp).toBe(0);
    expect(e.rewarded).toBe(true);
  });
  it("pular ou assistir à apresentação aplica a mesma posição de controle", () => {
    const a = ruins(),
      b = ruins();
    use(a, "arena");
    use(b, "arena");
    a.skipCinematic();
    b.chapter.cinematic.update(30);
    b.chapter.update(0.04);
    expect(a.player).toMatchObject({
      x: b.player.x,
      y: b.player.y,
      action: "idle",
    });
    expect(a.player).toMatchObject({ x: 14, y: 7 });
  });
  it("Bizel procura caminho ao redor de um obstáculo em vez de atirar para uma parede", () => {
    const g = game();
    g.exploration.journal.events = [...early.slice(0, 3)];
    g.chapter.state.scenes = ["bizel-intro"];
    g.chapter.mount();
    const e = g.enemies.find((e) => e.id === 300)!;
    e.dormant = false;
    Object.assign(g.player, { x: 20, y: 19 });
    g.world.props.push({
      id: "barrier",
      kind: "wall",
      x: 22.1,
      y: 18.5,
      solid: true,
      radius: 0.6,
      scale: 1,
    });
    g.world.props = [...g.world.props];
    let clear = false;
    for (let i = 0; i < 300; i++) {
      updateChapterBoss(e, g.player, g.world, g.combat, 0.04, () => {});
      expect(g.world.blocked(e, 0.23)).toBe(false);
      if (g.world.segmentClear(e, g.player, 0.04, false)) {
        clear = true;
        break;
      }
    }
    expect(clear).toBe(true);
  });
});

describe("Migração e estados impossíveis", () => {
  it("guarda cópia exata do v4 antigo antes de adicionar o capítulo", () => {
    const g = game(true),
      raw = JSON.parse(serialize(g.player, g.quest, [], [], g.exploration));
    delete raw.exploration.chapter;
    delete raw.exploration.regions.ruins;
    const original = JSON.stringify(raw),
      values = new Map<string, string>([["distrito-zero:v1", original]]);
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
    g.save = Game.prototype.save.bind(g);
    expect(g.save()).toBe(true);
    expect(values.get("distrito-zero:v1:backup:chapter-I")).toBe(original);
    g.save();
    expect(values.get("distrito-zero:v1:backup:chapter-I")).toBe(original);
    vi.unstubAllGlobals();
  });
  it("máquinas ficam bloqueadas somente para a jornada nova, até a revelação", () => {
    const fresh = game(),
      legacy = game(true);
    expect(
      missionViews(fresh.exploration, fresh.quest).find(
        (v) => v.definition.id === "machines",
      )?.status,
    ).toBe("bloqueada");
    expect(
      missionViews(legacy.exploration, legacy.quest).find(
        (v) => v.definition.id === "machines",
      )?.status,
    ).toBe("ativa");
  });
  it("recusa mecanismo sem evento e arena iniciada sem as evidências", () => {
    const g = ruins();
    for (const corrupt of [
      (s: any) =>
        s.exploration.journal.events.splice(
          s.exploration.journal.events.indexOf("prism-blue"),
          1,
        ),
      (s: any) => (s.exploration.chapter.arena = "intro"),
    ]) {
      const raw = JSON.parse(
        serialize(g.player, g.quest, [], [], g.exploration),
      );
      corrupt(raw);
      expect(deserialize(JSON.stringify(raw))).toBe(null);
    }
  });
});

describe("Derrota por dano contínuo", () => {
  it("conta Kharn uma vez nos desafios e preserva o desfecho próprio", () => {
    const g = ruins();
    use(g, "arena");
    g.skipCinematic();
    const boss = g.enemies.find((e) => e.id === 310)!;
    boss.phase = 3;
    boss.hp = 1;
    const kills = g.player.challenges.kills;
    g.combat.hit(boss, 2, "#abc", undefined, true);
    expect(g.player.challenges.kills).toBe(kills + 1);
    expect(g.chapter.cinematic.id).toBe("kharn-outro");
    g.combat.hit(boss, 2, "#abc", undefined, true);
    expect(g.player.challenges.kills).toBe(kills + 1);
  });
});

describe("Interrupções de cena e câmera", () => {
  function ticks(g: Game) {
    g.renderer.draw = vi.fn();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal("requestAnimationFrame", vi.fn());
  }
  it("morte simultânea ao desfecho abre derrota, conserva Kharn derrotado e permite retomar", () => {
    const g = ruins();
    use(g, "arena");
    g.skipCinematic();
    const boss = g.enemies.find((e) => e.id === 310)!;
    boss.phase = 3;
    g.combat.hit(boss, 9999, "#fff");
    g.player.hp = 0;
    g.player.animTime = 0;
    g.started = true;
    g.paused = false;
    g.onDeath = vi.fn();
    ticks(g);
    for (let i = 0; i < 25; i++) g.tick(1000 + i * 40);
    expect(g.onDeath).toHaveBeenCalledOnce();
    expect(g.paused).toBe(true);
    expect(g.audio.snapshot().music).toBe("defeat");
    g.respawn();
    expect(g.player.hp).toBeGreaterThan(0);
    expect(g.chapter.cinematic.id).toBe("kharn-outro");
    expect(boss.dormant).toBe(false);
    g.skipCinematic();
    expect(g.exploration.journal.completed).toContain(CHAPTER_ID);
    vi.unstubAllGlobals();
  });
  it("menu tem prioridade musical sobre uma cena interrompida", () => {
    const g = ruins();
    use(g, "arena");
    g.started = false;
    g.paused = true;
    ticks(g);
    g.tick(1000);
    expect(g.audio.snapshot().music).toBe("menu");
    expect(g.renderer.cinematic).toBe(null);
    expect(g.chapter.cinematic.id).toBe("kharn-intro");
    vi.unstubAllGlobals();
  });
  it("câmera e partículas de transição usam a posição real do chefe", () => {
    const scene = chapterScene(
      "kharn-phase-2",
      { x: 14, y: 7 },
      { x: 18, y: 8 },
    );
    const g = ruins();
    g.chapter.cinematic.start(scene);
    const frame = g.chapter.cinematic.frame()!;
    expect(frame.camera).toEqual({ x: 18, y: 8 });
    expect(frame.pulseAt).toEqual({ x: 18, y: 8 });
  });
});
