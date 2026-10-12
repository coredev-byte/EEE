import { test, expect, type Page } from "@playwright/test";
import { createPlayer, stats, equip } from "../../src/state";
import { syncPoints } from "../../src/skills";
import { freshExploration } from "../../src/regions";
import { freshChapter, CHAPTER_ID } from "../../src/chapter-data";
import { COLLISION } from "../../src/spatial";
import { World, distance } from "../../src/world";
import { findPath } from "../../src/navigation";
import { patternHits, type BossAttack } from "../../src/chapter-boss";
import { serialize, SAVE_KEY } from "../../src/save";
import { state, aim, sustain } from "./region-helpers";
const early = [
  "talk:lenir",
  "ash-record",
  "talk:witness",
  "defeat:300",
  "bizel-record",
  "report:lenir",
  "enter:ruins",
];
const prepared = [
  ...early,
  "ruins-record",
  "defeat:301",
  "prism-blue",
  "oath",
  "defeat:302",
  "prism-violet",
  "core-record",
];
async function seed(page: Page, id = "arcanista", ready = false) {
  const p = createPlayer(id as any);
  p.level = 5;
  syncPoints(p);
  equip(p, "brasa");
  p.hp = stats(p).maxHp;
  p.mp = stats(p).maxMp;
  const e = freshExploration();
  e.chapter = freshChapter();
  e.campaign = {
    accepted: true,
    entered: true,
    attuned: ["vigia", "canal", "memoria"],
    rewardClaimed: true,
  };
  e.visited = ["pedralta", "kharn"];
  e.regions.pedralta.killed = [0, 1, 2];
  e.regions.kharn.killed = [100, 102, 104];
  if (ready) {
    e.region = "ruins";
    e.visited.push("ruins");
    e.chapter.checkpoint = true;
    e.journal.events = [...prepared];
    e.journal.accepted = [CHAPTER_ID];
    e.changes = ["prism-blue", "prism-violet"];
    e.regions.ruins.killed = [301, 302, 303, 304];
    p.x = 14;
    p.y = 12;
  } else {
    p.x = 11;
    p.y = 15;
  }
  await page.addInitScript(
    ({ key, raw }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, raw);
    },
    {
      key: SAVE_KEY,
      raw: serialize(p, { stage: 2, kills: 3, rewardClaimed: true }, [], [], e),
    },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
}
async function skip(page: Page) {
  await expect(page.locator(".skip-cinematic")).toBeVisible();
  await page.locator(".skip-cinematic").click();
  await page.waitForTimeout(100);
}
async function move(page: Page, target: { x: number; y: number }, ms = 80) {
  const s = await state(page),
    dx = target.x - s.player.x,
    dy = target.y - s.player.y,
    sx = dx - dy,
    sy = dx + dy,
    keys: string[] = [];
  if (Math.hypot(dx, dy) < 0.12) return;
  if (Math.abs(sx) > Math.max(Math.abs(sx), Math.abs(sy)) * 0.35)
    keys.push(sx > 0 ? "d" : "a");
  if (Math.abs(sy) > Math.max(Math.abs(sx), Math.abs(sy)) * 0.35)
    keys.push(sy > 0 ? "s" : "w");
  await page.keyboard.down("Shift");
  for (const k of keys) await page.keyboard.down(k);
  await page.waitForTimeout(ms);
  for (const k of keys) await page.keyboard.up(k);
  await page.keyboard.up("Shift");
}
async function travel(page: Page, target: { x: number; y: number }) {
  const initial = await state(page),
    w = new World(initial.region);
  w.applyChanges(initial.exploration.changes);
  const safeStart = w.nearestFree(initial.player, 0.5),
    safeEnd = w.nearestFree(target, 0.5);
  const prefix =
    distance(initial.player, safeStart) > 0.15
      ? findPath(w, initial.player, safeStart, COLLISION.player)
      : [];
  const middle = findPath(w, safeStart, safeEnd, 0.5);
  const end = w.nearestFree(target);
  const suffix =
    distance(safeEnd, end) > 0.15
      ? findPath(w, safeEnd, end, COLLISION.player)
      : [];
  const planned = [...prefix, ...middle, ...suffix];
  expect(planned.length).toBeGreaterThan(0);
  const route: { x: number; y: number }[] = [];
  let from = initial.player;
  for (const to of planned) {
    const steps = Math.max(1, Math.ceil(distance(from, to) / 0.25));
    for (let i = 1; i <= steps; i++)
      route.push({
        x: from.x + ((to.x - from.x) * i) / steps,
        y: from.y + ((to.y - from.y) * i) / steps,
      });
    from = to;
  }
  for (const at of route) {
    for (let i = 0; i < 100; i++) {
      const s = await state(page);
      if (s.chapter.scene) {
        await skip(page);
        continue;
      }
      await sustain(page);
      const threat = s.enemies
        .filter(
          (e: any) => e.hp > 0 && !e.dormant && distance(e, s.player) < 2.5,
        )
        .sort(
          (a: any, b: any) => distance(a, s.player) - distance(b, s.player),
        )[0];
      if (threat) {
        await fight(page, threat.id);
        return travel(page, target);
      }
      if (distance(s.player, at) < 0.16) break;
      await move(page, at, 60);
      if (i === 99) throw Error(`Rota bloqueada ${at.x},${at.y}`);
    }
  }
}
function safePoint(w: World, a: BossAttack, p: { x: number; y: number }) {
  const candidates = [];
  for (let y = 3; y <= 8; y += 0.5)
    for (let x = 10; x <= 18; x += 0.5) {
      const at = { x, y };
      if (!w.blocked(at, 0.24) && !patternHits(a, at)) candidates.push(at);
    }
  return candidates.sort((u, v) => distance(u, p) - distance(v, p))[0];
}
async function fight(page: Page, enemyId: number) {
  const phases = new Set<number>();
  for (let i = 0; i < 650; i++) {
    const s = await state(page);
    if (s.chapter.scene) {
      await skip(page);
      continue;
    }
    const e = s.enemies.find((e: any) => e.id === enemyId);
    if (e.hp <= 0) return phases;
    expect(
      s.player.hp,
      "Personagem deve sobreviver aos padrões anunciados",
    ).toBeGreaterThan(0);
    phases.add(e.phase ?? 1);
    await sustain(page);
    const w = new World(s.region);
    w.applyChanges(s.exploration.changes);
    const a = e.bossAttack as BossAttack | undefined;
    if (!w.segmentClear(s.player, e, 0.04, false)) {
      const route = findPath(w, s.player, w.nearestFree(e), COLLISION.player);
      const at = route.find((at) => distance(at, s.player) > 0.15);
      if (at) {
        const d = distance(at, s.player),
          ratio = Math.min(0.25, d) / d;
        await move(
          page,
          {
            x: s.player.x + (at.x - s.player.x) * ratio,
            y: s.player.y + (at.y - s.player.y) * ratio,
          },
          90,
        );
        continue;
      }
    }
    if (enemyId === 310 && a && a.remaining > 0.1 && patternHits(a, s.player)) {
      const target = safePoint(w, a, s.player);
      expect(target).toBeTruthy();
      await move(page, target, 110);
      continue;
    }
    if (
      ["guerreiro", "assassino"].includes(s.player.classId) &&
      distance(e, s.player) > 1.35 &&
      !a
    ) {
      await move(page, e, 100);
      continue;
    }
    await aim(page, e);
    if (s.player.cooldowns[0] === 0 && s.player.mp >= 20)
      await page.keyboard.press("1");
    else if (s.player.cooldowns[1] === 0 && s.player.mp >= 35)
      await page.keyboard.press("2");
    else {
      await page.mouse.down();
      await page.mouse.up();
    }
    await page.waitForTimeout(150);
  }
  throw Error(`Chefe ${enemyId} não foi derrotado`);
}
for (const id of ["guerreiro", "arcanista", "assassino", "atirador"])
  test(`Kharn com ${id}: três fases, desfecho, recompensa e reload`, async ({
    page,
  }) => {
    test.setTimeout(200000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await seed(page, id, true);
    await travel(page, { x: 14, y: 11 });
    await page.keyboard.press("f");
    await expect
      .poll(async () => (await state(page)).chapter.scene)
      .toBe("kharn-intro");
    const before = await state(page);
    await page.keyboard.press("1");
    await page.keyboard.press("z");
    expect((await state(page)).player.potions).toEqual(before.player.potions);
    await skip(page);
    await expect(page.locator(".boss-hud")).toBeVisible();
    const phases = await fight(page, 310);
    expect([...phases]).toEqual(expect.arrayContaining([1, 2, 3]));
    await expect
      .poll(async () => (await state(page)).chapter.state.arena)
      .toBe("cleared");
    const after = await state(page);
    expect(after.exploration.journal.completed).toContain(CHAPTER_ID);
    expect(
      after.player.inventory.filter((id: string) => id === "selo-vigia"),
    ).toHaveLength(1);
    await expect(page.locator(".boss-hud")).toBeHidden();
    await page.reload();
    await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
    expect((await state(page)).chapter.state.arena).toBe("cleared");
    expect((await state(page)).player.coins).toBe(after.player.coins);
    expect((await state(page)).enemies.find((e: any) => e.id === 310).hp).toBe(
      0,
    );
    expect(errors).toEqual([]);
  });
test("Percurso real: Lenir, Bizel, investigação, prismas, atalho, arena e estrada", async ({
  page,
}) => {
  test.setTimeout(300000);
  await seed(page);
  await page.keyboard.press("f");
  await expect(page.locator(".dialogue-panel")).toContainText(
    "registro chamuscado",
  );
  await page.keyboard.press("Escape");
  await travel(page, { x: 12, y: 17 });
  await page.keyboard.press("f");
  expect((await state(page)).exploration.journal.events).toContain(
    "ash-record",
  );
  await travel(page, { x: 10, y: 14 });
  await page.keyboard.press("f");
  await expect(page.locator(".dialogue-panel")).toContainText("Bizel");
  await page.keyboard.press("Escape");
  await travel(page, { x: 23, y: 20 });
  await fight(page, 300);
  await travel(page, { x: 22, y: 19 });
  await page.keyboard.press("f");
  expect((await state(page)).exploration.journal.events).toContain(
    "bizel-record",
  );
  await travel(page, { x: 11, y: 15 });
  await page.keyboard.press("f");
  await page.keyboard.press("Escape");
  expect((await state(page)).exploration.journal.events).toContain(
    "report:lenir",
  );
  await travel(page, { x: 22, y: 7 });
  await page.keyboard.press("f");
  await expect.poll(async () => (await state(page)).region).toBe("kharn");
  await travel(page, { x: 25, y: 6 });
  await page.keyboard.press("f");
  await expect.poll(async () => (await state(page)).region).toBe("ruins");
  await travel(page, { x: 12, y: 23 });
  await page.keyboard.press("f");
  expect((await state(page)).exploration.journal.events).toContain(
    "ruins-record",
  );
  await travel(page, { x: 5, y: 21 });
  await fight(page, 301);
  await travel(page, { x: 5, y: 20 });
  await page.keyboard.press("f");
  expect((await state(page)).exploration.changes).toContain("prism-blue");
  await travel(page, { x: 6, y: 21 });
  await page.keyboard.press("f");
  await page.reload();
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  expect((await state(page)).exploration.journal.events).toContain("oath");
  await travel(page, { x: 14, y: 15 });
  await fight(page, 303);
  await fight(page, 304);
  await travel(page, { x: 23, y: 16 });
  await fight(page, 302);
  await travel(page, { x: 23, y: 15 });
  await page.keyboard.press("f");
  expect((await state(page)).exploration.changes).toContain("prism-violet");
  await travel(page, { x: 22, y: 16 });
  await page.keyboard.press("f");
  expect((await state(page)).exploration.journal.events).toContain(
    "core-record",
  );
  await travel(page, { x: 17, y: 16 });
  await page.keyboard.press("f");
  expect((await state(page)).exploration.changes).toContain("ruins-shortcut");
  await travel(page, { x: 14, y: 12 });
  await page.keyboard.press("f");
  await travel(page, { x: 14, y: 11 });
  await page.keyboard.press("f");
  await skip(page);
  await fight(page, 310);
  await travel(page, { x: 14, y: 25 });
  await page.keyboard.press("f");
  await expect.poll(async () => (await state(page)).region).toBe("kharn");
  await travel(page, { x: 24, y: 18 });
  const coins = (await state(page)).player.coins;
  await page.keyboard.press("f");
  await expect.poll(async () => (await state(page)).region).toBe("ferrugem");
  expect((await state(page)).player.coins).toBe(coins);
});
test("Morte e retry no checkpoint, apresentação assistida pulável e sem prêmio duplicado", async ({
  page,
}) => {
  test.setTimeout(100000);
  await seed(page, "arcanista", true);
  await travel(page, { x: 14, y: 11 });
  await page.keyboard.press("f");
  await skip(page);
  for (let i = 0; i < 500; i++) {
    const s = await state(page);
    if (s.player.hp === 0) break;
    await page.waitForTimeout(100);
  }
  await expect(
    page.getByRole("button", { name: "DESPERTAR NA FONTE DAS RUÍNAS" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "DESPERTAR NA FONTE DAS RUÍNAS" })
    .click();
  const s = await state(page);
  expect(s.region).toBe("ruins");
  expect(s.player).toMatchObject({ x: 14, y: 12 });
  expect(s.exploration.changes).toContain("prism-violet");
  expect(s.enemies.find((e: any) => e.id === 310).hp).toBe(720);
  await travel(page, { x: 14, y: 11 });
  await page.keyboard.press("f");
  await skip(page);
  expect((await state(page)).chapter.fighting).toBe(true);
});

test("Sair durante a apresentação de Kharn devolve o tema da capa e retoma a cena", async ({
  page,
}) => {
  await seed(page, "arcanista", true);
  await travel(page, { x: 14, y: 11 });
  await page.keyboard.press("f");
  await expect(page.locator(".skip-cinematic")).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "MENU PRINCIPAL", exact: true })
    .click();
  await expect.poll(async () => (await state(page)).audio.music).toBe("menu");
  await expect
    .poll(async () => (await state(page)).audio.loopLevels["title-theme"])
    .toBeGreaterThan(0.01);
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  await expect
    .poll(async () => (await state(page)).chapter.scene)
    .toBe("kharn-intro");
  await skip(page);
  expect((await state(page)).chapter.fighting).toBe(true);
});
