import { test, expect, type Page } from "@playwright/test";
test("Capa inteira, animação, tema após gesto e transição ao jogar", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator(".cover-scene");
  await expect(canvas).toHaveAttribute("data-active", "true");
  const bounds = await page.locator(".cover-menu").boundingBox();
  expect(bounds!.x).toBe(0);
  expect(bounds!.y).toBe(0);
  expect(bounds!.width).toBe(page.viewportSize()!.width);
  expect(bounds!.height).toBe(page.viewportSize()!.height);
  await page.getByRole("button", { name: "Ativar música temática" }).click();
  await expect.poll(async () => (await state(page)).audio.loaded).toBe(55);
  await expect.poll(async () => (await state(page)).audio.loopLevels["title-theme"]).toBeGreaterThan(0);
  const frames = Number(await canvas.getAttribute("data-frames"));
  await expect.poll(async () => Number(await canvas.getAttribute("data-frames"))).toBeGreaterThan(frames + 2);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toHaveAttribute("data-active", "false");
  const stopped = await canvas.getAttribute("data-frames");
  await page.waitForTimeout(150);
  expect(await canvas.getAttribute("data-frames")).toBe(stopped);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(canvas).toHaveAttribute("data-active", "true");
  await page.getByRole("button", { name: "INICIAR JORNADA" }).click();
  await page.getByRole("button", { name: "ENTRAR EM PEDRALTA →" }).click();
  await expect(canvas).toHaveCount(0);
  expect(await page.locator("body").evaluate((el) => el.classList.contains("cover-active"))).toBe(false);
  await expect.poll(async () => (await state(page)).audio.loopLevels["title-theme"]).toBeLessThan(0.001);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "MENU PRINCIPAL", exact: true }).click();
  await expect(page.locator(".cover-scene")).toHaveAttribute("data-active", "true");
  await expect.poll(async () => (await state(page)).audio.loopLevels["title-theme"]).toBeGreaterThan(0.01);
});
import { createPlayer } from "../../src/state";
import { serialize, SAVE_KEY } from "../../src/save";
async function start(page: Page, safe = true) {
  const p = createPlayer("guerreiro");
  if (safe) {
    p.x = 3;
    p.y = 3;
  }
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
  await expect
    .poll(async () => (await state(page)).audio.context)
    .toBe("running");
}
async function state(page: Page) {
  return page.evaluate(() => (window as any).__DZ.snapshot());
}
test("Chromium decodifica todos os arquivos; ataque no vazio separa preparação e erro; pausa encerra combate", async ({
  page,
}) => {
  await start(page);
  await expect.poll(async () => (await state(page)).audio.loaded).toBe(55);
  expect((await state(page)).audio.errors).toEqual([]);
  const box = (await page.locator("#game").boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.5);
  await expect
    .poll(async () =>
      (await state(page)).audio.played.some(
        (x: any) => x.event === "attack.miss",
      ),
    )
    .toBe(true);
  const events = (await state(page)).audio.played;
  const prep = events.find((x: any) => x.event === "attack.prepare"),
    swing = events.find((x: any) => x.event === "attack.swing");
  // AudioContext timestamps are quantized to one 128-sample render quantum.
  const quantum = 128 / (await state(page)).audio.sampleRate;
  expect(swing.time - prep.time).toBeGreaterThanOrEqual(0.14 - quantum);
  expect(events.some((x: any) => x.event === "impact.hit")).toBe(false);
  await page.keyboard.press("i");
  expect((await state(page)).audio.paused).toBe(true);
  await page.keyboard.press("Escape");
  expect((await state(page)).audio.paused).toBe(false);
  expect((await state(page)).audio.loops).toBe(9);
});
test("Sliders e mute persistem após recarregar; jogo mantém WASD", async ({
  page,
}) => {
  await start(page);
  await page.locator('[data-panel="settings"]').first().click();
  const slider = page.getByRole("slider", { name: "Música", exact: true });
  await slider.evaluate((el: any) => {
    el.value = "23";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page
    .getByRole("button", { name: "SILENCIAR ÁUDIO", exact: true })
    .click();
  expect((await state(page)).audio.settings.music).toBe(0.23);
  expect((await state(page)).audio.settings.muted).toBe(true);
  await page.screenshot({ path: "artifacts/audio-settings.png" });
  await page.reload();
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  expect((await state(page)).audio.settings.music).toBe(0.23);
  expect((await state(page)).audio.settings.muted).toBe(true);
  const before = (await state(page)).player;
  await page.keyboard.down("d");
  await expect
    .poll(async () => {
      const p = (await state(page)).player;
      return Math.hypot(p.x - before.x, p.y - before.y);
    })
    .toBeGreaterThan(0.5);
  await page.keyboard.up("d");
});
test("Arquivo ausente e WAV inválido não impedem movimento ou outros sons", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/audio/sfx/fire-0.wav", (route) =>
    route.fulfill({ status: 404, body: "missing" }),
  );
  await page.route("**/audio/sfx/void-0.wav", (route) =>
    route.fulfill({ status: 200, body: "invalid WAV" }),
  );
  await start(page);
  await expect.poll(async () => (await state(page)).audio.loaded).toBe(53);
  expect((await state(page)).audio.errors).toHaveLength(2);
  await page.keyboard.press("i");
  await expect(page.locator("#modal-layer")).toBeVisible();
  expect(
    (await state(page)).audio.played.some((x: any) => x.event === "ui.open"),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("Web Audio real: rajadas, regiões, manutenção, teardown e cache", async ({
  page,
}) => {
  await start(page);
  const result = await page.evaluate(async () => {
    const { AudioEngine } = await import(
      /* @vite-ignore */ ["/src/audio.ts"][0]
    );
    const a = new AudioEngine();
    a.unlock();
    await a.ready();
    const initial = a.snapshot();
    for (let i = 0; i < 100; i++)
      a.emit("step", { owner: String(i), position: { x: 12, y: 12 } });
    const burst = a.snapshot();
    a.setPaused(true);
    const paused = a.snapshot();
    a.setPaused(false);
    a.scene("forest", "combat");
    a.scene("ruins", "boss");
    const transitioned = a.snapshot();
    a.stopEffects();
    a.sustain("test", { skillId: "arcanista-0-0", position: { x: 12, y: 12 } });
    a.sustain("test", { skillId: "arcanista-0-0", position: { x: 12, y: 12 } });
    const sustain = a.snapshot();
    a.stopOwner("test");
    await new Promise((resolve) => setTimeout(resolve, 40));
    const stopped = a.snapshot();
    a.dispose();
    const disposed = a.snapshot();
    return { initial, burst, paused, transitioned, sustain, stopped, disposed };
  });
  expect(result.burst.effects).toBe(18);
  expect(result.paused.effects).toBe(0);
  expect(result.transitioned.loops).toBe(9);
  expect(result.transitioned.transport).toBe(result.initial.transport);
  expect(result.transitioned.region).toBe("ruins");
  expect(result.sustain.effects).toBe(1);
  expect(result.stopped.effects).toBe(0);
  expect(result.disposed.context).toBe("locked");
  expect(result.disposed.loops).toBe(0);
});
test("Limiter real mantém margem mesmo com dezoito impactos e sete loops somados", async ({
  page,
}) => {
  await page.goto("/");
  const peak = await page.evaluate(async () => {
    const { connectLimiter } = await import(
      /* @vite-ignore */ ["/src/audio.ts"][0]
    );
    const context = new OfflineAudioContext(1, 22050, 22050);
    const input = context.createGain();
    input.gain.value = 10;
    connectLimiter(context, input);
    for (const path of [
      "/audio/sfx/metal-0.wav",
      "/audio/ambience/wind.wav",
      "/audio/music/pad.wav",
    ]) {
      const buffer = await context.decodeAudioData(
        await (await fetch(path)).arrayBuffer(),
      );
      for (
        let i = 0;
        i < (path.includes("sfx") ? 18 : path.includes("ambience") ? 4 : 3);
        i++
      ) {
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(input);
        source.start();
      }
    }
    const rendered = await context.startRendering();
    let peak = 0;
    for (const x of rendered.getChannelData(0))
      peak = Math.max(peak, Math.abs(x));
    return peak;
  });
  expect(peak).toBeGreaterThan(0.1);
  expect(peak).toBeLessThan(0.9);
});
test("Conversa real em Pedralta: abertura, resposta, missão aceita e encerramento sem voz falsa", async ({
  page,
}) => {
  const p = createPlayer();
  p.x = 10;
  p.y = 13;
  await page.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), {
    key: SAVE_KEY,
    raw: serialize(p, { stage: 0, kills: 0, rewardClaimed: false }, [], []),
  });
  await page.goto("/");
  await page.getByRole("button", { name: "CONTINUAR JORNADA" }).click();
  await expect.poll(async () => (await state(page)).audio.loaded).toBe(55);
  await page.keyboard.press("f");
  await expect(page.locator(".dialogue-panel")).toBeVisible();
  await page.getByRole("button", { name: "ACEITAR O CHAMADO" }).click();
  expect((await state(page)).quest.accepted).toBe(true);
  await expect
    .poll(async () => (await state(page)).audio.music)
    .toBe("narrative");
  await page.screenshot({ path: "artifacts/audio-dialogue.png" });
  const events = (await state(page)).audio.played.map((x: any) => x.event);
  expect(events).toContain("dialogue.open");
  expect(events).toContain("dialogue.choice");
  expect(events).toContain("quest.accept");
  await page.keyboard.press("Escape");
  expect((await state(page)).audio.paused).toBe(false);
  expect((await state(page)).audio.played.map((x: any) => x.event)).toContain(
    "dialogue.close",
  );
});
