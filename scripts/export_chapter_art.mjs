import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const outputDir = process.argv[2] ?? "/tmp/distrito-zero-chapter-templates";
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:5173");
  const sheets = await page.evaluate(async () => {
    const [{ makeRuinAtlas }, { paintChapterEnemy }, { chapterEnemy }] =
      await Promise.all([
        import("/src/ruins-art.ts"),
        import("/src/chapter-art.ts"),
        import("/src/chapter-data.ts"),
      ]);
    const kharn = document.createElement("canvas");
    kharn.width = 256 * 8;
    kharn.height = 192 * 3;
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 8; col++) {
        const e = chapterEnemy(310, 0, 0, 720, "kharn", "Kharn", true);
        e.phase = row + 1;
        e.state =
          col === 2 || col === 3
            ? "chase"
            : col === 4 || col === 5
              ? "attack"
              : col === 6
                ? "recover"
                : "patrol";
        e.animTime = [0, 1.2, 0.05, 0.32, 0, 0.5, 0.7, 0][col];
        if (col === 7) e.hp = 0;
        paintChapterEnemy(
          kharn.getContext("2d"),
          e,
          { x: col * 256 + 128, y: row * 192 + 188 },
          col === 4 ? "rise" : col === 7 ? "kneel" : undefined,
        );
      }
    const enemies = document.createElement("canvas");
    enemies.width = 96 * 8;
    enemies.height = 96 * 2;
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 8; col++) {
        const e = chapterEnemy(
          300,
          0,
          0,
          260,
          row ? "sentinel" : "bizel",
          row ? "Vigia" : "Bizel",
        );
        e.state = col === 4 || col === 5 ? "attack" : "chase";
        e.animTime = col * 0.15;
        paintChapterEnemy(enemies.getContext("2d"), e, {
          x: col * 96 + 48,
          y: row * 96 + 92,
        });
      }
    return {
      ruins: makeRuinAtlas().toDataURL(),
      kharn: kharn.toDataURL(),
      enemies: enemies.toDataURL(),
    };
  });
  for (const [id, url] of Object.entries(sheets))
    await writeFile(
      `${outputDir}/${id}.png`,
      Buffer.from(url.split(",")[1], "base64"),
    );
  console.log(`Three draft atlases exported to ${outputDir}; refined production art preserved.`);
} finally {
  await browser.close();
}
