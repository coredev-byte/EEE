import { describe, it, expect, vi, afterEach } from "vitest";
import { Game } from "../src/game";
import { freshExploration } from "../src/regions";
import {
  missionViews,
  acceptMission,
  recordMissionEvent,
  selectedMission,
} from "../src/missions";
import { deserialize, serialize, SAVE_KEY } from "../src/save";
import { updateEnemies } from "../src/enemies";
const complete = { stage: 2 as const, kills: 3, rewardClaimed: true };
afterEach(() => vi.unstubAllGlobals());
function game() {
  vi.stubGlobal("localStorage", { getItem: () => null, setItem: vi.fn() });
  const g = new Game();
  g.input = { keys: new Set() } as any;
  g.renderer = { makeFloor: vi.fn(), snap: vi.fn() } as any;
  g.quest = { ...complete };
  g.exploration.campaign = {
    accepted: true,
    entered: true,
    attuned: ["vigia", "canal", "memoria"],
    rewardClaimed: true,
  };
  g.changeRegion("kharn");
  g.changeRegion("ferrugem");
  return g;
}
function use(g: Game, interaction: string) {
  const prop = g.world.props.find((p) => p.interaction === interaction)!;
  Object.assign(g.player, { x: prop.x, y: prop.y });
  return g.interact();
}
describe("Missões unificadas", () => {
  it("guarda backup exato do save antigo antes de gravar v4 e recupera save corrompido", () => {
    const g = game();
    const old = JSON.parse(serialize(g.player, g.quest, [], [], g.exploration));
    old.version = 3;
    const raw = JSON.stringify(old);
    const storage = new Map([[SAVE_KEY, raw]]);
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    expect(g.save()).toBe(true);
    expect(storage.get(`${SAVE_KEY}:backup:v3`)).toBe(raw);
    expect(JSON.parse(storage.get(SAVE_KEY)!).version).toBe(4);
    storage.set(SAVE_KEY, "quebrado");
    expect(g.save()).toBe(true);
  });
  it("chefe fica contido no portão, sinaliza descarga e entra em sobrecarga", () => {
    const g = game();
    const e = g.enemies.find((e) => e.id === 203)!;
    Object.assign(g.player, { x: 21, y: 8 });
    const damage = vi.spyOn(g.combat, "damagePlayer").mockReturnValue(false);
    for (let i = 0; i < 180; i++)
      updateEnemies([e], g.player, g.world, g.combat, 0.04, i * 0.04);
    expect(damage).not.toHaveBeenCalled();
    g.world.applyChanges(["pump"]);
    for (let i = 0; i < 180; i++)
      updateEnemies([e], g.player, g.world, g.combat, 0.04, i * 0.04);
    expect(
      g.effects.some(
        (effect) => effect.kind === "nova" && effect.color === "#f5a34f",
      ),
    ).toBe(true);
    expect(damage.mock.calls.some(([amount]) => amount === 38)).toBe(true);
    e.hp = e.maxHp / 2;
    updateEnemies([e], g.player, g.world, g.combat, 0.04, 8);
    expect(e.phase).toBe(2);
    expect(g.message).toContain("sobrecarga");
  });
  it("deriva legado e requisitos sem conceder recompensas retroativamente", () => {
    const e = freshExploration();
    const views = missionViews(e, complete);
    expect(views.find((v) => v.definition.id === "eco")!.status).toBe(
      "concluída",
    );
    expect(views.find((v) => v.definition.id === "machines")!.status).toBe(
      "bloqueada",
    );
    expect(acceptMission(e, complete, "machines")).toBe(false);
    expect(acceptMission(e, complete, "workers")).toBe(false);
    expect(recordMissionEvent(e, "inventado")).toBe(false);
  });
  it("componentes encontrados cedo continuam válidos, etapas e rastreamento respeitam dependências", () => {
    const g = game();
    use(g, "gear");
    expect(selectedMission(g.exploration, g.quest)!.stage).toBe(1);
    use(g, "elcio");
    expect(selectedMission(g.exploration, g.quest)!.stage).toBe(3);
    expect(g.acceptSideMission("bridge")).toBe(true);
    expect(selectedMission(g.exploration, g.quest)!.definition.id).toBe(
      "bridge",
    );
    expect(g.acceptSideMission("bridge")).toBe(false);
    expect(use(g, "bridge")).toBe(false);
    use(g, "crank");
    const before = g.player.coins;
    expect(use(g, "bridge")).toBe(true);
    expect(g.player.coins).toBe(before + 60);
    expect(g.world.segmentClear({ x: 13, y: 20 }, { x: 15, y: 20 })).toBe(true);
    expect(g.exploration.journal.completed).toContain("bridge");
  });
  it("campanha industrial completa com mecanismos, chefe, entrega e recompensa única após reload", () => {
    const g = game();
    expect(use(g, "pump")).toBe(false);
    use(g, "elcio");
    use(g, "gear");
    use(g, "fuse");
    expect(use(g, "pump")).toBe(true);
    expect(g.world.segmentClear({ x: 21, y: 11 }, { x: 21, y: 9 })).toBe(true);
    use(g, "manifest");
    expect(g.activeObjective()!.id).toBe("enemy:203");
    g.combat.hit(
      g.enemies.find((e) => e.id === 203)!,
      999,
      "#fff",
    );
    expect(g.exploration.bosses).toContain("ferrugem:203");
    expect(g.activeObjective()!.id).toBe("npc-6-20");
    const before = g.player.coins;
    use(g, "elcio");
    expect(g.player.coins).toBe(before + 240);
    expect(g.player.inventory).toContain("anel-cobre");
    expect(g.exploration.changes).toContain("furnace-safe");
    expect(g.activeObjective()).toBeNull();
    use(g, "elcio");
    expect(g.player.coins).toBe(before + 240);
    g.captureRegion();
    const s = deserialize(serialize(g.player, g.quest, [], [], g.exploration))!;
    expect(s).not.toBeNull();
    g.player = s.player;
    g.exploration = s.exploration;
    g.mountRegion("ferrugem");
    expect(g.enemies.find((e) => e.id === 203)!.hp).toBe(0);
    use(g, "elcio");
    expect(g.player.coins).toBe(before + 240);
    expect(g.player.inventory.filter((id) => id === "anel-cobre")).toHaveLength(
      1,
    );
  });
  it("resgate opcional muda NPC, libera comércio e persiste sem obrigar a campanha", () => {
    const g = game();
    use(g, "elcio");
    g.acceptSideMission("workers");
    expect(use(g, "nara")).toBe(false);
    use(g, "worker-log");
    g.combat.hit(
      g.enemies.find((e) => e.id === 204)!,
      999,
      "#fff",
    );
    use(g, "nara");
    expect(g.world.props.find((p) => p.interaction === "nara")!.x).toBe(7.5);
    use(g, "elcio");
    expect(g.exploration.changes).toContain("merchant");
    const before = g.player.coins,
      potions = g.player.potions[0];
    expect(g.buySupplies()).toBe(true);
    expect(g.player.coins).toBe(before - 50);
    expect(g.player.potions[0]).toBe(potions + 1);
    expect(g.exploration.journal.completed).not.toContain("machines");
  });
  it("recusa saves com missões inventadas, recompensas sem etapas e bomba sem componentes", () => {
    for (const alter of [
      (g: Game) => g.exploration.journal.accepted.push("fake"),
      (g: Game) => g.exploration.journal.completed.push("machines"),
      (g: Game) => g.exploration.journal.events.push("pump"),
      (g: Game) => g.exploration.changes.push("inventada"),
    ]) {
      const g = game();
      alter(g);
      expect(
        deserialize(serialize(g.player, g.quest, [], [], g.exploration)),
      ).toBeNull();
    }
  });
});
