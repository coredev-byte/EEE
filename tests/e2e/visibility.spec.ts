import { test, expect } from "@playwright/test";
import { createPlayer } from "../../src/state";
import { serialize, SAVE_KEY } from "../../src/save";
import { freshExploration } from "../../src/regions";

test("Oclusão real: máscara local, restauração gradual e profundidade em múltiplas câmeras", async ({
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
        ].map((p) => import(/* @vite-ignore */ p)),
      );
    const assets = new Assets();
    await assets.load();
    const checks = [];
    for (const kind of [
      "house",
      "ruinHouse",
      "pine",
      "deadTree",
      "wall",
      "rock",
    ]) {
      const w = new World();
      const scale = ["house", "ruinHouse"].includes(kind) ? 2.1 : 1.5;
      const prop = {
        id: "test",
        kind,
        x: 12,
        y: 12,
        scale,
        solid: true,
        radius: 0.5,
        footprint: ["house", "ruinHouse"].includes(kind)
          ? { halfX: 1.2, halfY: 1.2 }
          : undefined,
      };
      w.props = [prop];
      const p = createPlayer();
      p.x = 10.4;
      p.y = 10.4;
      const canvas = document.createElement("canvas");
      canvas.width = 960;
      canvas.height = 540;
      const r = new Renderer(canvas, assets, w);
      r.snap(p);
      r.camera.x += 37;
      r.camera.y -= 12;
      const read = () => r.ctx.getImageData(0, 0, 960, 540).data;
      // First frame is fully opaque; subsequent frames reveal only actual covered body pixels.
      r.draw(p, [], [], [], [], 0);
      const opaque = new Uint8ClampedArray(read());
      let firstChange = 0;
      // Hold the camera fixed by snapping before each render at this alternative projection.
      for (let i = 0; i < 15; i++) {
        r.snap(p);
        r.camera.x += 37 * Math.exp(0.35);
        r.camera.y -= 12 * Math.exp(0.35);
        r.draw(p, [], [], [], [], 0.05);
        if (i === 0) {
          const data = read();
          for (let k = 0; k < data.length; k++)
            firstChange += Math.abs(data[k] - opaque[k]);
        }
      }
      const revealed = read(),
        at = r.project(p);
      let finalChange = 0;
      for (let k = 0; k < revealed.length; k++)
        finalChange += Math.abs(revealed[k] - opaque[k]);
      let changed = 0,
        outside = 0;
      for (let i = 0; i < revealed.length; i += 4)
        if (
          revealed[i] !== opaque[i] ||
          revealed[i + 1] !== opaque[i + 1] ||
          revealed[i + 2] !== opaque[i + 2]
        ) {
          const x = (i / 4) % 960,
            y = Math.floor(i / 4 / 960);
          changed++;
          if (Math.abs(x - at.x) > 34 || y < at.y - 104 || y > at.y + 20)
            outside++;
        }
      // Restore at the SAME camera/position, with the actor in front: no alpha remains.
      p.x = 13.7;
      p.y = 13.7;
      r.snap(p);
      for (let i = 0; i < 35; i++) r.draw(p, [], [], [], [], 0.05);
      const restored = new Uint8ClampedArray(read());
      const fresh = new Renderer(document.createElement("canvas"), assets, w);
      fresh.canvas.width = 960;
      fresh.canvas.height = 540;
      fresh.snap(p);
      fresh.draw(p, [], [], [], [], 0);
      const normal = fresh.ctx.getImageData(0, 0, 960, 540).data;
      let mismatch = 0;
      for (let i = 0; i < normal.length; i++)
        if (normal[i] !== restored[i]) mismatch++;
      checks.push({
        kind,
        firstChange,
        finalChange,
        changed,
        outside,
        mismatch,
        free: !w.blocked({ x: 10.4, y: 10.4 }),
      });
      if (kind === "house") {
        r.snap({ x: 10.4, y: 10.4 });
        p.x = 10.4;
        p.y = 10.4;
        for (let i = 0; i < 15; i++) r.draw(p, [], [], [], [], 0.05);
        canvas.id = "occlusion-evidence";
        canvas.style.cssText =
          "width:960px;height:540px;image-rendering:pixelated";
        document.body.appendChild(canvas);
      }
    }
    return checks;
  });
  for (const r of result) {
    expect(r.free, r.kind).toBe(true);
    expect(r.outside, r.kind).toBe(0);
    expect(r.mismatch, r.kind).toBe(0);
  }
  expect(result.find((r) => r.kind === "house")!.firstChange).toBeLessThan(
    result.find((r) => r.kind === "house")!.finalChange,
  );
  expect(result.find((r) => r.kind === "house")!.changed).toBeGreaterThan(80);
  expect(result.find((r) => r.kind === "ruinHouse")!.changed).toBeGreaterThan(
    80,
  );
  await page
    .locator("#occlusion-evidence")
    .screenshot({ path: "artifacts/occlusion-local.png" });
});

