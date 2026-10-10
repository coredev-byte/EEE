import { test, expect, type Page } from "@playwright/test";
import { World, distance } from "../../src/world";
async function state(page: Page): Promise<any> {
  return page.evaluate(() => (window as any).__DZ.snapshot());
}
async function start(page: Page, id = "guerreiro") {
  await page.goto("/");
  await page.getByRole("button", { name: "INICIAR JORNADA" }).click();
  if (id !== "guerreiro") await page.locator(`[data-class="${id}"]`).click();
  await page.getByRole("button", { name: "ENTRAR EM PEDRALTA →" }).click();
  await expect(page.locator("#hud")).toHaveClass("hud visible");
}
async function aim(page: Page, p: { x: number; y: number }) {
  const s = await page.evaluate((p) => (window as any).__DZ.project(p), p);
  const box = await page.locator("#game").boundingBox();
  await page.mouse.move(
    box!.x + (s.x * box!.width) / 960,
    box!.y + ((s.y - 20) * box!.height) / 540,
  );
}
async function battle(page: Page, minKills = 3) {
  for (let i = 0; i < 40; i++) {
    const s = await state(page);
    if (s.quest.kills >= minKills) return;
    expect(s.player.hp).toBeGreaterThan(0);
    const e = s.enemies
      .filter((e: any) => e.hp > 0)
      .sort(
        (a: any, b: any) => distance(a, s.player) - distance(b, s.player),
      )[0];
    await aim(page, e);
    if (s.player.hp < s.stats.maxHp * 0.6 && s.player.potions[0])
      await page.keyboard.press("z");
    if (s.player.mp < 40 && s.player.potions[1]) await page.keyboard.press("x");
    if (s.player.cooldowns[0] === 0) await page.keyboard.press("1");
    else if (s.player.cooldowns[1] === 0) await page.keyboard.press("2");
    else {
      await page.mouse.down();
      await page.mouse.up();
    }
    await page.waitForTimeout(540);
  }
  throw new Error("Combat did not reach the intended kill count");
}
function route(from: { x: number; y: number }, to: { x: number; y: number }) {
  const world = new World(),
    step = 0.5,
    key = (x: number, y: number) => `${x},${y}`;
  const start = {
    x: Math.round(from.x / step) * step,
    y: Math.round(from.y / step) * step,
  };
  const open = [start];
  const costs = new Map([[key(start.x, start.y), 0]]);
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  let end = "";
  for (let loops = 0; open.length && loops < 10000; loops++) {
    open.sort(
      (a, b) =>
        costs.get(key(a.x, a.y))! +
        distance(a, to) -
        (costs.get(key(b.x, b.y))! + distance(b, to)),
    );
    const n = open.shift()!,
      nk = key(n.x, n.y);
    if (visited.has(nk)) continue;
    visited.add(nk);
    if (distance(n, to) < 0.55) {
      end = nk;
      break;
    }
    for (const [dx, dy] of [
      [step, 0],
      [-step, 0],
      [0, step],
      [0, -step],
      [step, step],
      [step, -step],
      [-step, step],
      [-step, -step],
    ]) {
      const p = { x: n.x + dx, y: n.y + dy };
      if (
        world.blocked(p, 0.3) ||
        world.blocked({ x: n.x + dx / 2, y: n.y + dy / 2 }, 0.3)
      )
        continue;
      const pk = key(p.x, p.y),
        cost = costs.get(nk)! + Math.hypot(dx, dy);
      if (cost < (costs.get(pk) ?? Infinity)) {
        costs.set(pk, cost);
        prev.set(pk, nk);
        open.push(p);
      }
    }
  }
  if (!end) throw new Error("No path");
  const path = [];
  while (end !== key(start.x, start.y)) {
    const [x, y] = end.split(",").map(Number);
    path.unshift({ x, y });
    end = prev.get(end)!;
  }
  return path;
}
async function travel(page: Page, to: { x: number; y: number }) {
  const path = route((await state(page)).player, to);
  for (const point of path) {
    let count = 0;
    while (count++ < 15) {
      const s = await state(page);
      const p = s.player;
      if (distance(p, point) < 0.15) break;
      if (p.hp < s.stats.maxHp * 0.5 && p.potions[0])
        await page.keyboard.press("z");
      const dx = point.x - p.x,
        dy = point.y - p.y,
        sx = dx - dy,
        sy = (dx + dy) * 0.5;
      const keys: string[] = [];
      if (Math.abs(sx) > 0.07) keys.push(sx > 0 ? "d" : "a");
      if (Math.abs(sy) > 0.07) keys.push(sy > 0 ? "s" : "w");
      for (const k of keys) await page.keyboard.down(k);
      await page.keyboard.down("Shift");
      await page.waitForTimeout(45);
      for (const k of keys) await page.keyboard.up(k);
      await page.keyboard.up("Shift");
    }
  }
  expect(distance((await state(page)).player, to)).toBeLessThan(1.5);
}
test("Inicialização, arte carregada e movimento nas quatro orientações", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  for (const [key, dir] of [
    ["w", "back"],
    ["d", "right"],
    ["s", "front"],
    ["a", "left"],
  ]) {
    await page.keyboard.down(key);
    await page.waitForTimeout(150);
    const s = await state(page);
    expect(s.player.direction).toBe(dir);
    expect(s.player.action).toBe("walk");
    expect(s.player.mp).toBe(s.stats.maxMp);
    await page.keyboard.up(key);
  }
  await page.keyboard.press("Escape");
  const s = await state(page);
  expect(distance(s.player, { x: 12, y: 12 })).toBeLessThan(0.3);
  expect(errors).toEqual([]);
  await page.screenshot({ path: "artifacts/orientations.png", fullPage: true });
});
test("Inventário, comparação, equipamento, classes e persistência real", async ({
  page,
}) => {
  await start(page);
  await page.keyboard.press("i");
  expect((await state(page)).paused).toBe(true);
  await page.locator('[data-equip="brasa"]').click();
  expect((await state(page)).stats.attack).toBe(46);
  await expect(page.locator(".attributes")).toContainText("46");
  await page.locator('[data-unequip="weapon"]').click();
  expect((await state(page)).stats.attack).toBe(30);
  await page.locator('[data-equip="raio"]').click();
  await page.screenshot({ path: "artifacts/inventory.png", fullPage: true });
  await page.keyboard.press("Escape");
  await page.keyboard.press("c");
  await page.locator('[data-class="atirador"]').click();
  expect((await state(page)).player.classId).toBe("atirador");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  const s = await state(page);
  expect(s.player.equipment.weapon).toBe("raio");
  expect(s.player.classId).toBe("atirador");
  await expect(page.locator("#class-name")).toContainText("ATIRADOR");
});
test("Combate real, XP, desbloqueios, minimapa, baú e missão concluída", async ({
  page,
}) => {
  test.setTimeout(90000);
  await start(page, "arcanista");
  await battle(page, 4);
  const after = await state(page);
  expect(after.player.level).toBeGreaterThan(1);
  expect(after.quest.kills).toBeGreaterThanOrEqual(4);
  expect(after.player.coins).toBeGreaterThan(125);
  await page.keyboard.press("k");
  await page
    .getByRole("button", { name: "DESBLOQUEAR PRÓXIMA HABILIDADE" })
    .click();
  expect((await state(page)).player.unlocked).toBe(3);
  await page.keyboard.press("Escape");
  await travel(page, { x: 8, y: 16 });
  await page.keyboard.press("f");
  expect((await state(page)).player.inventory).toContain("couraça");
  await page.keyboard.press("i");
  await page.locator('[data-equip="couraça"]').click();
  await page.keyboard.press("Escape");
  await travel(page, { x: 22, y: 7 });
  await page.keyboard.press("f");
  const completed = await state(page);
  expect(completed.quest.stage).toBe(2);
  expect(completed.player.inventory).toContain("runa");
  await page.keyboard.press("j");
  await expect(page.locator(".completed-banner")).toContainText(
    "MISSÃO CONCLUÍDA",
  );
  await page.screenshot({
    path: "artifacts/quest-complete.png",
    fullPage: true,
  });
  await page.reload();
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  expect((await state(page)).quest.stage).toBe(2);
  expect((await state(page)).player.inventory).toContain("runa");
});
test("HUD de recargas e poções, configurações e pausa", async ({ page }) => {
  await start(page);
  await page.keyboard.press("1");
  await page.waitForTimeout(180);
  expect((await state(page)).player.mp).toBeLessThan(120);
  await expect(page.locator(".cooldown-count")).toHaveCount(1);
  await page.keyboard.press("x");
  expect((await state(page)).player.potions[1]).toBe(2);
  await page.keyboard.press("m");
  const before = (await state(page)).player;
  await page.waitForTimeout(300);
  expect((await state(page)).player).toEqual(before);
  await page.getByRole("button", { name: "DESLIGADO", exact: true }).count();
  await page.getByRole("button", { name: "LIGADO", exact: true }).click();
  await expect(page.locator("#sound-toggle")).toContainText("OFF");
  await page.keyboard.press("Escape");
  expect((await state(page)).paused).toBe(false);
});
test("Renderização em telas menores sem erros ou scroll horizontal", async ({
  page,
}) => {
  await start(page);
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 800, height: 680 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "artifacts/tablet.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });
});

test("Dano, animação de morte e retorno à vila", async ({ page }) => {
  test.setTimeout(45000);
  await start(page, "arcanista");
  await expect
    .poll(async () => (await state(page)).player.hp, { timeout: 30000 })
    .toBe(0);
  await expect(
    page.getByRole("button", { name: "DESPERTAR EM PEDRALTA" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "DESPERTAR EM PEDRALTA" }),
  ).toBeVisible();
  const dead = await state(page);
  expect(dead.player.action).toBe("dead");
  await page.screenshot({ path: "artifacts/death.png", fullPage: true });
  await page.getByRole("button", { name: "DESPERTAR EM PEDRALTA" }).click();
  const alive = await state(page);
  expect(alive.player.hp).toBe(alive.stats.maxHp);
  expect(alive.player.coins).toBe(100);
  expect(alive.player.x).toBe(12);
  expect(alive.paused).toBe(false);
});
