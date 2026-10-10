import { describe, it, expect, vi } from "vitest";
import { Renderer } from "../src/renderer";
import { createPlayer } from "../src/state";
import { CLASSES, DIRS, type Action } from "../src/data";

describe("Renderização das armas do personagem", () => {
  it("mantém os sprites animados sem desenhar ícones de inventário sobre a mão", () => {
    const ctx = {
      globalAlpha: 1,
      fillStyle: "",
      fillRect: vi.fn(),
    };
    const assets = { draw: vi.fn(), icon: vi.fn() };
    const renderer = Object.create(Renderer.prototype) as Renderer;
    Object.assign(renderer, {
      ctx,
      assets,
      time: 0.2,
      project: () => ({ x: 48, y: 108 }),
      shadow: vi.fn(),
    });
    const actions: Action[] = [
      "idle",
      "walk",
      "attack",
      "cast",
      "hurt",
      "dead",
    ];
    for (const classId of Object.keys(CLASSES) as (keyof typeof CLASSES)[]) {
      for (const direction of DIRS) {
        for (const action of actions) {
          assets.draw.mockClear();
          const player = createPlayer(classId);
          Object.assign(player, { direction, action, animTime: 0.2 });
          renderer.player(player);
          expect(assets.draw).toHaveBeenCalledTimes(1);
          expect(assets.icon).not.toHaveBeenCalled();
        }
      }
    }
    const player = createPlayer();
    player.equipment.weapon = "brasa";
    renderer.player(player);
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(assets.icon).not.toHaveBeenCalled();
    player.guard = 1;
    renderer.player(player);
    expect(assets.icon).toHaveBeenCalledWith(ctx, 8, 35, 20, 26);
  });
});

describe("Fila completa do mundo", () => {
  it("ordena efeitos, obstáculos e personagem pelo chão e separa cada trecho da investida", () => {
    const calls: string[] = [];
    const renderer = Object.create(Renderer.prototype) as Renderer;
    const player = createPlayer();
    player.x = 10;
    player.y = 10;
    Object.assign(renderer, {
      ctx: { fillRect: vi.fn(), drawImage: vi.fn() },
      camera: { x: 0, y: 400 },
      time: 0,
      floorOrigin: 1120,
      floorOffsetY: 30,
      world: { props: [{ id: "wall", kind: "wall", x: 12, y: 10 }] },
      prop: () => calls.push("wall"),
      player: () => calls.push("player"),
      projectile: () => calls.push("projectile"),
      effect: (_: unknown, point: { x: number }) =>
        calls.push(`dash-${point.x}`),
    });
    renderer.draw(
      player,
      [],
      [
        {
          kind: "dash",
          x: 9,
          y: 10,
          range: 4,
          angle: 0,
          time: 0,
          duration: 0.4,
          color: "#fff",
        },
      ],
      [],
      [
        {
          x: 8,
          y: 10,
          vx: 1,
          vy: 0,
          damage: 5,
          traveled: 0,
          range: 4,
          color: "#fff",
        },
      ],
      0,
    );
    expect(calls).toEqual([
      "projectile",
      "dash-9",
      "player",
      "dash-10",
      "dash-11",
      "wall",
      "dash-12",
    ]);
  });
  it("usa a vista esquerda de combate sem inverter novamente a arte", () => {
    const renderer = Object.create(Renderer.prototype) as Renderer;
    const assets = { draw: vi.fn(), icon: vi.fn() };
    Object.assign(renderer, {
      ctx: { globalAlpha: 1 },
      assets,
      time: 0,
      project: () => ({ x: 0, y: 0 }),
      shadow: vi.fn(),
    });
    const player = createPlayer("arcanista");
    player.action = "attack";
    player.direction = "left";
    player.equipment.weapon = null;
    renderer.player(player);
    expect(assets.draw.mock.calls[0][3]).toBe(3);
    expect(assets.draw.mock.calls[0][9]).toBe(false);
  });
});