test("Movimento real atrás da casa, minimapa orientado e objetivo concluído sem destaque", async ({
  page,
}) => {
  const p = createPlayer();
  p.x = 3.4;
  p.y = 7.4;
  const e = freshExploration();
  e.campaign = {
    accepted: true,
    entered: true,
    attuned: ["vigia", "canal", "memoria"],
    rewardClaimed: true,
  };
  const raw = serialize(
    p,
    { stage: 2, kills: 3, rewardClaimed: true },
    [],
    [],
    e,
  );
  await page.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), {
    key: SAVE_KEY,
    raw,
  });
  await page.goto("/");
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  const before = await page.evaluate(() => (window as any).__DZ.snapshot());
  expect(before.activeObjective).toBeNull();
  await page.keyboard.down("w");
  await page.waitForTimeout(240);
  await page.keyboard.up("w");
  const after = await page.evaluate(() => (window as any).__DZ.snapshot());
  expect(after.player.direction).toBe("back");
  expect(
    Math.hypot(
      after.player.x - before.player.x,
      after.player.y - before.player.y,
    ),
  ).toBeGreaterThan(0.2);
  await page.locator(".map-key summary").click();
  await expect(page.locator(".map-legend")).toContainText("Você");
  await page.locator(".map-key summary").click();
  const gold = await page.locator("#minimap").evaluate((el) => {
    const c = el as HTMLCanvasElement,
      d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4)
      if (d[i] === 232 && d[i + 1] === 189 && d[i + 2] === 104) n++;
    return n;
  });
  expect(gold).toBe(0);
  await page.screenshot({
    path: "artifacts/objectives-hud.png",
    fullPage: true,
  });
  for (const panel of ["inventory", "quests", "settings"]) {
    await page.locator(`.hud-tools [data-panel="${panel}"]`).click();
    await expect(page.locator("#modal-layer")).toBeVisible();
    await page.keyboard.press("Escape");
    expect(
      (await page.evaluate(() => (window as any).__DZ.snapshot())).paused,
    ).toBe(false);
  }
  await page.screenshot({
    path: "artifacts/hud-reference.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "artifacts/hud-reference-mobile.png",
    fullPage: true,
  });
});

test("Objetivo no mundo e minimapa usa o alvo real, inclusive fora da tela e em movimento", async ({
  page,
}) => {
  const p = createPlayer();
  await page.addInitScript(
    ({ key, raw }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, raw);
    },
    {
      key: SAVE_KEY,
      raw: serialize(p, { stage: 0, kills: 0, rewardClaimed: false }, [], []),
    },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  await page.waitForTimeout(300);
  const inspectArrow = async () => {
    const path = "/src/objectives.ts";
    const { placeObjective } = await import(/* @vite-ignore */ path);
    const dz = (window as any).__DZ,
      goal = dz.snapshot().activeObjective,
      foot = dz.project(goal);
    const viewport = document.querySelector("#game")!.getBoundingClientRect();
    const blockers = [
      ".player-hud",
      ".location",
      ".quest-hud",
      ".minimap-box",
    ].map((selector) => {
      const b = document.querySelector(selector)!.getBoundingClientRect();
      return {
        x: ((b.left - viewport.left) * 960) / viewport.width,
        y: ((b.top - viewport.top) * 540) / viewport.height,
        width: (b.width * 960) / viewport.width,
        height: (b.height * 540) / viewport.height,
      };
    });
    const at = placeObjective(
      { x: foot.x, y: foot.y - goal.height },
      960,
      540,
      blockers,
    );
    const overlaps = blockers.some(
      (b) =>
        at.x > b.x - 24 &&
        at.x < b.x + b.width + 24 &&
        at.y > b.y - 24 &&
        at.y < b.y + b.height + 24,
    );
    const c = document.querySelector<HTMLCanvasElement>("#game")!,
      d = c
        .getContext("2d")!
        .getImageData(
          Math.round(at.x) - 10,
          Math.round(at.y) - 10,
          20,
          20,
        ).data;
    let gold = 0;
    for (let i = 0; i < d.length; i += 4)
      if (d[i] === 232 && d[i + 1] === 189 && d[i + 2] === 104) gold++;
    return { outside: at.outside, gold, overlaps };
  };
  const arrow = await page.evaluate(inspectArrow);
  expect(arrow.outside).toBe(true);
  expect(arrow.overlaps).toBe(false);
  expect(arrow.gold).toBeGreaterThan(0);
  await page.screenshot({
    path: "artifacts/objective-direction.png",
    fullPage: true,
  });
  for (const viewport of [
    { width: 800, height: 680 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(300);
    const resized = await page.evaluate(inspectArrow);
    expect(resized.overlaps).toBe(false);
    expect(resized.gold).toBeGreaterThan(0);
  }
});

test("Marcador de combate acompanha o inimigo vivo no minimapa", async ({
  page,
}) => {
  await page.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), {
    key: SAVE_KEY,
    raw: serialize(
      createPlayer(),
      { stage: 1, kills: 0, rewardClaimed: false },
      [],
      [],
    ),
  });
  await page.goto("/");
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  const first = await page.evaluate(() => (window as any).__DZ.snapshot());
  expect(first.activeObjective.kind).toBe("defeat");
  await page.waitForTimeout(650);
  const next = await page.evaluate(() => {
    const s = (window as any).__DZ.snapshot(),
      goal = s.activeObjective;
    const enemy = s.enemies.find((e: any) => `enemy:${e.id}` === goal.id);
    const c = document.querySelector<HTMLCanvasElement>("#minimap")!;
    const padding = Math.ceil(
      (Math.min(c.width, c.height) * (1 - 1 / Math.SQRT2)) / 2 + 9,
    );
    const x = Math.round(
        padding + ((goal.x + 0.5) * (c.width - padding * 2)) / 28,
      ),
      y = Math.round(
        padding + ((goal.y + 0.5) * (c.height - padding * 2)) / 28,
      );
    const d = c.getContext("2d")!.getImageData(x - 8, y - 8, 16, 16).data;
    let gold = 0;
    for (let i = 0; i < d.length; i += 4)
      if (d[i] === 232 && d[i + 1] === 189 && d[i + 2] === 104) gold++;
    return { goal, enemy, gold };
  });
  expect(next.goal.x).toBe(next.enemy.x);
  expect(next.goal.y).toBe(next.enemy.y);
  expect(next.gold).toBeGreaterThan(0);
  expect(
    Math.hypot(
      next.goal.x - first.activeObjective.x,
      next.goal.y - first.activeObjective.y,
    ),
  ).toBeGreaterThan(0.1);
});

