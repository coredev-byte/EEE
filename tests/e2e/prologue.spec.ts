import { test, expect, type Page } from "@playwright/test";
import { state, travel, aim, sustain } from "./region-helpers";
import { SAVE_KEY } from "../../src/save";
async function start(page: Page, id = "arcanista") {
  await page.goto("/");
  await page.getByRole("button", { name: "INICIAR JORNADA" }).click();
  await page.locator(`[data-class="${id}"]`).click();
  await page.getByRole("button", { name: "ENTRAR EM PEDRALTA →" }).click();
  await expect
    .poll(async () => (await state(page)).prologue.scene)
    .toBe("silence");
}
async function skip(page: Page, count = 1) {
  for (let i = 0; i < count; i++) {
    await expect(page.locator(".skip-cinematic")).toBeVisible();
    await page.locator(".skip-cinematic").click();
    await page.waitForTimeout(100);
  }
}
async function settle(page: Page) {
  if ((await state(page)).prologue.locked) await skip(page);
}
async function battle(page: Page, kills: number) {
  for (let i = 0; i < 100; i++) {
    await settle(page);
    const s = await state(page);
    if (s.quest.kills >= kills) return;
    await sustain(page);
    const enemy = s.enemies
      .filter((e: any) => e.hp > 0)
      .sort(
        (a: any, b: any) =>
          Math.hypot(a.x - s.player.x, a.y - s.player.y) -
          Math.hypot(b.x - s.player.x, b.y - s.player.y),
      )[0];
    await aim(page, enemy);
    if (s.player.cooldowns[0] === 0) await page.keyboard.press("1");
    else if (s.player.cooldowns[1] === 0) await page.keyboard.press("2");
    else {
      await page.mouse.down();
      await page.mouse.up();
    }
    await page.waitForTimeout(300);
  }
  throw Error("Combate não atingiu a meta real");
}
test("Cena interrompida, pause, skip e retomada preservam jogador e objetivos", async ({
  page,
}) => {
  await start(page);
  const initial = await state(page);
  await page.keyboard.down("d");
  await page.keyboard.press("1");
  await page.keyboard.press("f");
  await page.keyboard.press("z");
  await page.waitForTimeout(400);
  await page.keyboard.up("d");
  const locked = await state(page);
  expect(locked.player.x).toBe(initial.player.x);
  expect(locked.player.mp).toBe(initial.player.mp);
  expect(locked.player.potions).toEqual(initial.player.potions);
  expect(locked.quest).toEqual(initial.quest);
  await page.keyboard.press("Escape");
  expect((await state(page)).paused).toBe(true);
  const camera = (await state(page)).camera;
  await page.waitForTimeout(400);
  expect((await state(page)).camera).toEqual(camera);
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  expect((await state(page)).prologue.scene).toBe("silence");
  await skip(page, 3);
  await expect
    .poll(async () => (await state(page)).prologue.locked)
    .toBe(false);
  await expect(page.locator(".tutorial-hint")).toBeVisible();
  await page.keyboard.down("d");
  await page.keyboard.down("Shift");
  await page.waitForTimeout(420);
  await page.keyboard.up("d");
  await page.keyboard.up("Shift");
  expect((await state(page)).prologue.state.moved).toBeGreaterThan(1);
  const saved = (await state(page)).prologue.state;
  await page.reload();
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  expect((await state(page)).prologue.state.scenes).toEqual(saved.scenes);
  expect((await state(page)).prologue.locked).toBe(false);
});
for (const id of ["guerreiro", "arcanista", "assassino", "atirador"])
  test(`Tutorial ${id}: habilidades e mochila usam sistemas reais`, async ({
    page,
  }) => {
    await start(page, id);
    await skip(page, 3);
    const before = await state(page);
    await page.keyboard.press("1");
    await page.waitForTimeout(650);
    await page.keyboard.press("2");
    await page.waitForTimeout(650);
    await settle(page);
    const after = await state(page);
    expect(after.prologue.state.events).toContain("skill:0");
    expect(after.prologue.state.events).toContain("skill:1");
    expect(after.player.mp).toBeLessThan(before.player.mp);
    expect(after.player.classId).toBe(id);
    await page.keyboard.press("x");
    expect((await state(page)).prologue.state.events).toContain("potion");
    await page.keyboard.press("i");
    await page.locator('[data-item="brasa"]').first().click();
    await page.keyboard.press("c");
    await expect(page.locator(".item-comparison")).toBeVisible();
    expect((await state(page)).prologue.state.events).toContain(
      "inventory-action",
    );
    await page.keyboard.press("Escape");
    for (const key of ["j", "c", "k"]) {
      await settle(page);
      await page.keyboard.press(key);
      expect((await state(page)).paused).toBe(true);
      await page.keyboard.press("Escape");
    }
    expect((await state(page)).player.skillPoints).toBeGreaterThanOrEqual(0);
  });
