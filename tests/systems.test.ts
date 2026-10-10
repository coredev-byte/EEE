import { describe, it, expect } from "vitest";
import { iso, uniso, World, distance } from "../src/world";
import {
  createPlayer,
  stats,
  equip,
  gainXp,
  createEnemies,
} from "../src/state";
import { Combat, type CombatContext } from "../src/combat";
import { deserialize, serialize } from "../src/save";
import { spriteIndex, frame } from "../src/animation";
import { CLASSES } from "../src/data";
import { updateEnemies } from "../src/enemies";
function context(): CombatContext {
  return {
    player: createPlayer(),
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
describe("Mundo e animações", () => {
  it("projeção isométrica reversível", () => {
    for (const p of [
      { x: 1, y: 20 },
      { x: 12.2, y: 9.6 },
      { x: 26, y: 26 },
    ]) {
      const back = uniso(iso(p));
      expect(back.x).toBeCloseTo(p.x);
      expect(back.y).toBeCloseTo(p.y);
    }
  });
  it("colisões bloqueiam casas e limites, sem impedir o caminho inicial", () => {
    const w = new World();
    expect(w.blocked({ x: 5, y: 9 })).toBe(true);
    expect(w.blocked({ x: 0, y: 4 })).toBe(true);
    expect(w.blocked({ x: 12, y: 12 })).toBe(false);
    const p = { x: 3.3, y: 9 };
    w.move(p, { x: 2, y: 0 });
    expect(p.x).toBe(3.3);
  });
  it("quatro linhas direcionais e caminhada articulada", () => {
    expect(
      new Set(
        ["front", "right", "back", "left"].map((d) =>
          Math.floor(spriteIndex(d as any, "idle", 0) / 12),
        ),
      ).size,
    ).toBe(4);
    expect(frame("walk", 0.01)).not.toBe(frame("walk", 0.3));
    expect(frame("dead", 3)).toBe(11);
  });
});
describe("Combate e IA", () => {
  it("dano sincronizado depois da preparação, apenas uma vez por golpe", () => {
    const c = context();
    c.enemies[0].x = 12.6;
    c.enemies[0].y = 12.6;
    const cb = new Combat(c),
      e = c.enemies[0];
    expect(cb.attack({ x: 13, y: 13 })).toBe(true);
    expect(cb.attack()).toBe(false);
    cb.update(0.1);
    expect(e.hp).toBe(100);
    cb.update(0.06);
    expect(e.hp).toBe(66);
    cb.update(0.1);
    expect(e.hp).toBe(66);
  });
  it("alcance e cone impedem acertos atrás do jogador", () => {
    const c = context();
    c.enemies[0].x = 11.5;
    c.enemies[0].y = 11.5;
    const cb = new Combat(c);
    cb.attack({ x: 13, y: 13 });
    cb.update(0.2);
    expect(c.enemies[0].hp).toBe(100);
  });
  it("morte concede XP e moedas uma vez", () => {
    const c = context();
    const cb = new Combat(c),
      e = c.enemies[0];
    cb.hit(e, 999, "#fff");
    const coins = c.player.coins;
    cb.hit(e, 999, "#fff");
    expect(e.state).toBe("dead");
    expect(c.quest.kills).toBe(1);
    expect(c.player.coins).toBe(coins);
    expect(c.player.xp).toBe(65);
  });
  it("mana, recarga e bloqueio de habilidade impedem usos inválidos", () => {
    const c = context(),
      cb = new Combat(c);
    expect(cb.attack(undefined, 2)).toBe(false);
    c.player.mp = 0;
    expect(cb.attack(undefined, 0)).toBe(false);
    c.player.mp = 120;
    expect(cb.attack(undefined, 0)).toBe(true);
    expect(c.player.mp).toBe(104);
    expect(c.player.cooldowns[0]).toBe(4);
    cb.update(0.6);
    expect(cb.attack(undefined, 0)).toBe(false);
  });
  it("classes possuem mecânicas distintas e projétil causa dano real", () => {
    expect(new Set(Object.values(CLASSES).map((c) => c.basic)).size).toBe(2);
    const c = context();
    c.player.classId = "atirador";
    c.enemies[0].x = 13;
    c.enemies[0].y = 12;
    const cb = new Combat(c);
    cb.attack({ x: 15, y: 12 });
    cb.update(0.16);
    expect(c.enemies[0].hp).toBeLessThan(100);
  });
  it("invulnerabilidade e armadura reduzem o dano recebido", () => {
    const c = context(),
      cb = new Combat(c);
    cb.damagePlayer(26);
    expect(c.player.hp).toBe(226);
    cb.damagePlayer(26);
    expect(c.player.hp).toBe(226);
    c.player.invulnerable = 0;
    c.player.guard = 5;
    cb.damagePlayer(26);
    expect(c.player.hp).toBe(220);
  });
  it("IA percebe, persegue, ataca e recupera", () => {
    const c = context(),
      cb = new Combat(c),
      e = c.enemies[0];
    e.x = 12.5;
    e.y = 12.5;
    updateEnemies([e], c.player, c.world, cb, 0.1, 1);
    expect(e.state).toBe("attack");
    updateEnemies([e], c.player, c.world, cb, 0.3, 1);
    expect(c.player.hp).toBeLessThan(248);
    updateEnemies([e], c.player, c.world, cb, 0.3, 1);
    expect(e.state).toBe("recover");
  });
});
describe("RPG e persistência", () => {
  it("equipamentos modificam atributos e podem ser removidos", () => {
    const p = createPlayer();
    const before = stats(p).attack;
    expect(equip(p, "brasa")).toBe(true);
    expect(stats(p).attack).toBe(before + 12);
    expect(equip(p, "runa")).toBe(false);
    expect(equip(p, null, "weapon")).toBe(true);
    expect(stats(p).attack).toBe(30);
  });
  it("XP aumenta nível, vida máxima e pontos de habilidade", () => {
    const p = createPlayer();
    expect(gainXp(p, 151)).toBe(1);
    expect(p.level).toBe(2);
    expect(p.xp).toBe(1);
    expect(p.skillPoints).toBe(1);
    expect(p.hp).toBe(stats(p).maxHp);
  });
  it("salvamento mantém inventário, equipamento, missão e baús", () => {
    const p = createPlayer();
    equip(p, "brasa");
    const raw = serialize(
      p,
      { stage: 1, kills: 2, rewardClaimed: false },
      ["chest-8-16"],
      [1, 3],
    );
    const s = deserialize(raw)!;
    expect(s.player.equipment.weapon).toBe("brasa");
    expect(s.quest.kills).toBe(2);
    expect(s.opened).toEqual(["chest-8-16"]);
    expect(s.killed).toEqual([1, 3]);
  });
  it("dados corrompidos não quebram o jogo", () => {
    expect(deserialize("garbage")).toBe(null);
    expect(deserialize('{"version":2}')).toBe(null);
    const p = createPlayer();
    p.level = -1;
    expect(
      deserialize(
        serialize(p, { stage: 0, kills: 0, rewardClaimed: false }, [], []),
      ),
    ).toBe(null);
  });
});

describe("Habilidades avançadas", () => {
  it("nova causa dano em múltiplos alvos, uma vez em cada um", () => {
    const c = context();
    c.player.unlocked = 4;
    for (const e of c.enemies.slice(0, 2)) {
      e.x = 12.5;
      e.y = 12.5;
    }
    const cb = new Combat(c);
    cb.attack(undefined, 2);
    cb.update(0.2);
    const hp = c.enemies.slice(0, 2).map((e) => e.hp);
    expect(hp.every((n) => n < 100)).toBe(true);
    cb.update(0.1);
    expect(c.enemies.slice(0, 2).map((e) => e.hp)).toEqual(hp);
  });
  it("investida não atravessa paredes e concede invulnerabilidade", () => {
    const c = context();
    c.player.x = 3;
    c.player.y = 9;
    const cb = new Combat(c);
    cb.attack({ x: 6, y: 9 }, 1);
    cb.update(0.2);
    expect(c.world.blocked(c.player)).toBe(false);
    expect(c.player.x).toBeLessThan(5);
    expect(c.player.invulnerable).toBeGreaterThan(0);
  });
  it("cura e defesa possuem comportamento funcional", () => {
    const c = context();
    c.player.unlocked = 4;
    c.player.classId = "arcanista";
    c.player.hp = 40;
    const cb = new Combat(c);
    cb.attack(undefined, 3);
    cb.update(0.2);
    expect(c.player.hp).toBe(110);
    c.player.attackTimer = 0;
    cb.pending = null;
    c.player.classId = "guerreiro";
    c.player.cooldowns[3] = 0;
    cb.attack(undefined, 3);
    cb.update(0.2);
    expect(c.player.guard).toBe(5);
  });
});
