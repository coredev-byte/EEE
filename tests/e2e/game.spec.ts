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
  await skipScenes(page, 3);
  await expect(page.locator("#hud")).toHaveClass("hud visible");
}
async function skipScenes(page: Page, count = 1) {
  for (let i = 0; i < count; i++) {
    await expect(page.locator(".skip-cinematic")).toBeVisible();
    await page.locator(".skip-cinematic").click();
    await page.waitForTimeout(80);
  }
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
    if (s.prologue.locked) {
      await skipScenes(page);
      continue;
    }
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
  await expect.poll(async () => (await state(page)).audio.loaded).toBe(55);
  await page.keyboard.press("i");
  expect((await state(page)).paused).toBe(true);
  await page.locator('[data-item="brasa"]').first().click();
  await page.keyboard.press("c");
  await expect(page.locator(".item-comparison")).toContainText("ATAQUE +12");
  expect((await state(page)).player.equipment.weapon).toBe("ferro");
  await page.keyboard.press("e");
  expect((await state(page)).stats.attack).toBe(46);
  await expect(page.locator(".attributes")).toContainText("46");
  await page.locator('[data-unequip="weapon"]').click();
  expect((await state(page)).stats.attack).toBe(30);
  const sounds = (await state(page)).audio.played.map((x: any) => x.event);
  expect(sounds).toContain("equipment.compare");
  expect(sounds).toContain("equipment.equip");
  expect(sounds).toContain("equipment.remove");
  await page.locator('[data-filter="weapon"]').click();
  await expect(page.locator('.bag-grid [data-item="casaco"]')).toHaveCount(0);
  await page.locator('[data-item="raio"]').first().click();
  await page.locator('[data-equip="raio"]').click();
  await page.locator('[data-filter="all"]').click();
  await page.screenshot({ path: "artifacts/inventory.png", fullPage: true });
  await page.keyboard.press("Escape");
  const portraitBefore = await page
    .locator("#portrait")
    .evaluate((el: HTMLCanvasElement) => el.toDataURL());
  await page.keyboard.press("c");
  await page.locator('[data-class="atirador"]').click();
  expect((await state(page)).player.classId).toBe("atirador");
  await expect(page.locator("#portrait")).toHaveAttribute(
    "data-class-id",
    "atirador",
  );
  const portraitAfter = await page
    .locator("#portrait")
    .evaluate((el: HTMLCanvasElement) => el.toDataURL());
  expect(portraitAfter).not.toBe(portraitBefore);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  const s = await state(page);
  expect(s.player.equipment.weapon).toBe("raio");
  expect(s.player.classId).toBe("atirador");
  await expect(page.locator("#portrait")).toHaveAttribute(
    "data-class-id",
    "atirador",
  );
  expect(
    await page
      .locator("#portrait")
      .evaluate((el: HTMLCanvasElement) => el.toDataURL()),
  ).toBe(portraitAfter);
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
  await page.locator('[data-node="arcanista-base-2"]').click();
  await page
    .getByRole("button", { name: "APRENDER HABILIDADE", exact: true })
    .click();
  await page.locator('[data-tree-action="assign-2"]').click();
  expect((await state(page)).player.unlocked).toBe(3);
  await page.keyboard.press("Escape");
  await travel(page, { x: 8, y: 16 });
  await page.keyboard.press("f");
  expect((await state(page)).player.inventory).toContain("couraça");
  await expect(page.locator("#loot-notifications")).toContainText("Couraça");
  await expect
    .poll(async () =>
      (await state(page)).audio.played.some(
        (x: any) => x.event === "loot.rare",
      ),
    )
    .toBe(true);
  await page.keyboard.press("i");
  await page.locator('[data-item="couraça"]').first().click();
  await page.locator('[data-equip="couraça"]').click();
  await page.keyboard.press("Escape");
  await travel(page, { x: 22, y: 7 });
  await page.keyboard.press("f");
  await skipScenes(page, 2);
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
  const campaignBefore = (await state(page)).player.coins;
  await page.keyboard.press("f");
  await expect.poll(async () => (await state(page)).region).toBe("kharn");
  expect((await state(page)).player.coins).toBe(campaignBefore);
  await page.keyboard.press("f");
  await expect.poll(async () => (await state(page)).region).toBe("pedralta");
  expect((await state(page)).quest.rewardClaimed).toBe(true);
  await page.reload();
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  expect((await state(page)).region).toBe("pedralta");
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
  await page
    .getByRole("button", { name: "SILENCIAR ÁUDIO", exact: true })
    .click();
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

test("Inventário: abas, descarte confirmado, poções e layout móvel", async ({
  page,
}) => {
  await start(page);
  await page.keyboard.press("1");
  await page.waitForTimeout(100);
  await page.keyboard.press("i");
  await page.getByRole("button", { name: "Equipamento", exact: true }).click();
  await expect(page.locator('.bag-grid [data-item="brasa"]')).toHaveCount(0);
  await page
    .getByRole("button", { name: "Inventário", exact: true })
    .last()
    .click();
  await page.locator('.bag-grid [data-item="brasa"]').click();
  await page.keyboard.press("r");
  expect((await state(page)).player.inventory).toContain("brasa");
  await expect(page.locator(".discard-note")).toBeVisible();
  await page.keyboard.press("r");
  expect((await state(page)).player.inventory).not.toContain("brasa");
  await page.locator('[data-filter="potions"]').click();
  await expect(page.locator('.bag-grid [data-item="ferro"]')).toHaveCount(0);
  await page.locator('[data-item="potion-0"]').click();
  await expect(page.locator(".item-pane")).toContainText("Restaura 100");
  await page.getByRole("button", { name: "Habilidades", exact: true }).click();
  await expect(page.locator(".panel-skills")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.keyboard.press("i");
  const panel = await page.locator(".inventory-screen").boundingBox();
  const playerHUD = await page.locator(".player-hud").boundingBox();
  expect(panel!.y).toBeGreaterThan(playerHUD!.y + playerHUD!.height);
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.keyboard.press("i");
  await expect(page.locator(".inventory-screen")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.locator('.bag-grid [data-item="potion-1"]').click();
  await expect(page.locator(".item-pane")).toContainText("Restaura 70");
  await page.keyboard.press("e");
  expect((await state(page)).player.potions[1]).toBe(2);
  expect((await state(page)).player.mp).toBe((await state(page)).stats.maxMp);
  await page.screenshot({
    path: "artifacts/inventory-mobile.png",
    fullPage: true,
  });
  await page.locator(".inventory-close").click();
  expect((await state(page)).paused).toBe(false);
  await page.reload();
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  expect((await state(page)).player.inventory).not.toContain("brasa");
});

test("Clique sem pointermove e viewport/HUD alinhados em tela cheia", async ({
  page,
}) => {
  await start(page);
  for (const viewport of [
    { width: 1000, height: 1000 },
    { width: 1600, height: 650 },
  ]) {
    await page.setViewportSize(viewport);
    await page.keyboard.press("m");
    await page.getByRole("button", { name: "ALTERNAR", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => !!document.fullscreenElement))
      .toBe(true);
    await page.locator(".close-button").click();
    const canvas = await page.locator("#game").boundingBox();
    const hud = await page.locator("#hud").boundingBox();
    const windowSize = await page.evaluate(() => ({
      width: innerWidth,
      height: innerHeight,
    }));
    expect(canvas!.x).toBeCloseTo(0, 1);
    expect(canvas!.y).toBeCloseTo(0, 1);
    expect(canvas!.width).toBeCloseTo(windowSize.width, 1);
    expect(canvas!.height).toBeCloseTo(windowSize.height, 1);
    await expect(page.locator(".underbar")).toBeHidden();
    await expect(page.locator(".topbar")).toBeHidden();
    await expect(page.locator("#skillbar kbd").first()).toBeVisible();
    await expect(page.locator("#quickbar kbd").first()).toBeVisible();
    await expect(page.locator(".hud-tools")).toHaveCount(0);
    expect(hud!.x).toBeCloseTo(canvas!.x, 1);
    expect(hud!.y).toBeCloseTo(canvas!.y, 1);
    expect(hud!.width).toBeCloseTo(canvas!.width, 1);
    expect(hud!.height).toBeCloseTo(canvas!.height, 1);
    await page.locator("#game").evaluate((el, box) => {
      el.dispatchEvent(
        new PointerEvent("pointerdown", {
          button: 0,
          bubbles: true,
          clientX: box.x + (box.width * 680) / 960,
          clientY: box.y + (box.height * 257) / 540,
        }),
      );
    }, canvas!);
    expect((await state(page)).player.direction).toBe("right");
    expect((await state(page)).player.action).toBe("attack");
    await page.evaluate(() => document.exitFullscreen());
    await page.waitForTimeout(600);
  }
});

test("O cenário opaco oculta projéteis atrás e preserva os que estão à frente", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const [{ Renderer }, { Assets }, { World }, { createPlayer }] =
      await Promise.all(
        [
          "/src/renderer.ts",
          "/src/assets.ts",
          "/src/world.ts",
          "/src/state.ts",
        ].map((path) => import(/* @vite-ignore */ path)),
      );
    const assets = new Assets();
    await assets.load();
    const world = new World();
    world.props = [
      {
        id: "depth-house",
        kind: "house",
        x: 12,
        y: 10,
        scale: 2.1,
        solid: true,
        radius: 1.55,
      },
    ];
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 540;
    const renderer = new Renderer(canvas, assets, world),
      player = createPlayer();
    renderer.snap(player);
    const pixels = () => renderer.ctx.getImageData(0, 0, 960, 540).data;
    renderer.draw(player, [], [], [], [], 0);
    const baseline = new Uint8ClampedArray(pixels());
    const mask = document.createElement("canvas");
    mask.width = 960;
    mask.height = 540;
    const maskCtx = mask.getContext("2d")!;
    maskCtx.imageSmoothingEnabled = false;
    const at = renderer.project(world.props[0]);
    assets.draw(maskCtx, "props", 0, 0, 128, 160, at.x, at.y, 2.1);
    const opaque = maskCtx.getImageData(0, 0, 960, 540).data;
    const changed = (image: Uint8ClampedArray) => {
      let count = 0;
      for (let i = 0; i < image.length; i += 4)
        if (
          opaque[i + 3] === 255 &&
          (image[i] !== baseline[i] ||
            image[i + 1] !== baseline[i + 1] ||
            image[i + 2] !== baseline[i + 2])
        )
          count++;
      return count;
    };
    const projectile = {
      vx: 1,
      vy: 0,
      damage: 5,
      range: 4,
      traveled: 0,
      color: "#69c5ff",
    };
    // Prove the beam would cover opaque scenery if painted last (the old bug).
    renderer.projectile({ ...projectile, x: 11, y: 9 });
    const occlusionOpportunity = changed(pixels());
    renderer.draw(player, [], [], [], [{ ...projectile, x: 11, y: 9 }], 0);
    const behind = changed(pixels());
    renderer.draw(
      player,
      [],
      [],
      [],
      [{ ...projectile, x: 12.05, y: 10.05 }],
      0,
    );
    const front = changed(pixels());
    canvas.style.cssText =
      "width:960px;height:540px;image-rendering:pixelated;";
    canvas.id = "depth-evidence";
    document.body.appendChild(canvas);
    return { behind, front, occlusionOpportunity };
  });
  expect(result.occlusionOpportunity).toBeGreaterThan(0);
  expect(result.behind).toBe(0);
  expect(result.front).toBeGreaterThan(0);
  await page
    .locator("#depth-evidence")
    .screenshot({ path: "artifacts/depth-projectile.png" });
});
