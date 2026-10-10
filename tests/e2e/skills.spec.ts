import { test, expect, type Page } from "@playwright/test";
import { createPlayer } from "../../src/state";
import { syncPoints } from "../../src/skills";
import { serialize, SAVE_KEY } from "../../src/save";
async function seeded(page: Page, level = 5, safe = false) {
  const p = createPlayer("arcanista");
  p.level = level;
  p.coins = 1000;
  syncPoints(p);
  if (safe) {
    p.x = 3;
    p.y = 3;
  }
  const raw = serialize(
    p,
    { stage: 0, kills: 0, rewardClaimed: false },
    [],
    [],
  );
  await page.addInitScript(
    ({ raw, key }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, raw);
    },
    { raw, key: SAVE_KEY },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
}
async function state(page: Page) {
  return page.evaluate(() => (window as any).__DZ.snapshot());
}
test("Árvore: requisitos exatos, prévia sem gasto, habilidade equipada causa queimadura e persiste", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await seeded(page);
  await page.keyboard.press("k");
  await expect(page.locator(".tree-branch")).toHaveCount(3);
  await page.locator('[data-node="arcanista-0-14"]').click();
  await expect(page.locator(".tree-requirements")).toContainText("Nível 60");
  await expect(page.locator('[data-tree-action="learn"]')).toBeDisabled();
  await page.locator('[data-node="arcanista-0-0"]').click();
  const before = (await state(page)).player.skillPoints;
  await page.locator('[data-tree-action="preview"]').click();
  await expect(page.locator("#skill-preview-canvas")).toBeVisible();
  expect((await state(page)).player.skillPoints).toBe(before);
  await page.screenshot({ path: "artifacts/skill-tree.png" });
  await page.locator('[data-tree-action="learn"]').click();
  await page.locator('[data-tree-action="assign-2"]').click();
  expect((await state(page)).player.skillPoints).toBe(before - 1);
  await page.keyboard.press("Escape");
  const enemy = (await state(page)).enemies[0];
  const at = await page.evaluate((e) => (window as any).__DZ.project(e), enemy),
    box = await page.locator("#game").boundingBox();
  await page.mouse.move(
    box!.x + (at.x * box!.width) / 960,
    box!.y + ((at.y - 28) * box!.height) / 540,
  );
  await page.keyboard.press("3");
  await expect
    .poll(async () =>
      Object.values((await state(page)).skills.statuses)
        .flat()
        .some((s: any) => s.kind === "burn"),
    )
    .toBe(true);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "SALVAR PROGRESSO" }).click();
  await page.reload();
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  expect((await state(page)).player.trees.arcanista.bar[2]).toBe(
    "arcanista-0-0",
  );
  expect((await state(page)).player.trees.arcanista.nodes).toContain(
    "arcanista-0-0",
  );
  expect(errors).toEqual([]);
});
test("Builds: redistribuição por moeda, comparação e restauração fora de combate", async ({
  page,
}) => {
  await seeded(page, 25, true);
  await page.keyboard.press("k");
  await page.locator('[data-node="arcanista-0-0"]').click();
  await page.locator('[data-tree-action="learn"]').click();
  await page.locator('[data-tree-action="assign-2"]').click();
  await page.locator('[data-tree-action="save-0"]').click();
  await page.locator('[data-tree-action="respec"]').click();
  await page.locator('[data-tree-action="confirm-respec"]').click();
  let s = await state(page);
  expect(s.player.skillPoints).toBe(24);
  expect(s.player.coins).toBe(850);
  await expect(page.locator(".build-presets")).toContainText("+1 nós");
  await page.locator('[data-tree-action="load-0"]').click();
  s = await state(page);
  expect(s.player.skillPoints).toBe(23);
  expect(s.player.coins).toBe(700);
  expect(s.player.trees.arcanista.bar[2]).toBe("arcanista-0-0");
});
test("Árvore em celular mantém seleção e ações acessíveis sem overflow horizontal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seeded(page, 5, true);
  await page.keyboard.press("k");
  await page.locator('[data-node="arcanista-0-0"]').click();
  await expect(page.locator('[data-tree-action="learn"]')).toBeVisible();
  await page.locator('[data-tree-action="preview"]').click();
  await page.screenshot({ path: "artifacts/skill-tree-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const bounds = await page.locator(".tree-detail").boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
});
