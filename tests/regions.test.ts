import { describe, it, expect, vi, afterEach } from "vitest";
import { World, distance } from "../src/world";
import {
  REGIONS,
  ANCHORS,
  freshExploration,
  kharnEnemies,
  ferrugemEnemies,
} from "../src/regions";
import { findPath, followRoute } from "../src/navigation";
import { createPlayer, createEnemies } from "../src/state";
import { serialize, deserialize } from "../src/save";
import { Game } from "../src/game";
import { updateEnemies } from "../src/enemies";
import { Combat, type CombatContext } from "../src/combat";
const complete = { stage: 2 as const, kills: 4, rewardClaimed: true };
afterEach(() => vi.unstubAllGlobals());
describe("Regiões e migração", () => {
  it("Ferrugem possui rotas reais para recursos, NPCs e arena após refrigeração", () => {
    const w = new World("ferrugem");
    expect(w.segmentClear({ x: 21, y: 11 }, { x: 21, y: 9 })).toBe(false);
    expect(findPath(w, REGIONS.ferrugem.arrival, { x: 21, y: 7 })).toEqual([]);
    w.applyChanges(["pump", "bridge"]);
    expect(w.segmentClear({ x: 21, y: 11 }, { x: 21, y: 9 })).toBe(true);
    for (const p of [
      ...w.props.filter(
        (p) => p.interaction || ["chest", "portal"].includes(p.kind),
      ),
      ...ferrugemEnemies(),
    ]) {
      expect(w.blocked(p, 0.23), p.id.toString()).toBe(false);
      expect(
        findPath(w, REGIONS.ferrugem.arrival, p).length,
        p.id.toString(),
      ).toBeGreaterThan(0);
    }
  });
  it("migra v3 intacto, acrescenta Ferrugem e preserva memórias e encontros", () => {
    const e = freshExploration();
    e.region = "kharn";
    e.campaign = {
      accepted: true,
      entered: true,
      attuned: ["vigia", "canal", "memoria"],
      rewardClaimed: true,
    };
    e.regions.kharn.killed = [100, 102, 104];
    const raw = JSON.parse(serialize(createPlayer(), complete, [], [], e));
    raw.version = 3;
    delete raw.exploration.regions.ferrugem;
    for (const key of [
      "visited",
      "knownPassages",
      "unlocked",
      "bosses",
      "changes",
      "journal",
    ])
      delete raw.exploration[key];
    const saved = deserialize(JSON.stringify(raw))!;
    expect(saved.version).toBe(4);
    expect(saved.exploration.campaign).toEqual(e.campaign);
    expect(saved.exploration.regions.kharn.killed).toEqual([100, 102, 104]);
    expect(saved.exploration.regions.ferrugem.opened).toEqual([]);
    expect(saved.exploration.visited).toEqual(["pedralta", "kharn"]);
  });
  it("as passagens, personagens, baús, marcos e encontros são alcançáveis nas duas regiões", () => {
    for (const id of ["pedralta", "kharn"] as const) {
      const w = new World(id);
      for (const p of [
        ...w.props.filter((p) =>
          ["npc", "portal", "chest", "statue"].includes(p.kind),
        ),
        ...(id === "kharn" ? kharnEnemies() : createEnemies()),
      ]) {
        const target = w.nearestFree(p, 0.23);
        const path = findPath(w, REGIONS[id].arrival, target);
        expect(path.length, `${id}:${p.x},${p.y}`).toBeGreaterThan(0);
        let from = REGIONS[id].arrival as { x: number; y: number };
        for (const next of path) {
          expect(w.segmentClear(from, next, 0.23)).toBe(true);
          from = next;
        }
      }
    }
  });
  it("footprints e água respeitam movimento, navegação e colisão de projéteis", () => {
    const w = new World("kharn");
    for (let y = 1; y < 27; y++)
      for (let x = 1; x < 27; x++)
        if (w.tile(x, y) === 7) {
          expect(x).toBe(14);
          expect(w.blocked({ x, y })).toBe(true);
        }

    expect(w.blocked({ x: 9.33, y: 23.33 })).toBe(true);
    expect(w.projectileBlocked({ x: 9.21, y: 23.21 })).toBe(true);
    expect(w.blocked({ x: 14, y: 23 })).toBe(true);
    expect(w.blocked({ x: 14, y: 15 })).toBe(false);
    expect(w.projectileBlocked({ x: 14, y: 23 })).toBe(false);
    const p = { x: 13, y: 23 };
    w.move(p, { x: 2, y: 0 });
    expect(p.x).toBeLessThan(13.3);
  });
  it("migra v2 com selo concluído sem perder inventário, equipamentos, build, mortes e baús", () => {
    const p = createPlayer("arcanista");
    p.x = 22;
    p.y = 8;
    p.inventory.push("runa");
    p.equipment.weapon = "runa";
    const raw = JSON.parse(serialize(p, complete, ["chest-8-16"], [0, 2]));
    raw.version = 2;
    delete raw.exploration;
    const s = deserialize(JSON.stringify(raw))!;
    expect(s.version).toBe(4);
    expect(s.player.inventory).toEqual(p.inventory);
    expect(s.player.equipment).toEqual(p.equipment);
    expect(s.player.trees).toEqual(p.trees);
    expect(s.quest).toEqual(complete);
    expect(s.exploration.region).toBe("pedralta");
    expect(s.exploration.regions.pedralta.killed).toEqual([0, 2]);
    expect(s.exploration.regions.pedralta.opened).toEqual(["chest-8-16"]);
    expect(s.exploration.campaign.rewardClaimed).toBe(false);
  });
  it("persiste regiões independentes, descoberta e encontro parcialmente ferido", () => {
    const e = freshExploration();
    e.region = "kharn";
    e.campaign.entered = true;
    e.campaign.accepted = true;
    e.campaign.attuned = ["vigia"];
    e.regions.pedralta.opened = ["chest-8-16"];
    e.regions.kharn.opened = ["chest-9-14"];
    e.regions.kharn.discovered = ["5:22"];
    e.regions.kharn.encounters = [
      { id: 102, x: 18, y: 13, hp: 33, maxHp: 160, rewarded: false },
    ];
    const p = createPlayer();
    p.x = 5;
    p.y = 22;
    const s = deserialize(serialize(p, complete, [], [], e))!;
    expect(s.exploration.regions.kharn.encounters[0].hp).toBe(33);
    expect(s.exploration.regions.pedralta.opened).toEqual(["chest-8-16"]);
    expect(s.exploration.campaign.attuned).toEqual(["vigia"]);
    expect(s.exploration.regions.kharn.discovered).toContain("5:22");
  });
  it("recusa região bloqueada, marcos inventados, repetidos, recompensa incompleta e HP inválido", () => {
    for (const alter of [
      (e: any) => (e.region = "other"),
      (e: any) => (e.campaign.attuned = ["unknown"]),
      (e: any) => (e.campaign.attuned = ["vigia", "vigia"]),
      (e: any) => (e.campaign.rewardClaimed = true),
      (e: any) =>
        (e.regions.kharn.encounters = [
          { id: 100, x: 5, y: 22, hp: 1000, maxHp: 100, rewarded: false },
        ]),
    ]) {
      const e = freshExploration();
      alter(e);
      expect(
        deserialize(serialize(createPlayer(), complete, [], [], e)),
      ).toBeNull();
    }
    const e = freshExploration();
    e.region = "kharn";
    expect(
      deserialize(
        serialize(
          createPlayer(),
          { stage: 0, kills: 0, rewardClaimed: false },
          [],
          [],
          e,
        ),
      ),
    ).toBeNull();
  });
  it("recupera uma posição dentro de obstáculo sem apagar progresso", () => {
    const p = createPlayer();
    p.x = 5;
    p.y = 9;
    p.coins = 999;
    const s = deserialize(serialize(p, complete, [], []))!;
    expect(new World().blocked(s.player)).toBe(false);
    expect(s.player.coins).toBe(999);
    expect(distance(s.player, p)).toBeLessThan(3);
  });
});
describe("Navegação global", () => {
  it("contorna uma parede em U, respeita cada segmento e chega por movimento real", () => {
    const w = new World();
    w.props = [];
    for (let y = 6; y <= 12; y++)
      w.props.push({
        id: `wall-${y}`,
        kind: "wall",
        x: 8,
        y,
        solid: true,
        radius: 0.48,
        scale: 1,
      });
    const actor = { x: 6, y: 9 },
      target = { x: 10, y: 9 };
    const path = findPath(w, actor, target);
    expect(path.length).toBeGreaterThan(1);
    let route;
    for (let i = 0; i < 700 && distance(actor, target) > 0.15; i++) {
      route = followRoute(w, actor, route, target, 0.02, 2);
      expect(w.blocked(actor, 0.23)).toBe(false);
    }
    expect(distance(actor, target)).toBeLessThan(0.15);
  });
  it("não atravessa obstáculos sem rota e não corta cantos diagonais", () => {
    const w = new World();
    w.props = [];
    for (let y = 1; y <= 26; y++)
      w.props.push({
        id: String(y),
        kind: "wall",
        x: 8,
        y,
        solid: true,
        radius: 0.6,
        scale: 1,
      });
    expect(findPath(w, { x: 6, y: 9 }, { x: 10, y: 9 })).toEqual([]);
  });
  it("a IA realmente contorna o obstáculo durante perseguição sem atravessá-lo", () => {
    const w = new World();
    w.props = [];
    for (let y = 5; y <= 7; y++)
      w.props.push({
        id: String(y),
        kind: "wall",
        x: 8,
        y,
        solid: true,
        radius: 0.48,
        scale: 1,
      });
    const p = createPlayer();
    Object.assign(p, { x: 10, y: 6 });
    const e = createEnemies()[0];
    Object.assign(e, {
      x: 6,
      y: 6,
      home: { x: 6, y: 6 },
      state: "chase",
      lostSight: 0,
    });
    const ctx: CombatContext = {
      player: p,
      enemies: [e],
      world: w,
      quest: { ...complete },
      effects: [],
      texts: [],
      projectiles: [],
      sound: () => {},
      notify: () => {},
    };
    const b = new Combat(ctx);
    for (let i = 0; i < 450 && distance(e, p) > 0.8; i++) {
      updateEnemies([e], p, w, b, 0.02, i * 0.02);
      expect(w.blocked(e, 0.23)).toBe(false);
    }
    expect(distance(e, p)).toBeLessThan(0.9);
    expect(e.route?.steps).toBeGreaterThan(0);
  });
  it("abandona perseguição distante e retorna à origem por rota válida", () => {
    const w = new World(),
      p = createPlayer();
    p.x = 25;
    p.y = 25;
    const e = createEnemies()[0];
    e.x = 13;
    e.y = 10;
    e.state = "chase";
    const c: CombatContext = {
      player: p,
      enemies: [e],
      world: w,
      quest: { ...complete },
      effects: [],
      texts: [],
      projectiles: [],
      sound: () => {},
      notify: () => {},
    };
    const b = new Combat(c);
    for (let i = 0; i < 500; i++) {
      updateEnemies([e], p, w, b, 0.02, i * 0.02);
      expect(w.blocked(e, 0.23)).toBe(false);
    }
    expect(e.state).toBe("patrol");
    expect(distance(e, e.home)).toBeLessThan(1);
  });
});
describe("Campanha e transações reais", () => {
  function game() {
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: vi.fn() });
    const g = new Game();
    g.input = { keys: new Set() } as any;
    g.renderer = { makeFloor: vi.fn(), snap: vi.fn() } as any;
    g.quest = { ...complete };
    return g;
  }
  it("a estrada industrial exige memórias, permite retorno pela entrada correta e mantém encontros", () => {
    const g = game();
    expect(g.changeRegion("ferrugem")).toBe(false);
    g.changeRegion("kharn");
    expect(g.changeRegion("ferrugem")).toBe(false);
    g.exploration.campaign = {
      accepted: true,
      entered: true,
      attuned: ["vigia", "canal", "memoria"],
      rewardClaimed: true,
    };
    expect(g.changeRegion("ferrugem")).toBe(true);
    expect(g.player.x).toBe(5);
    g.enemies[0].hp = 32;
    expect(g.changeRegion("kharn")).toBe(true);
    expect(g.player.x).toBe(23);
    expect(g.player.y).toBe(18);
    g.changeRegion("ferrugem");
    expect(g.enemies[0].hp).toBe(32);
    expect(g.exploration.visited).toContain("ferrugem");
  });
  it("transição mantém personagem, inventário e árvores, cancela efeitos e restaura baú na volta", () => {
    const g = game();
    g.player.hp = 150;
    g.world.props.find((p) => p.kind === "chest")!.opened = true;
    g.effects.push({
      x: 2,
      y: 2,
      kind: "nova",
      time: 0,
      duration: 1,
      angle: 0,
      color: "#fff",
      range: 1,
    });
    const before = structuredClone(g.player);
    expect(g.changeRegion("kharn")).toBe(true);
    expect(g.effects).toHaveLength(0);
    expect(g.player.hp).toBe(150);
    expect(g.player.trees).toEqual(before.trees);
    expect(g.player.inventory).toEqual(before.inventory);
    g.enemies[0].hp = 20;
    g.changeRegion("pedralta");
    expect(g.world.props.find((p) => p.id === "chest-8-16")!.opened).toBe(true);
    g.changeRegion("kharn");
    expect(g.enemies[0].hp).toBe(20);
  });
  it("marco depende do vigia, não duplica progresso e recompensa é única mesmo após reload", () => {
    const g = game();
    g.changeRegion("kharn");
    g.acceptCampaign();
    const a = ANCHORS[0];
    Object.assign(g.player, { x: a.x, y: a.y });
    expect(g.interact()).toBe(false);
    g.combat.hit(
      g.enemies.find((e) => e.id === a.guardian)!,
      999,
      "#fff",
    );
    expect(g.interact()).toBe(true);
    expect(g.interact()).toBe(true);
    expect(g.exploration.campaign.attuned).toEqual(["vigia"]);
    for (const a of ANCHORS.slice(1)) {
      Object.assign(g.player, { x: a.x, y: a.y });
      g.combat.hit(
        g.enemies.find((e) => e.id === a.guardian)!,
        999,
        "#fff",
      );
      expect(g.interact()).toBe(true);
    }
    g.changeRegion("pedralta");
    const coins = g.player.coins;
    expect(g.claimCampaign()).toBe(true);
    expect(g.player.coins).toBe(coins + 180);
    expect(g.player.inventory).toContain("amuleto");
    expect(g.claimCampaign()).toBe(false);
    const raw = serialize(g.player, g.quest, [], [], g.exploration);
    const saved = deserialize(raw)!;
    g.player = saved.player;
    g.exploration = saved.exploration;
    expect(g.claimCampaign()).toBe(false);
    expect(g.player.coins).toBe(coins + 180);
  });
});
