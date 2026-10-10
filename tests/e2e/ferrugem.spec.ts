import { test, expect, type Page } from "@playwright/test";
import { createPlayer, stats } from "../../src/state";
import { freshExploration } from "../../src/regions";
import { serialize, SAVE_KEY } from "../../src/save";
import { syncPoints } from "../../src/skills";
import { state, travel, clearGuardian } from "./region-helpers";

async function seed(page: Page, memories = true) {
  const p = createPlayer("arcanista");
  p.level = 4;
  syncPoints(p);
  p.inventory.push("runa");
  p.equipment.weapon = "runa";
  p.hp = stats(p).maxHp;
  p.mp = stats(p).maxMp;
  p.x = 23;
  p.y = 18;
  const e = freshExploration();
  e.region = "kharn";
  e.campaign = {
    accepted: true,
    entered: true,
    attuned: ["vigia", "canal", "memoria"],
    rewardClaimed: memories,
  };
  e.regions.kharn.killed = [100, 101, 102, 103, 104, 105];
  const raw = JSON.parse(
    serialize(p, { stage: 2, kills: 3, rewardClaimed: true }, [], [], e),
  );
  raw.version = 3;
  delete raw.exploration.regions.ferrugem;
  for (const key of [
    "visited",
    "knownPassages",
    "unlocked",
    "bosses",
    "changes",
    "journal",
  ])
    delete raw.exploration[key];
  await page.addInitScript(
    ({ key, raw }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, raw);
    },
    { key: SAVE_KEY, raw: JSON.stringify(raw) },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
}
async function use(page: Page, interaction: string) {
  const s = await state(page);
  const target = s.pointsOfInterest.find(
    (p: any) => p.interaction === interaction,
  );
  expect(target).toBeTruthy();
  await travel(page, target);
  await page.keyboard.press("f");
}
test("Ferrugem: campanha, duas secundárias, chefe real, atalhos, comércio e retorno após reload", async ({
  page,
}) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await seed(page);
  await page.keyboard.press("f");
  await expect.poll(async () => (await state(page)).region).toBe("ferrugem");
  await expect(page.locator("#quest-objective")).toContainText("Elcio");
  await expect
    .poll(async () => (await state(page)).audio.region)
    .toBe("industrial");
  expect(
    await page.evaluate(
      (key) => !!localStorage.getItem(`${key}:backup:v3`),
      SAVE_KEY,
    ),
  ).toBe(true);
  await use(page, "elcio");
  await page
    .getByRole("button", { name: "ACEITAR: Vozes no Depósito", exact: true })
    .click();
  await page
    .getByRole("button", { name: "ACEITAR: Uma Ponte para Casa", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await use(page, "crank");
  await use(page, "bridge");
  expect((await state(page)).exploration.journal.completed).toContain("bridge");
  await use(page, "gear");
  await clearGuardian(page, 200);
  await use(page, "worker-log");
  await travel(page, { x: 10, y: 12 });
  await clearGuardian(page, 204);
  await use(page, "nara");
  await page.keyboard.press("Escape");
  await use(page, "elcio");
  expect((await state(page)).exploration.changes).toContain("merchant");
  const coins = (await state(page)).player.coins;
  await page.getByRole("button", { name: "COMPRAR POÇÃO · 50 MOEDAS" }).click();
  expect((await state(page)).player.coins).toBe(coins - 50);
  await page.keyboard.press("Escape");
  await use(page, "fuse");
  await clearGuardian(page, 201);
  await use(page, "pump");
  expect((await state(page)).exploration.changes).toContain("pump");
  await page.reload();
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  expect((await state(page)).exploration.changes).toEqual(
    expect.arrayContaining(["pump", "bridge", "merchant"]),
  );
  await use(page, "manifest");
  await clearGuardian(page, 202);
  await travel(page, { x: 21, y: 9 });
  await clearGuardian(page, 203);
  expect((await state(page)).exploration.bosses).toContain("ferrugem:203");
  await page.screenshot({ path: "artifacts/ferrugem-fornalha.png" });
  await use(page, "elcio");
  const finished = await state(page);
  expect(finished.exploration.journal.completed).toEqual(
    expect.arrayContaining(["machines", "workers", "bridge"]),
  );
  expect(finished.player.inventory).toContain("anel-cobre");
  await page.keyboard.press("Escape");
  await page.keyboard.press("j");
  await expect(page.locator('[data-mission="machines"]')).toContainText(
    "CONCLUÍDA",
  );
  await page.screenshot({ path: "artifacts/ferrugem-missoes.png" });
  await page.keyboard.press("Escape");
  await page.screenshot({ path: "artifacts/ferrugem-patio.png" });
  await travel(page, { x: 4, y: 22 });
  await page.keyboard.press("f");
  await expect.poll(async () => (await state(page)).region).toBe("kharn");
  await page.keyboard.press("f");
  await expect.poll(async () => (await state(page)).region).toBe("ferrugem");
  await page.reload();
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  const restored = await state(page);
  expect(restored.enemies.find((e: any) => e.id === 203).hp).toBe(0);
  expect(restored.player.coins).toBe(finished.player.coins);
  expect(
    restored.player.inventory.filter((id: string) => id === "anel-cobre"),
  ).toHaveLength(1);
  expect(
    restored.pointsOfInterest.find((p: any) => p.interaction === "nara").x,
  ).toBe(7.5);
  expect(errors).toEqual([]);
});
test("Estrada bloqueada explica as memórias faltantes e preserva Kharn", async ({
  page,
}) => {
  await seed(page, false);
  await page.keyboard.press("f");
  expect((await state(page)).region).toBe("kharn");
  await expect(page.locator("#toast")).toContainText(
    "Entregue as três memórias",
  );
  expect((await state(page)).exploration.visited).not.toContain("ferrugem");
});