test("Prólogo completo, missão única, primeira passagem e retomada na campanha", async ({
  page,
}) => {
  test.setTimeout(180000);
  await start(page);
  await skip(page, 3);
  await travel(page, { x: 10, y: 14 });
  await page.keyboard.press("f");
  await expect(page.locator(".dialogue-panel")).toContainText(
    "Você também ouviu",
  );
  const frozen = (await state(page)).player;
  await page.keyboard.down("d");
  await page.waitForTimeout(180);
  await page.keyboard.up("d");
  expect((await state(page)).player.x).toBe(frozen.x);
  await page.getByRole("button", { name: "CONTINUAR", exact: true }).click();
  await page.getByRole("button", { name: "CONTINUAR", exact: true }).click();
  await page.getByRole("button", { name: "ACEITAR O CHAMADO" }).click();
  await page.getByRole("button", { name: "VOLTAR À VILA" }).click();
  expect((await state(page)).quest.accepted).toBe(true);
  await battle(page, 3);
  await settle(page);
  await page.keyboard.press("1");
  await page.waitForTimeout(650);
  await page.keyboard.press("2");
  await page.waitForTimeout(650);
  await page.keyboard.press("x");
  await travel(page, { x: 8, y: 16 });
  await page.keyboard.press("f");
  expect((await state(page)).player.inventory).toContain("couraça");
  await page.keyboard.press("i");
  await page.locator('[data-item="couraça"]').first().click();
  await page.keyboard.press("c");
  await page.keyboard.press("Escape");
  for (const key of ["j", "c", "k"]) {
    await page.keyboard.press(key);
    await page.keyboard.press("Escape");
  }
  await travel(page, { x: 22, y: 7 });
  await page.keyboard.press("f");
  await skip(page, 2);
  await expect
    .poll(async () => (await state(page)).prologue.state.complete)
    .toBe(true);
  const completed = await state(page);
  expect(completed.quest.rewardClaimed).toBe(true);
  expect(
    completed.player.inventory.filter((id: string) => id === "runa"),
  ).toHaveLength(1);
  await page.reload();
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  expect((await state(page)).prologue.state.complete).toBe(true);
  const coins = (await state(page)).player.coins;
  await page.keyboard.press("f");
  await expect.poll(async () => (await state(page)).region).toBe("kharn");
  expect((await state(page)).player.coins).toBe(coins);
  const raw = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(raw.version).toBe(4);
  expect(raw.prologue.complete).toBe(true);
});

test("Voltar ao menu durante cena permite iniciar outra jornada", async ({
  page,
}) => {
  await start(page);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "MENU PRINCIPAL", exact: true })
    .click();
  await page.getByRole("button", { name: "NOVA JORNADA", exact: true }).click();
  await expect(page.locator(".class-grid")).toBeVisible();
  await page.locator('[data-class="atirador"]').click();
  await page.getByRole("button", { name: "ENTRAR EM PEDRALTA →" }).click();
  await expect
    .poll(async () => (await state(page)).prologue.scene)
    .toBe("silence");
  expect((await state(page)).player.classId).toBe("atirador");
  expect((await state(page)).quest.kills).toBe(0);
});

test("Legendas acessíveis não são reanunciadas em cada frame e Enter respeita pause", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page);
  await page.waitForTimeout(150);
  await page.evaluate(() => {
    (window as any).__captionMutations = 0;
    new MutationObserver((records) => {
      (window as any).__captionMutations += records.length;
    }).observe(document.querySelector(".cinematic-caption")!, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as any).__captionMutations)).toBe(0);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Enter");
  expect((await state(page)).prologue.state.scenes).toEqual([]);
  expect((await state(page)).paused).toBe(true);
  await page.keyboard.press("Escape");
  await skip(page, 3);
  expect((await state(page)).prologue.locked).toBe(false);
});
