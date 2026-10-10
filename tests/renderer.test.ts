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
    const actions: Action[] = ["idle", "walk", "attack", "cast", "hurt", "dead"];
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
