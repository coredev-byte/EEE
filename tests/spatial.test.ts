import { describe, it, expect, vi } from "vitest";
import {
  worldToScreen,
  screenToWorld,
  clientToScreen,
  minimapPoint,
  minimapPadding,
  VIEW,
  FRAMES,
  spriteBounds,
  onScreen,
} from "../src/spatial";
import { paintWorld, effectPosition } from "../src/render-order";
import { World } from "../src/world";
import { Assets } from "../src/assets";
import { createPlayer } from "../src/state";
import { serialize, deserialize } from "../src/save";
import type { Effect } from "../src/state";

describe("Contrato espacial e profundidade", () => {
  it("mantém terreno e pés alinhados com câmera fracionária e inversão precisa", () => {
    for (const camera of [
      { x: 0, y: 480 },
      { x: 100.49, y: 201.51 },
      { x: -150.9, y: 420.1 },
    ]) {
      for (const point of [
        { x: 12, y: 12 },
        { x: 3.43, y: 18.91 },
        { x: 25.2, y: 1.7 },
      ]) {
        const at = worldToScreen(point, camera),
          back = screenToWorld(at, camera);
        expect(Math.abs(back.x - point.x)).toBeLessThan(0.025);
        expect(Math.abs(back.y - point.y)).toBeLessThan(0.025);
        expect(Number.isInteger(at.x) && Number.isInteger(at.y)).toBe(true);
      }
    }
    expect(worldToScreen({ x: 12, y: 12 }, { x: 0, y: 480 })).toEqual(
      VIEW.focus,
    );
  });
  it("preserva construções altas ainda visíveis com pés fora da janela", () => {
    expect(onScreen(spriteBounds({ x: 480, y: 850 }, FRAMES.prop, 2.1))).toBe(
      true,
    );
    expect(onScreen(spriteBounds({ x: 480, y: 900 }, FRAMES.prop, 2.1))).toBe(
      false,
    );
    expect(onScreen(spriteBounds({ x: -500, y: 400 }, FRAMES.prop, 2.1))).toBe(
      false,
    );
  });
  it("converte clique na área real do Canvas em todas as escalas", () => {
    for (const scale of [0.4, 1, 1.5, 3]) {
      expect(
        clientToScreen(
          { x: 70 + 600 * scale, y: 120 + 210 * scale },
          {
            left: 70,
            top: 120,
            width: VIEW.width * scale,
            height: VIEW.height * scale,
          },
        ),
      ).toEqual({ x: 600, y: 210 });
    }
  });
  it("oculta projétil/impacto atrás de obstáculos e mostra os que estão à frente", () => {
    const calls: string[] = [];
    paintWorld([
      { point: { x: 10, y: 10 }, layer: 1, draw: () => calls.push("wall") },
      {
        point: { x: 11, y: 10 },
        layer: 2,
        draw: () => calls.push("front impact"),
      },
      {
        point: { x: 9, y: 10 },
        layer: 2,
        draw: () => calls.push("behind projectile"),
      },
      {
        point: { x: 10, y: 10 },
        layer: 0,
        draw: () => calls.push("ground nova"),
      },
    ]);
    expect(calls).toEqual([
      "behind projectile",
      "ground nova",
      "wall",
      "front impact",
    ]);
  });
  it("cada trecho da investida tem posição e profundidade próprias", () => {
    const effect: Effect = {
      x: 10,
      y: 10,
      kind: "dash",
      range: 4,
      angle: 0,
      time: 0,
      duration: 0.4,
      color: "#fff",
    };
    expect(
      [0, 1, 2, 3].map((sample) => effectPosition(effect, sample)),
    ).toEqual([
      { x: 10, y: 10 },
      { x: 11, y: 10 },
      { x: 12, y: 10 },
      { x: 13, y: 10 },
    ]);
  });
  it("alinha marcadores no centro da célula do minimapa em tamanhos diferentes", () => {
    expect(minimapPoint({ x: 0, y: 0 }, 10, 114, 114)).toEqual({
      x: 12,
      y: 12,
    });
    expect(minimapPoint({ x: 9, y: 9 }, 10, 114, 114)).toEqual({
      x: 102,
      y: 102,
    });
    expect(minimapPoint({ x: 4.5, y: 4.5 }, 10, 214, 114)).toEqual({
      x: 107,
      y: 57,
    });
  });
  it("mantém o pivô dos pés nos sprites ampliados sem interpolação", () => {
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      drawImage: vi.fn(),
    };
    const assets = new Assets();
    assets.images.hero = {} as HTMLImageElement;
    assets.draw(
      ctx as unknown as CanvasRenderingContext2D,
      "hero",
      0,
      0,
      96,
      112,
      100,
      200,
      3,
    );
    expect(ctx.drawImage.mock.calls[0].slice(5)).toEqual([
      -144, -324, 288, 336,
    ]);
    expect(FRAMES.character.pivot).toEqual({ x: 48, y: 108 });
  });
});
describe("Colisões e compatibilidade estrutural", () => {
  it("um movimento longo não salta por cima de um obstáculo", () => {
    const world = new World();
    world.props = [
      {
        id: "barrel-test",
        kind: "barrel",
        x: 6,
        y: 5,
        radius: 0.35,
        solid: true,
        scale: 1,
      },
    ];
    const point = { x: 5, y: 5 };
    world.move(point, { x: 3, y: 0 });
    expect(point.x).toBeLessThan(6);
    expect(world.blocked(point)).toBe(false);
    const edge = { x: 25, y: 25 };
    world.move(edge, { x: 20, y: 0 });
    expect(edge.x).toBeLessThanOrEqual(world.size - 2);
  });
  it("o deslizamento mantém circulação ao lado de uma parede real", () => {
    const world = new World();
    world.props = [
      {
        id: "wall-test",
        kind: "wall",
        x: 6,
        y: 5,
        radius: 0.48,
        solid: true,
        scale: 1,
      },
    ];
    const point = { x: 5.2, y: 5 };
    world.move(point, { x: 0.2, y: 0.8 });
    expect(point.y).toBeGreaterThan(5.7);
    expect(world.blocked(point)).toBe(false);
  });
  it("preserva todos os campos de save v1 e normaliza direção inválida sem perder progressão", () => {
    const player = createPlayer("arcanista");
    player.level = 3;
    player.unlocked = 3;
    player.skillPoints = 2;
    player.inventory.push("runa");
    player.equipment.weapon = "runa";
    const raw = serialize(
      player,
      { stage: 2, kills: 4, rewardClaimed: true },
      ["chest-8-16"],
      [0, 1],
    );
    const old = JSON.parse(raw);
    old.version = 1;
    delete old.player.trees;
    delete old.player.skillCooldowns;
    delete old.player.resource;
    delete old.player.challenges;
    old.player.direction = "invalid";
    const restored = deserialize(JSON.stringify(old))!;
    expect(restored.player.direction).toBe("front");
    expect(restored.player.inventory).toEqual(player.inventory);
    expect(restored.player.equipment).toEqual(player.equipment);
    expect(restored.player.level).toBe(3);
    expect(restored.player.unlocked).toBe(3);
    expect(restored.player.skillPoints).toBe(1);
    expect(restored.quest).toEqual(old.quest);
    expect(restored.opened).toEqual(old.opened);
    expect(restored.killed).toEqual(old.killed);
  });
});

it("mantém todos os cantos e seus marcadores dentro do minimapa circular", () => {
  for (const size of [28, 40])
    for (const width of [100, 160, 240]) {
      const padding = minimapPadding(width, width, true);
      for (const x of [0, size - 1])
        for (const y of [0, size - 1]) {
          const at = minimapPoint({ x, y }, size, width, width, padding);
          expect(
            Math.hypot(at.x - width / 2, at.y - width / 2) + 7,
          ).toBeLessThan(width / 2);
        }
    }
});
