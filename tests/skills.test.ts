import { describe, it, expect } from "vitest";
import {
  NODES,
  BRANCHES,
  learn,
  assign,
  syncPoints,
  points,
  profile,
  validBuild,
  requirements,
  respec,
  respecCost,
  saveBuild,
  restoreBuild,
  effectiveSkill,
  freshProfiles,
} from "../src/skills";
import { createPlayer, createEnemies, gainXp, stats } from "../src/state";
import { Combat, type CombatContext } from "../src/combat";
import { World } from "../src/world";
import { serialize, deserialize } from "../src/save";
import { CLASSES, type ClassId } from "../src/data";
const classes = Object.keys(CLASSES) as ClassId[];
function context(id: ClassId = "guerreiro"): CombatContext {
  return {
    player: createPlayer(id),
    enemies: createEnemies(),
    effects: [],
    texts: [],
    projectiles: [],
    quest: { stage: 0, kills: 0, rewardClaimed: false },
    world: new World(),
    notify: () => {},
    sound: () => {},
  };
}
function branch(c: CombatContext, b: number) {
  c.player.level = 60;
  syncPoints(c.player);
  for (const n of NODES.filter(
    (n) =>
      n.classId === c.player.classId &&
      n.branch === b &&
      ["active", "passive", "ultimate"].includes(n.type),
  ))
    expect(learn(c.player, n.id), n.name).toBe(true);
}
function cast(c: CombatContext, cb: Combat, id: string) {
  assign(c.player, id, 0);
  c.player.mp = stats(c.player).maxMp;
  c.player.resource = c.player.classId === "assassino" ? 10 : 100;
  c.player.attackTimer = 0;
  cb.pending = null;
  return cb.attack({ x: 14, y: 12 }, 0);
}
describe("Progressão e árvore real", () => {
  it("tem 180 nós principais e doze ramos completos, todos alcançáveis com 59 pontos", () => {
    expect(BRANCHES).toHaveLength(12);
    expect(
      NODES.filter(
        (n) =>
          n.branch >= 0 && ["active", "passive", "ultimate"].includes(n.type),
      ),
    ).toHaveLength(180);
    for (const id of classes) {
      const c = context(id);
      for (let b = 0; b < 3; b++) branch(c, b);
      expect(profile(c.player).nodes).toHaveLength(47);
      expect(points(c.player)).toBe(14);
      expect(validBuild(profile(c.player), id, 60)).toBe(true);
      const save = deserialize(serialize(c.player, c.quest, [], []));
      expect(save?.player.trees[id].nodes).toEqual(profile(c.player).nodes);
    }
  });
  it("bloqueia por nível, ancestral, investimento e orçamento, sem consumir pontos", () => {
    const p = createPlayer();
    p.level = 5;
    syncPoints(p);
    const before = points(p);
    expect(learn(p, "guerreiro-0-14")).toBe(false);
    expect(learn(p, "guerreiro-0-4")).toBe(false);
    expect(points(p)).toBe(before);
    expect(
      requirements(
        p,
        NODES.find((n) => n.id === "guerreiro-0-14")!,
      ),
    ).toContain("Nível 60");
  });
  it("limita nível a 60 e concessão a 59 pontos", () => {
    const p = createPlayer();
    gainXp(p, 1e9);
    expect(p.level).toBe(60);
    expect(p.skillPoints).toBe(59);
    expect(gainXp(p, 1e9)).toBe(0);
    expect(p.xp).toBe(0);
  });
  it("configura quatro atalhos, remove duplicatas e só permite uma suprema", () => {
    const c = context();
    branch(c, 0);
    branch(c, 1);
    assign(c.player, "guerreiro-0-14", 0);
    assign(c.player, "guerreiro-1-14", 1);
    expect(profile(c.player).bar[0]).toBe(null);
    expect(assign(c.player, "arcanista-0-0", 2)).toBe(false);
    assign(c.player, "guerreiro-base-0", 3);
    expect(
      profile(c.player).bar.filter((x) => x === "guerreiro-base-0"),
    ).toHaveLength(1);
    expect(deserialize(serialize(c.player, c.quest, [], []))).not.toBe(null);
  });
  it("limita melhorias a duas e aplica dano, escudo e requisitos", () => {
    const c = context();
    c.player.level = 5;
    syncPoints(c.player);
    learn(c.player, "guerreiro-0-0");
    expect(learn(c.player, "guerreiro-0-0-up-0")).toBe(true);
    expect(learn(c.player, "guerreiro-0-0-up-1")).toBe(true);
    expect(learn(c.player, "guerreiro-0-0-up-2")).toBe(false);
    expect(effectiveSkill(c.player, "guerreiro-0-0")!.damage).toBe(43.75);
    expect(validBuild(profile(c.player), "guerreiro", 5)).toBe(true);
    const cb = new Combat(c);
    c.enemies[0].x = 13;
    c.enemies[0].y = 12;
    expect(cast(c, cb, "guerreiro-0-0")).toBe(true);
    cb.update(0.2);
    expect(cb.engine.shield).toBeGreaterThan(0);
  });
  it("conexões exigem dois ramos e maestria exige desafios, mesmo após carregar", () => {
    const c = context();
    branch(c, 0);
    expect(learn(c.player, "guerreiro-hybrid-0")).toBe(false);
    branch(c, 1);
    expect(learn(c.player, "guerreiro-hybrid-0")).toBe(true);
    expect(learn(c.player, "guerreiro-mastery-0")).toBe(false);
    c.player.challenges = { kills: 20, chests: 2, seal: true };
    expect(learn(c.player, "guerreiro-mastery-0")).toBe(true);
    expect(learn(c.player, "guerreiro-mastery-1")).toBe(true);
    expect(profile(c.player).mastery).toBe("guerreiro-mastery-1");
    expect(
      deserialize(serialize(c.player, c.quest, [], []))?.player.trees.guerreiro
        .mastery,
    ).toBe("guerreiro-mastery-1");
  });
  it("builds comparam e restauram pontos por moeda sem duplicar progresso", () => {
    const p = createPlayer();
    p.level = 10;
    p.coins = 1000;
    syncPoints(p);
    learn(p, "guerreiro-0-0");
    assign(p, "guerreiro-0-0", 0);
    saveBuild(p, 0);
    const cost = respecCost(p);
    expect(respec(p)).toBe(true);
    expect(points(p)).toBe(9);
    expect(restoreBuild(p, 0)).toBe(true);
    expect(points(p)).toBe(8);
    expect(p.coins).toBe(1000 - cost * 2);
    expect(profile(p).bar[0]).toBe("guerreiro-0-0");
    p.coins = 0;
    expect(respec(p)).toBe(false);
  });
  it("rejeita saves que burlam dependências, pontos, atalhos ou classes", () => {
    const c = context();
    c.player.level = 5;
    syncPoints(c.player);
    const raw = JSON.parse(serialize(c.player, c.quest, [], []));
    raw.player.trees.guerreiro.nodes.push("guerreiro-0-14");
    expect(deserialize(JSON.stringify(raw))).toBe(null);
    raw.player.trees = freshProfiles();
    raw.player.trees.guerreiro.bar[0] = "arcanista-base-0";
    expect(deserialize(JSON.stringify(raw))).toBe(null);
  });
  it("migra v1 preservando poderes, equipamentos, baús e missão", () => {
    const c = context("arcanista");
    c.player.level = 4;
    const old = JSON.parse(serialize(c.player, c.quest, ["chest-8-16"], [0]));
    old.version = 1;
    old.player.unlocked = 4;
    delete old.player.trees;
    delete old.player.skillCooldowns;
    delete old.player.resource;
    delete old.player.challenges;
    const s = deserialize(JSON.stringify(old))!;
    expect(s.version).toBe(3);
    expect(s.player.trees.arcanista.bar).toEqual([
      "arcanista-base-0",
      "arcanista-base-1",
      "arcanista-base-2",
      "arcanista-base-3",
    ]);
    expect(s.player.skillPoints).toBe(1);
    expect(s.player.challenges.chests).toBe(1);
    expect(s.player.inventory).toEqual(c.player.inventory);
  });
});
describe("Efeitos reais das especializações", () => {
  it("veneno acumula com limites, enfraquece e causa morte recompensada só uma vez", () => {
    const c = context("assassino");
    branch(c, 1);
    const cb = new Combat(c),
      e = c.enemies[0];
    e.x = 13;
    e.y = 12;
    e.hp = e.maxHp = 1000;
    cast(c, cb, "assassino-1-2");
    cb.update(0.2);
    expect(cb.engine.get(e, "poison")).toBeDefined();
    expect(cb.engine.outgoing(e)).toBeLessThan(1);
    for (let i = 0; i < 10; i++) cb.engine.apply(e, "poison", 99, 3);
    expect(cb.engine.get(e, "poison")!.stacks).toBe(5);
    expect(cb.engine.get(e, "poison")!.time).toBe(12);
    e.hp = 1;
    cb.update(1);
    expect(e.hp).toBe(0);
    const coins = c.player.coins;
    cb.update(1);
    expect(c.player.coins).toBe(coins);
    expect(c.player.challenges.kills).toBe(1);
  });
  it("piromancia queima e vazio corrompe, controla e consome marcas", () => {
    const c = context("arcanista");
    branch(c, 0);
    branch(c, 1);
    const cb = new Combat(c),
      e = c.enemies[0];
    e.x = 13;
    e.y = 12;
    e.hp = e.maxHp = 1000;
    cast(c, cb, "arcanista-0-0");
    cb.update(0.2);
    expect(cb.engine.get(e, "burn")).toBeDefined();
    const hp = e.hp;
    cb.update(1);
    expect(e.hp).toBeLessThan(hp);
    cast(c, cb, "arcanista-1-0");
    cb.update(0.2);
    expect(cb.engine.get(e, "corruption")).toBeDefined();
    cast(c, cb, "arcanista-1-13");
    cb.update(0.2);
    expect(cb.engine.get(e, "corruption")?.time).toBe(0);
  });
  it("passivas de defesa mudam o dano e bloqueios geram Ímpeto", () => {
    const c = context(),
      cb = new Combat(c);
    branch(c, 0);
    const before = c.player.hp;
    c.player.guard = 5;
    cb.engine.buffs.perfectGuard = 1;
    cb.damagePlayer(26, c.enemies[0]);
    expect(before - c.player.hp).toBeLessThan(6);
    expect(c.player.resource).toBeGreaterThan(0);
    expect(c.enemies[0].hp).toBeLessThan(100);
  });
  it("furtividade reduz percepção e ataque de abertura é mais forte", () => {
    const c = context("assassino");
    branch(c, 0);
    const cb = new Combat(c),
      e = c.enemies[0];
    e.hp = e.maxHp = 1000;
    cast(c, cb, "assassino-0-2");
    cb.update(0.2);
    expect(cb.engine.detection()).toBe(0);
    const boosted = cb.engine.amplify(e, 100, "assassino-0-0");
    expect(boosted).toBeGreaterThan(150);
    expect(cb.engine.active("stealth")).toBe(false);
  });
  it("torreta e mina atingem alvos ao longo do tempo e podem ser detonadas", () => {
    const c = context("atirador");
    branch(c, 1);
    const cb = new Combat(c),
      e = c.enemies[0];
    e.x = 15;
    e.y = 12;
    e.hp = e.maxHp = 1000;
    cast(c, cb, "atirador-1-2");
    cb.update(0.2);
    const before = e.hp;
    cb.update(1);
    expect(e.hp).toBeLessThan(before);
    expect(cb.engine.zones).toHaveLength(1);
    cast(c, cb, "atirador-1-12");
    cb.update(0.2);
    expect(cb.engine.zones[0].time).toBe(0);
  });
  it("conjuração duplicada gera projétil adicional com dano reduzido", () => {
    const c = context("arcanista");
    branch(c, 2);
    const cb = new Combat(c);
    cast(c, cb, "arcanista-2-6");
    cb.update(0.2);
    cast(c, cb, "arcanista-2-0");
    cb.update(0.16);
    expect(c.projectiles).toHaveLength(2);
    expect(c.projectiles[1].damage).toBeLessThan(c.projectiles[0].damage);
  });
  it("supremas exigem recurso e preservam recarga por habilidade ao trocar atalhos", () => {
    const c = context();
    branch(c, 0);
    const cb = new Combat(c);
    assign(c.player, "guerreiro-0-14", 0);
    c.player.resource = 0;
    expect(cb.attack(undefined, 0)).toBe(false);
    c.player.resource = 100;
    expect(cb.attack(undefined, 0)).toBe(true);
    expect(c.player.resource).toBe(40);
    assign(c.player, "guerreiro-0-14", 3);
    cb.update(0.6);
    expect(cb.attack(undefined, 3)).toBe(false);
  });
  it("chefes resistem a controles encadeados", () => {
    const c = context(),
      cb = new Combat(c),
      e = c.enemies[0];
    e.maxHp = 500;
    cb.engine.apply(e, "root", 4);
    expect(cb.engine.get(e, "root")!.time).toBe(1);
    cb.engine.apply(e, "stun", 4);
    expect(cb.engine.get(e, "stun")).toBeUndefined();
  });
});
describe("Canalização e trajetórias especiais", () => {
  it("segurar a tecla carrega o feitiço e soltar libera o dano", () => {
    const c = context("arcanista");
    branch(c, 0);
    c.enemies = [];
    let held = true;
    c.skillHeld = () => held;
    const cb = new Combat(c);
    expect(cast(c, cb, "arcanista-0-11")).toBe(true);
    cb.update(0.6);
    expect(c.projectiles).toHaveLength(0);
    expect(cb.pending?.done).toBe(false);
    held = false;
    cb.update(0.1);
    expect(c.projectiles).toHaveLength(1);
    expect(c.projectiles[0].damage).toBeGreaterThan(100);
  });
  it("lâmina fantasma retorna e não permanece indefinidamente no mundo", () => {
    const c = context("assassino");
    branch(c, 0);
    c.enemies = [];
    const cb = new Combat(c);
    cast(c, cb, "assassino-0-10");
    cb.update(0.2);
    cb.update(1.2);
    expect(c.projectiles[0].returning).toBe(true);
    cb.update(1.2);
    expect(c.projectiles).toHaveLength(0);
  });
  it("tiro fantasma atravessa vegetação, mas respeita construções e limites", () => {
    const w = new World();
    w.props = [
      {
        id: "tree",
        kind: "tree",
        x: 13,
        y: 12,
        solid: true,
        radius: 0.4,
        scale: 1,
      },
      {
        id: "house",
        kind: "house",
        x: 15,
        y: 12,
        solid: true,
        radius: 1,
        scale: 1,
      },
    ];
    expect(w.projectileBlocked({ x: 13, y: 12 })).toBe(true);
    expect(w.projectileBlocked({ x: 13, y: 12 }, true)).toBe(false);
    expect(w.projectileBlocked({ x: 15, y: 12 }, true)).toBe(true);
    expect(w.projectileBlocked({ x: 0, y: 12 }, true)).toBe(true);
  });
  it("trocar de classe mantém a build e o orçamento independente de cada caminho", () => {
    const p = createPlayer();
    p.level = 10;
    syncPoints(p);
    learn(p, "guerreiro-0-0");
    assign(p, "guerreiro-0-0", 2);
    p.classId = "arcanista";
    syncPoints(p);
    expect(points(p)).toBe(9);
    learn(p, "arcanista-0-0");
    p.classId = "guerreiro";
    syncPoints(p);
    expect(points(p)).toBe(8);
    expect(profile(p).bar[2]).toBe("guerreiro-0-0");
  });
});
describe("Melhorias de encantamentos", () => {
  it("melhorar uma lâmina encantada altera os ataques básicos durante o efeito", () => {
    const c = context("assassino");
    branch(c, 1);
    const cb = new Combat(c),
      e = c.enemies[0];
    e.hp = e.maxHp = 1000;
    const before = cb.engine.amplify(e, 100);
    learn(c.player, "assassino-1-0-up-0");
    learn(c.player, "assassino-1-0-up-1");
    cast(c, cb, "assassino-1-0");
    cb.update(0.2);
    expect(cb.engine.amplify(e, 100)).toBeGreaterThan(before);
    cb.hit(e, 10, "#fff", "basic");
    expect(cb.engine.shield).toBeGreaterThan(0);
    expect(cb.engine.get(e, "poison")).toBeDefined();
  });
});
