import { afterEach, expect, it, vi } from "vitest";
import { drawMinimap } from "../src/minimap";
import { World } from "../src/world";
import { createPlayer } from "../src/state";
import { freshExploration } from "../src/regions";
import type { Assets } from "../src/assets";
afterEach(() => vi.unstubAllGlobals());

it("não revela construções desconhecidas ao desenhar o novo mapa isométrico", () => {
  vi.stubGlobal("Path2D", class {});
  const world = new World();
  world.props = world.props.filter((prop) => prop.kind === "house").slice(0, 2);
  expect(world.props).toHaveLength(2);
  const exploration = freshExploration();
  const known = world.props[0];
  exploration.regions.pedralta.discovered = [`${Math.floor(known.x)}:${Math.floor(known.y)}`];
  const ctx = new Proxy({}, { get: (target, key) => (target as Record<PropertyKey, unknown>)[key] ?? vi.fn() });
  const canvas = { width: 192, height: 144, getContext: () => ctx } as unknown as HTMLCanvasElement;
  const assets = { draw: vi.fn() } as unknown as Assets;
  drawMinimap(canvas, world, createPlayer(), [], exploration, null, false, true, assets);
  expect(assets.draw).toHaveBeenCalledTimes(1);
  exploration.regions.pedralta.discovered.push(`${Math.floor(world.props[1].x)}:${Math.floor(world.props[1].y)}`);
  vi.mocked(assets.draw).mockClear();
  drawMinimap(canvas, world, createPlayer(), [], exploration, null, false, true, assets);
  expect(assets.draw).toHaveBeenCalledTimes(2);
});
