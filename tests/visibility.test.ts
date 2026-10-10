import { describe, it, expect } from "vitest";
import { Game } from "../src/game";
import { World } from "../src/world";
import { edgeIndicator, placeObjective } from "../src/objectives";
import { findPath } from "../src/navigation";
import { ANCHORS, kharnEnemies } from "../src/regions";
describe("Objetivos ligados ao estado real", () => {
  it("troca descoberta por ameaça viva, acompanha movimento e volta ao selo", () => {
    const g = new Game();
    expect(g.activeObjective()?.kind).toBe("investigate");
    expect(g.activeObjective()?.id).toBe(
      g.world.props.find((p) => p.kind === "portal")!.id,
    );
    g.quest.stage = 1;
    const goal = g.activeObjective()!;
    expect(goal.kind).toBe("defeat");
    const e = g.enemies.find((e) => `enemy:${e.id}` === goal.id)!;
    e.x += 0.2;
    e.y += 0.1;
    expect(g.activeObjective()).toMatchObject({ id: goal.id, x: e.x, y: e.y });
    e.hp = 0;
    expect(g.activeObjective()?.id).not.toBe(goal.id);
    g.quest.kills = 3;
    expect(g.activeObjective()?.kind).toBe("interact");
  });
  it("indica passagem da região, conversa, vigia, marco e entrega; encerra destaque", () => {
    const g = new Game();
    g.quest = { stage: 2, kills: 3, rewardClaimed: true };
    expect(g.activeObjective()?.kind).toBe("reach");
    g.world.setRegion("kharn");
    g.enemies = kharnEnemies();
    expect(g.activeObjective()).toMatchObject({ kind: "talk", x: 6, y: 20 });
    g.exploration.campaign.accepted = true;
    expect(g.activeObjective()?.id).toBe("enemy:100");
    g.enemies.find((e) => e.id === 100)!.hp = 0;
    expect(g.activeObjective()).toMatchObject({
      kind: "interact",
      x: ANCHORS[0].x,
      y: ANCHORS[0].y,
    });
    g.exploration.campaign.attuned = ["vigia"];
    expect(g.activeObjective()?.id).toBe("enemy:102");
    g.exploration.campaign.attuned = ["vigia", "canal", "memoria"];
    expect(g.activeObjective()).toMatchObject({ kind: "reach", x: 4, y: 22 });
    g.world.setRegion("pedralta");
    expect(g.activeObjective()).toMatchObject({ kind: "talk", x: 10, y: 14 });
    g.exploration.campaign.rewardClaimed = true;
    expect(g.activeObjective()).toBeNull();
  });
  it("resolve posições dos objetos no mundo em vez de repetir coordenadas", () => {
    const g = new Game();
    const portal = g.world.props.find((p) => p.kind === "portal")!;
    portal.x = 21.25;
    portal.y = 7.5;
    expect(g.activeObjective()).toMatchObject({ x: portal.x, y: portal.y });
  });
});
describe("Bases físicas, circulação e alcance", () => {
  it("bases retangulares nas duas regiões liberam contorno, mas bloqueiam paredes", () => {
    for (const region of ["pedralta", "kharn"] as const) {
      const w = new World(region);
      const o = w.props.find((o) => ["house", "ruinHouse"].includes(o.kind))!;
      w.props = [o];
      expect(o.footprint).toEqual({ halfX: 1.2, halfY: 1.2 });
      const back = { x: o.x - 1.6, y: o.y - 1.6 },
        front = { x: o.x + 1.6, y: o.y + 1.6 };
      expect(w.blocked(back)).toBe(false);
      expect(w.blocked(o)).toBe(true);
      const path = findPath(w, back, front);
      expect(path.length).toBeGreaterThan(1);
      let p = back;
      for (const next of path) {
        expect(w.segmentClear(p, next)).toBe(true);
        p = next;
      }
      const toward = { ...back, y: o.y };
      w.move(toward, { x: 4, y: 0 });
      expect(toward.x).toBeLessThan(o.x - 1.2);
      expect(w.blocked(toward)).toBe(false);
    }
  });
  it("troncos, paredes e rochas bloqueiam a base e permitem passagem externa", () => {
    const w = new World();
    for (const kind of ["tree", "pine", "wall", "rock"] as const) {
      const o = w.props.find(
        (o) => o.kind === kind && o.x > 2 && o.x < 24 && o.y > 2 && o.y < 24,
      );
      if (!o) continue;
      w.props = [o];
      expect(w.blocked(o)).toBe(true);
      expect(w.blocked({ x: o.x + o.radius + 0.3, y: o.y })).toBe(false);
      w.setRegion("pedralta");
    }
  });
  it("uma interação próxima não atravessa parede; aproximação livre funciona", () => {
    const g = new Game();
    const chest = g.world.props.find((o) => o.kind === "chest")!;
    Object.assign(g.player, { x: chest.x - 1, y: chest.y });
    const wall = {
      id: "wall-test",
      kind: "wall" as const,
      x: chest.x - 0.5,
      y: chest.y,
      radius: 0.25,
      scale: 1,
      solid: true,
    };
    g.world.props = [chest, wall];
    expect(g.nearby()).toBeUndefined();
    g.world.props = [chest];
    expect(g.nearby()).toBe(chest);
  });
});
describe("Indicadores de direção", () => {
  it("borda mantém a direção do alvo em todas as posições e proporções", () => {
    for (const [w, h] of [
      [960, 540],
      [160, 160],
      [320, 120],
    ])
      for (const p of [
        { x: -100, y: 40 },
        { x: 2000, y: 1000 },
        { x: 100, y: -300 },
        { x: 40, y: 2000 },
      ]) {
        const at = edgeIndicator(p, w, h);
        expect(at.outside).toBe(true);
        expect(at.x).toBeGreaterThanOrEqual(24 - 1e-8);
        expect(at.x).toBeLessThanOrEqual(w - 24 + 1e-8);
        expect(at.y).toBeGreaterThanOrEqual(24 - 1e-8);
        expect(at.y).toBeLessThanOrEqual(h - 24 + 1e-8);
        expect(Math.atan2(at.y - h / 2, at.x - w / 2)).toBeCloseTo(
          Math.atan2(p.y - h / 2, p.x - w / 2),
        );
      }
    expect(edgeIndicator({ x: 480, y: 285 }, 960, 540)).toMatchObject({
      x: 480,
      y: 285,
      outside: false,
    });
  });
});

describe("Indicador fora dos painéis", () => {
  it("desvia da HUD sem perder a direção do alvo", () => {
    const blockers = [
      { x: 790, y: 20, width: 150, height: 210 },
      { x: 20, y: 20, width: 280, height: 180 },
    ];
    for (const target of [
      { x: 1200, y: -100 },
      { x: -200, y: -200 },
      { x: 880, y: 120 },
    ]) {
      const at = placeObjective(target, 960, 540, blockers);
      expect(at.outside).toBe(true);
      expect(
        blockers.some(
          (b) =>
            at.x > b.x - 25 &&
            at.x < b.x + b.width + 25 &&
            at.y > b.y - 25 &&
            at.y < b.y + b.height + 25,
        ),
      ).toBe(false);
      expect(at.angle).toBeCloseTo(
        Math.atan2(target.y - at.y, target.x - at.x),
      );
    }
  });
});
