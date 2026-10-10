import { test, expect, type Page } from "@playwright/test";
import { createPlayer, stats } from "../../src/state";
import { syncPoints } from "../../src/skills";
import { serialize, SAVE_KEY } from "../../src/save";
import { World, distance } from "../../src/world";
import { findPath } from "../../src/navigation";
import { ANCHORS } from "../../src/regions";
async function state(page: Page) {
  return page.evaluate(() => (window as any).__DZ.snapshot());
}
async function seedLegacy(page: Page) {
  const p = createPlayer("arcanista");
  p.level = 3;
  syncPoints(p);
  p.hp = stats(p).maxHp;
  p.mp = stats(p).maxMp;
  p.x = 22;
  p.y = 8.2;
  p.inventory.push("runa");
  p.challenges.seal = true;
  const old = JSON.parse(
    serialize(
      p,
      { stage: 2, kills: 4, rewardClaimed: true },
      ["chest-8-16"],
      [0, 1, 2, 3],
    ),
  );
  old.version = 2;
  delete old.exploration;
  await page.addInitScript(
    ({ key, raw }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, raw);
    },
    { key: SAVE_KEY, raw: JSON.stringify(old) },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
}
async function aim(page: Page, p: { x: number; y: number }) {
  const at = await page.evaluate((p) => (window as any).__DZ.project(p), p),
    box = (await page.locator("#game").boundingBox())!;
  await page.mouse.move(
    box.x + (at.x * box.width) / 960,
    box.y + ((at.y - 28) * box.height) / 540,
  );
}
async function sustain(page: Page) {
  const s = await state(page);
  expect(s.player.hp).toBeGreaterThan(0);
  if (s.player.hp < s.stats.maxHp * 0.65 && s.player.potions[0])
    await page.keyboard.press("z");
  if (s.player.mp < 45 && s.player.potions[1]) await page.keyboard.press("x");
  if (s.player.hp < s.stats.maxHp * 0.5 && s.player.potions[2])
    await page.keyboard.press("v");
}
async function travel(page: Page, target: { x: number; y: number }) {
  const initial = await state(page),
    world = new World(initial.region);
  const planned = findPath(world, initial.player, target, 0.45);
  const route: { x: number; y: number }[] = [];
  let from = initial.player;
  for (const next of planned) {
    const length = distance(from, next),
      steps = Math.ceil(length / 0.45);
    for (let i = 1; i <= steps; i++)
      route.push({
        x: from.x + ((next.x - from.x) * i) / steps,
        y: from.y + ((next.y - from.y) * i) / steps,
      });
    from = next;
  }
  expect(route.length, `route to ${target.x},${target.y}`).toBeGreaterThan(0);
  for (const next of route) {
    for (let i = 0; i < 150; i++) {
      await sustain(page);
      const s = await state(page);
      expect(new World(s.region).blocked(s.player)).toBe(false);
      const dx = next.x - s.player.x,
        dy = next.y - s.player.y;
      if (Math.hypot(dx, dy) < 0.16) break;
      const sx = dx - dy,
        sy = dx + dy,
        keys: string[] = [];
      if (Math.abs(sx) > Math.max(Math.abs(sx), Math.abs(sy)) * 0.45)
        keys.push(sx > 0 ? "d" : "a");
      if (Math.abs(sy) > Math.max(Math.abs(sx), Math.abs(sy)) * 0.45)
        keys.push(sy > 0 ? "s" : "w");
      await page.keyboard.down("Shift");
      for (const k of keys) await page.keyboard.down(k);
      await page.waitForTimeout(55);
      for (const k of keys) await page.keyboard.up(k);
      await page.keyboard.up("Shift");
      if (i === 149) throw Error(`Movement stuck near ${next.x},${next.y}`);
    }
  }
}
async function clearGuardian(page: Page, id: number) {
  for (let i = 0; i < 40; i++) {
    await sustain(page);
    const s = await state(page),
      guardian = s.enemies.find((e: any) => e.id === id);
    if (guardian.hp <= 0) return;
    const target =
      s.enemies
        .filter((e: any) => e.hp > 0 && distance(e, s.player) < 7)
        .sort(
          (a: any, b: any) => distance(a, s.player) - distance(b, s.player),
        )[0] ?? guardian;
    await aim(page, target);
    if (s.player.cooldowns[0] === 0 && s.player.mp >= 20)
      await page.keyboard.press("1");
    else if (s.player.cooldowns[1] === 0 && s.player.mp >= 30)
      await page.keyboard.press("2");
    else {
      await page.mouse.down();
      await page.waitForTimeout(550);
      await page.mouse.up();
    }
    await page.waitForTimeout(180);
  }
  throw Error("Guardian not defeated");
}
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
    return dz.project(dz.snapshot().player);
  });
  expect(foot).toEqual({ x: 480, y: 285 });
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
