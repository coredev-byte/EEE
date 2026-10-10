import { expect, type Page } from "@playwright/test";
import { createPlayer, stats } from "../../src/state";
import { syncPoints } from "../../src/skills";
import { serialize, SAVE_KEY } from "../../src/save";
import { World, distance } from "../../src/world";
import { findPath } from "../../src/navigation";
export async function state(page: Page) {
  return page.evaluate(() => (window as any).__DZ.snapshot());
}
export async function seedLegacy(page: Page) {
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
export async function aim(page: Page, p: { x: number; y: number }) {
  const at = await page.evaluate((p) => (window as any).__DZ.project(p), p),
    box = (await page.locator("#game").boundingBox())!;
  await page.mouse.move(
    box.x + (at.x * box.width) / 960,
    box.y + ((at.y - 28) * box.height) / 540,
  );
}
export async function sustain(page: Page) {
  const s = await state(page);
  expect(s.player.hp).toBeGreaterThan(0);
  if (s.player.hp < s.stats.maxHp * 0.65 && s.player.potions[0])
    await page.keyboard.press("z");
  if (s.player.mp < 45 && s.player.potions[1]) await page.keyboard.press("x");
  if (s.player.hp < s.stats.maxHp * 0.5 && s.player.potions[2])
    await page.keyboard.press("v");
}
export async function travel(page: Page, target: { x: number; y: number }) {
  const initial = await state(page),
    world = new World(initial.region);
  world.applyChanges(initial.exploration.changes);
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
      const actualWorld = new World(s.region);
      actualWorld.applyChanges(s.exploration.changes);
      expect(actualWorld.blocked(s.player)).toBe(false);
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
export async function clearGuardian(page: Page, id: number) {
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
