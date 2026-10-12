import { describe, expect, it } from "vitest";
import { COVER_BRIDGES, coverBridgePoint } from "../src/cover";
import { minimapIsoPoint } from "../src/spatial";

describe("Trajetórias na capa e projeção do minimapa", () => {
  it("mantém os pés entre os pisos de cada ponte durante todo o percurso", () => {
    for (const bridge of COVER_BRIDGES) {
      let previous = bridge[0];
      for (let i = 0; i <= 100; i++) {
        const foot = coverBridgePoint(bridge, i / 100);
        expect(foot.x).toBeGreaterThanOrEqual(previous.x);
        expect(foot.y).toBeGreaterThanOrEqual(previous.y);
        expect(foot.y).toBeLessThanOrEqual(bridge[bridge.length - 1].y);
        previous = foot;
      }
      expect(coverBridgePoint(bridge, -1)).toEqual(bridge[0]);
      expect(coverBridgePoint(bridge, 2)).toEqual(bridge[bridge.length - 1]);
    }
  });
  it("acompanha a subida e descida do piso, em vez de usar uma altura fixa", () => {
    const bridge = [{ x: 0, y: 10 }, { x: 20, y: 30 }, { x: 40, y: 15 }];
    expect(coverBridgePoint(bridge, .25)).toEqual({ x: 10, y: 20 });
    expect(coverBridgePoint(bridge, .75)).toEqual({ x: 30, y: 22.5 });
  });
  it("projeta os quatro cantos e o centro dentro de um minimapa retangular", () => {
    const width = 192, height = 144, size = 28;
    for (const x of [0, size - 1]) for (const y of [0, size - 1]) {
      const at = minimapIsoPoint({ x, y }, size, width, height);
      expect(at.x).toBeGreaterThan(7);
      expect(at.x).toBeLessThan(width - 7);
      expect(at.y).toBeGreaterThan(7);
      expect(at.y).toBeLessThan(height - 7);
    }
    expect(minimapIsoPoint({ x: 13.5, y: 13.5 }, size, width, height)).toEqual({ x: width / 2, y: height / 2 });
  });
});
