import { state, seedLegacy, travel, clearGuardian } from "./region-helpers";
import { test, expect, type Page } from "@playwright/test";
import { createPlayer, stats } from "../../src/state";
import { syncPoints } from "../../src/skills";
import { serialize, SAVE_KEY } from "../../src/save";
import { World, distance } from "../../src/world";
import { findPath } from "../../src/navigation";
import { ANCHORS } from "../../src/regions";
test("Save legado: campanha completa, Kharn explorável, recarga, retorno e recompensa única", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await seedLegacy(page);
  expect((await state(page)).region).toBe("pedralta");
  const before = (await state(page)).player;
  await page.keyboard.press("f");
  await expect.poll(async () => (await state(page)).region).toBe("kharn");
  const foot = await page.evaluate(() => {
    const dz = (window as any).__DZ;
    const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
    return { position: dz.project(dz.snapshot().player),
      expected: { x: canvas.width / 2, y: canvas.height / 2 + 15 } };
  });
  expect(foot.position).toEqual(foot.expected);
  expect((await state(page)).player.inventory).toEqual(before.inventory);
  expect((await state(page)).player.trees).toEqual(before.trees);
  await expect(page.locator(".location")).toContainText("MARGEM DE KHARN");
  await expect(page.locator("#map-connection")).toContainText("PEDRALTA");
  await expect(page.locator("#minimap")).toHaveAttribute(
    "aria-label",
    "Minimapa de Margem de Kharn",
  );
  expect(
    (await state(page)).exploration.regions.kharn.discovered.length,
  ).toBeGreaterThan(0);
  const goalVisible = await page
    .locator("#minimap")
    .evaluate((el: HTMLCanvasElement) => {
      const pixels = el
        .getContext("2d")!
        .getImageData(0, 0, el.width, el.height).data;
      for (let i = 0; i < pixels.length; i += 4)
        if (pixels[i] === 232 && pixels[i + 1] === 189 && pixels[i + 2] === 104)
          return true;
      return false;
    });
  expect(goalVisible).toBe(true);
  await travel(page, { x: 6, y: 20 });
  await page.keyboard.press("f");
  await page.getByRole("button", { name: "REUNIR AS MEMÓRIAS" }).click();
  await page.keyboard.press("Escape");
  for (const a of ANCHORS) {
    await travel(page, { x: a.x, y: a.y });
    await clearGuardian(page, a.guardian);
    await travel(page, { x: a.x, y: a.y });
    await page.keyboard.press("f");
    await expect
      .poll(async () =>
        (await state(page)).exploration.campaign.attuned.includes(a.id),
      )
      .toBe(true);
    if (a.id === "vigia") {
      await travel(page, { x: 9, y: 14 });
      await page.keyboard.press("f");
      expect((await state(page)).exploration.regions.kharn.opened).toContain(
        "chest-9-14",
      );
      await page.reload();
      await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
      const restored = await state(page);
      expect(restored.region).toBe("kharn");
      expect(restored.exploration.campaign.attuned).toEqual(["vigia"]);
      expect(restored.enemies.find((e: any) => e.id === 100).hp).toBe(0);
      expect(
        restored.pointsOfInterest.find((p: any) => p.id === "chest-9-14")
          .opened,
      ).toBe(true);
    }
  }
  await page.keyboard.press("j");
  await expect(page.locator(".campaign-detail")).toContainText(
    "As Memórias da Margem",
  );
  await page.screenshot({ path: "artifacts/kharn-campaign.png" });
  await page.keyboard.press("Escape");
  await page.screenshot({ path: "artifacts/kharn-region.png" });
  await travel(page, { x: 4, y: 22 });
  await page.keyboard.press("f");
  await expect.poll(async () => (await state(page)).region).toBe("pedralta");
  expect(
    (await state(page)).pointsOfInterest.find((p: any) => p.id === "chest-8-16")
      .opened,
  ).toBe(true);
  await travel(page, { x: 10, y: 14 });
  await page.keyboard.press("f");
  const coins = (await state(page)).player.coins;
  await page.getByRole("button", { name: "ENTREGAR AS MEMÓRIAS" }).click();
  expect((await state(page)).player.coins).toBe(coins + 180);
  expect((await state(page)).exploration.campaign.rewardClaimed).toBe(true);
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  expect((await state(page)).region).toBe("pedralta");
  expect((await state(page)).exploration.campaign.rewardClaimed).toBe(true);
  const savedCoins = (await state(page)).player.coins;
  await page.keyboard.press("f");
  await expect(page.locator(".dialogue-panel")).toContainText(
    "Pedralta se lembra",
  );
  await expect(
    page.getByRole("button", { name: "ENTREGAR AS MEMÓRIAS" }),
  ).toHaveCount(0);
  expect((await state(page)).player.coins).toBe(savedCoins);
  expect(errors).toEqual([]);
});
test("Selo fechado preserva região e objetivos; mapa e câmera acompanham a conexão após migração", async ({
  page,
}) => {
  const p = createPlayer();
  p.x = 22;
  p.y = 8;
  await page.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), {
    key: SAVE_KEY,
    raw: serialize(p, { stage: 1, kills: 0, rewardClaimed: false }, [], []),
  });
  await page.goto("/");
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  await page.keyboard.press("f");
  expect((await state(page)).region).toBe("pedralta");
  await expect(page.locator("#toast")).toContainText("O selo resiste");
  await expect(page.locator("#map-connection")).toContainText("SELO FECHADO");
  expect((await state(page)).exploration.campaign.entered).toBe(false);
});
