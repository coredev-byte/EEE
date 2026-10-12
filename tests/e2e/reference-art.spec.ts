import { test, expect, type Page } from "@playwright/test";
import { World } from "../../src/world";
import { createPlayer } from "../../src/state";
import { freshExploration } from "../../src/regions";
import { freshChapter } from "../../src/chapter-data";
import { serialize, SAVE_KEY } from "../../src/save";
import { state } from "./region-helpers";
async function conversation(page: Page, npc: string) {
  const region = npc === "iria" ? "kharn" : ["elcio", "nara"].includes(npc) ? "ferrugem" : "pedralta";
  const w = new World(region), p = createPlayer("guerreiro"), e = freshExploration();
  const actor = w.props.find(o => o.kind === "npc" && (npc === "guardian" ? o.id === "npc-10-14" : npc === "iria" ? true : o.interaction === npc))!;
  Object.assign(p, w.nearestFree(actor));e.chapter = freshChapter(true);e.region=region;e.visited=region === "pedralta" ? [region] : ["pedralta", "kharn", ...(region === "ferrugem" ? ["ferrugem" as const] : [])];
  if(npc !== "guardian") e.campaign={accepted:true,entered:true,attuned:["vigia","canal","memoria"],rewardClaimed:true};
  if(npc === "nara") {e.journal.accepted=["workers"];e.journal.events=["talk:elcio","worker-log","defeat:204"];e.regions.ferrugem.killed=[204];e.bosses=["ferrugem:204"];}
  await page.addInitScript(({key,raw})=>localStorage.setItem(key,raw), {key:SAVE_KEY,raw:serialize(p,{stage:npc === "guardian" ? 0:2,kills:npc === "guardian" ? 0:3,rewardClaimed:npc !== "guardian"},[],[],e)});
  await page.goto("/");await page.getByRole("button",{name:"CONTINUAR JORNADA"}).click();await page.keyboard.press("f");
  await expect(page.locator(".panel-dialogue")).toBeVisible();
}
for(const npc of ["guardian","lenir","iria","elcio","nara"]) test(`Moldura e retrato de diálogo para ${npc}, desktop e móvel`, async({page})=>{
  const errors:string[]=[];page.on("pageerror", e=>errors.push(e.message));
  await conversation(page,npc);
  const panel=page.locator(".panel-dialogue");
  await expect(panel.locator(".dialogue-portrait")).toBeVisible();
  await expect(panel.locator(".dialogue-nameplate")).toBeVisible();
  const frozen=(await state(page)).player;await page.keyboard.press("d");expect((await state(page)).player.x).toBe(frozen.x);
  for(const width of [1440,390]) {
    await page.setViewportSize({width,height:width===390?844:1000});
    expect(await panel.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0 && r.right<=innerWidth+1 && r.bottom<=innerHeight+1 && document.documentElement.scrollWidth<=innerWidth;})).toBe(true);
    expect(await panel.locator(".dialogue-portrait").evaluate((canvas:HTMLCanvasElement)=>Array.from(canvas.getContext("2d")!.getImageData(0,0,160,196).data).some((v,i)=>i%4===3 && v>0))).toBe(true);
  }
  expect(errors).toEqual([]);
});
test("As opções douradas respondem às setas e Enter e mantêm a missão real",async({page})=>{
 await conversation(page,"guardian");
 const choices=page.locator(".dialogue-panel button");await expect(choices).toHaveCount(2);
 await expect(choices.nth(0)).toBeFocused();await page.keyboard.press("ArrowDown");await expect(choices.nth(1)).toBeFocused();await page.keyboard.press("Enter");
 expect((await state(page)).quest.accepted).toBe(true);
 await page.getByRole("button",{name:"VOLTAR À VILA"}).click();await expect(page.locator(".panel-dialogue")).toBeHidden();
});
