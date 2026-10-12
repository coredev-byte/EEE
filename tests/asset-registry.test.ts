import { expect, it } from "vitest";
import { ASSET_REGISTRY, RUNTIME_ASSETS, assertSourceDimensions } from "../src/asset-registry";
import { ANIMATIONS } from "../src/data";

it("the loader consumes the registered production paths without duplicate IDs", () => {
  expect(RUNTIME_ASSETS.length).toBeGreaterThanOrEqual(20);
  expect(new Set(RUNTIME_ASSETS.map(a => a.path)).size).toBe(RUNTIME_ASSETS.length);
  expect(RUNTIME_ASSETS.some(a => a.name === "dialogue-reference")).toBe(true);
  expect(RUNTIME_ASSETS.some(a => a.name === "dialogue-frame")).toBe(false);
});
it("the registered primary animation timing matches the gameplay contract", () => {
  for (const [action, animation] of Object.entries(ANIMATIONS)) {
    const registered = ASSET_REGISTRY.hero.animations[
      `front-${action}` as keyof typeof ASSET_REGISTRY.hero.animations
    ];
    expect(registered).toEqual(animation);
  }
});
it("rejects unknown or incorrectly decoded production images", () => {
  expect(() => assertSourceDimensions("hero", 1152, 448)).not.toThrow();
  expect(() => assertSourceDimensions("hero", 1152, 112)).toThrow(/dimensions/);
  expect(() => assertSourceDimensions("imaginary-enemy", 96, 112)).toThrow();
});
it("keeps the real legacy boss crop contract and its pending reconstruction explicit", () => {
  expect(ASSET_REGISTRY.kharn.normalization.rects).toHaveLength(24);
  expect(ASSET_REGISTRY.kharn.normalization.footYs).toHaveLength(3);
  expect(ASSET_REGISTRY.kharn.review.status).toBe("reconstruction-required");
  for (const animation of Object.values(ASSET_REGISTRY.hero.animations)) {
    expect(animation.frames.every(i => i >= 0 && i < 48)).toBe(true);
  }
});