test("Ameaça em combate e NPC do objetivo também recebem máscara local", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const [
      { Renderer },
      { Assets },
      { World },
      { createPlayer, createEnemies },
    ] = await Promise.all(
      [
        "/src/renderer.ts",
        "/src/assets.ts",
        "/src/world.ts",
        "/src/state.ts",
      ].map((p) => import(/* @vite-ignore */ p)),
    );
    const assets = new Assets();
    await assets.load();
    const results = [];
    for (const role of ["enemy", "npc"]) {
      const w = new World();
      w.props = [
        {
          id: "house",
          kind: "house",
          x: 12,
          y: 12,
          scale: 2.1,
          solid: true,
          radius: 1.55,
          footprint: { halfX: 1.2, halfY: 1.2 },
        },
      ];
      const p = createPlayer();
      p.x = 8;
      p.y = 16;
      const e = createEnemies()[0];
      Object.assign(e, { x: 10.4, y: 10.4, state: "chase" });
      if (role === "npc")
        w.props.push({
          id: "npc",
          kind: "npc",
          x: 10.4,
          y: 10.4,
          scale: 0.72,
          solid: false,
          radius: 0.5,
        });
      const goal =
        role === "npc"
          ? {
              id: "npc",
              kind: "talk",
              label: "Converse",
              x: 10.4,
              y: 10.4,
              height: 80,
            }
          : null;
      const canvas = document.createElement("canvas");
      canvas.width = 960;
      canvas.height = 540;
      const r = new Renderer(canvas, assets, w);
      r.snap(p);
      r.draw(p, role === "enemy" ? [e] : [], [], [], [], 0, goal);
      const before = r.ctx.getImageData(0, 0, 960, 540).data;
      for (let i = 0; i < 15; i++)
        r.draw(p, role === "enemy" ? [e] : [], [], [], [], 0.05, goal);
      const after = r.ctx.getImageData(0, 0, 960, 540).data;
      const at = r.project(e);
      let changed = 0,
        outside = 0;
      for (let i = 0; i < after.length; i += 4)
        if (
          after[i] !== before[i] ||
          after[i + 1] !== before[i + 1] ||
          after[i + 2] !== before[i + 2]
        ) {
          changed++;
          const x = (i / 4) % 960,
            y = Math.floor(i / 4 / 960);
          if (Math.abs(x - at.x) > 40 || y < at.y - 110 || y > at.y + 24)
            outside++;
        }
      results.push({ role, changed, outside });
    }
    return results;
  });
  for (const r of result) {
    expect(r.changed, r.role).toBeGreaterThan(80);
    expect(r.outside, r.role).toBe(0);
  }
});
