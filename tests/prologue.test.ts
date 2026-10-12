import { describe, it, expect, vi } from "vitest";
import {
  Prologue,
  freshPrologue,
  restorePrologue,
  type TutorialFacts,
} from "../src/prologue";
import { Cinematics } from "../src/cinematics";
import { HINTS, TutorialHints } from "../src/tutorial-hints";
import { createPlayer, stats } from "../src/state";
import { serialize, deserialize } from "../src/save";
import { CLASSES } from "../src/data";
import { Game } from "../src/game";
const facts = (): TutorialFacts => ({
  kills: 0,
  foundSeal: false,
  seal: false,
  accepted: false,
  chests: 0,
  skills: false,
  resourcesFull: true,
  potion: false,
  inventory: false,
  journal: false,
  classes: false,
  tree: false,
});
function ready() {
  const p = new Prologue(freshPrologue());
  p.begin();
  for (let i = 0; i < 3; i++) {
    p.finishScene();
    p.update(0, facts());
  }
  return p;
}
const advance = (p: Prologue, f: TutorialFacts) => {
  for (let i = 0; i < 15; i++) {
    if (p.locked) p.finishScene();
    p.update(0.04, f);
  }
};
describe("Prólogo integrado", () => {
  it("nova jornada dirige três cenas e devolve os controles sem recompensas", () => {
    const p = new Prologue(freshPrologue());
    p.begin();
    expect(p.cinematic.id).toBe("silence");
    expect(p.locked).toBe(true);
    p.finishScene();
    p.update(0.04, facts());
    expect(p.cinematic.id).toBe("signal");
    p.finishScene();
    p.update(0.04, facts());
    expect(p.cinematic.id).toBe("awakening");
    p.finishScene();
    p.update(0.04, facts());
    expect(p.locked).toBe(false);
    expect(p.state!.scenes).toEqual(["silence", "signal", "awakening"]);
  });
  it("som antecede imagem; interpolação real e redução de movimento", () => {
    const c = new Cinematics();
    c.start("silence");
    expect(c.frame()!.fade).toBe(1);
    c.update(2);
    expect(c.frame()!.fade).toBe(0);
    expect(c.frame()!.camera).not.toEqual(c.frame(true)!.camera);
    expect(c.frame(true)!.zoom).toBe(1);
  });
  it("pular e terminar executam a mesma conclusão e limpam estado transitório", () => {
    const a = ready(),
      b = new Prologue(freshPrologue());
    b.begin();
    for (let i = 0; i < 3; i++) {
      b.cinematic.update(50);
      b.update(0.04, facts());
      b.update(0, facts());
    }
    expect(b.state!.scenes).toEqual(a.state!.scenes);
    expect(b.cinematic.frame()).toBe(null);
  });
  it("teclas ou tentativas bloqueadas não contam como movimento válido", () => {
    const p = ready();
    for (let i = 0; i < 30; i++) p.movement({ x: 12, y: 12 }, true);
    p.update(0.04, facts());
    expect(p.state!.step).toBe("move");
    expect(p.state!.moved).toBe(0);
  });
  it("andar e correr completam o primeiro passo somente depois de deslocamento", () => {
    const p = ready();
    for (let i = 0; i < 10; i++) p.movement({ x: 12 + i * 0.2, y: 12 }, true);
    p.update(0.04, facts());
    expect(p.state!.step).toBe("guardian");
  });
  it("aceitação e exploração antecipadas são reconhecidas", () => {
    const p = ready(),
      f = facts();
    f.accepted = true;
    f.foundSeal = true;
    p.update(0.04, f);
    expect(p.seen("done:guardian")).toBe(true);
    expect(p.seen("done:explore")).toBe(true);
  });
  it("primeira baixa e ameaça usam contagem da missão oficial e cenas únicas", () => {
    const p = ready(),
      f = facts();
    f.kills = 1;
    p.update(0.04, f);
    expect(p.cinematic.id).toBe("anomaly");
    p.finishScene();
    p.update(0.04, f);
    expect(p.cinematic.id).toBe(null);
    f.kills = 2;
    p.update(0.04, f);
    expect(p.cinematic.id).toBe("threat");
    expect(f.kills).toBe(2);
  });
  it("habilidade negada não conclui treinamento; fatos confirmados pelo combate concluem", () => {
    const p = ready(),
      f = facts();
    p.event("skill:0");
    p.update(0.04, f);
    expect(p.seen("done:skills")).toBe(false);
    f.skills = true;
    p.update(0.04, f);
    expect(p.seen("done:skills")).toBe(true);
  });
  it("não obriga consumir quando cheio nem regride quando sofre dano depois", () => {
    const p = ready(),
      f = facts();
    p.state!.step = "potions";
    p.update(0.04, f);
    expect(p.seen("done:potions")).toBe(true);
    f.resourcesFull = false;
    p.update(0.04, f);
    expect(p.seen("done:potions")).toBe(true);
  });
  it("poção requer necessidade real e modifica recursos sem desperdício de elixir", () => {
    const g = new Game(),
      p = g.player;
    g.save = () => true;
    g.audioEvent = () => true;
    const before = [...p.potions];
    expect(g.potion(2)).toBe(false);
    expect(p.potions).toEqual(before);
    p.hp = stats(p).maxHp - 50;
    g.prologue = new Prologue(freshPrologue());
    expect(g.potion(0)).toBe(true);
    expect(g.prologue.seen("potion")).toBe(true);
    expect(p.hp).toBe(stats(p).maxHp);
  });
  it("baú e mochila reconhecem interação real sem forçar downgrade", () => {
    const p = ready(),
      f = facts();
    f.chests = 1;
    f.inventory = true;
    p.update(0.04, f);
    expect(p.seen("done:chest")).toBe(true);
    expect(p.seen("done:inventory")).toBe(true);
  });
  it("diário, classe e árvore não exigem pontos nem uma troca de classe", () => {
    const p = ready(),
      f = facts();
    f.journal = f.classes = f.tree = true;
    p.update(0.04, f);
    for (const id of ["journal", "classes", "tree"])
      expect(p.seen(`done:${id}`)).toBe(true);
  });
  it("conclusão entrega à campanha; cenas nunca alteram recompensas", () => {
    const p = ready(),
      f = facts();
    Object.assign(f, {
      kills: 3,
      seal: true,
      accepted: true,
      foundSeal: true,
      chests: 1,
      skills: true,
      potion: true,
      inventory: true,
      journal: true,
      classes: true,
      tree: true,
    });
    p.state!.moved = 2;
    p.state!.ran = 1;
    advance(p, f);
    expect(p.state!.complete).toBe(true);
    expect(p.locked).toBe(false);
    expect(p.hints.active).toBe(null);
    const saved = structuredClone(p.state);
    advance(p, f);
    expect(p.state).toEqual(saved);
  });
  it.each(Object.keys(CLASSES))(
    "save v4 e retomada da classe %s conservam campanha e roteiro",
    (id) => {
      const player = createPlayer(id as keyof typeof CLASSES),
        s = freshPrologue();
      s.scenes = ["silence"];
      s.moved = 0.4;
      s.events = ["panel:quests"];
      const loaded = deserialize(
        serialize(
          player,
          { stage: 0, kills: 0, rewardClaimed: false },
          [],
          [],
          undefined,
          s,
        ),
      )!;
      expect(loaded.prologue).toEqual(s);
      expect(loaded.player.classId).toBe(id);
      const runtime = new Prologue(loaded.prologue);
      runtime.begin();
      expect(runtime.cinematic.id).toBe("signal");
      expect(runtime.state!.moved).toBe(0.4);
    },
  );
  it.each([1, 2, 3, 4])(
    "saves antigos v%s não iniciam outro prólogo",
    (version) => {
      const raw = JSON.parse(
        serialize(
          createPlayer(),
          { stage: 0, kills: 0, rewardClaimed: false },
          [],
          [],
        ),
      );
      raw.version = version;
      delete raw.prologue;
      expect(deserialize(JSON.stringify(raw))!.prologue).toBe(null);
    },
  );
  it("recupera metadados inválidos sem apagar personagem nem campanha", () => {
    const raw = JSON.parse(
      serialize(
        createPlayer(),
        { stage: 0, kills: 0, rewardClaimed: false },
        [],
        [],
      ),
    );
    raw.prologue = { version: 1, step: "inventado" };
    const loaded = deserialize(JSON.stringify(raw))!;
    expect(loaded.player.coins).toBe(125);
    expect(loaded.prologue).toBe(null);
    expect(
      restorePrologue({ ...freshPrologue(), scenes: ["silence", "silence"] }),
    ).toBe(null);
  });
  it("pause e morte suspendem o sequenciador na atualização real do jogo", () => {
    const g = new Game();
    g.started = true;
    g.prologue = new Prologue(freshPrologue());
    g.prologue.begin();
    g.paused = true;
    g.renderer = { draw: vi.fn() } as any;
    g.audio.setListener = vi.fn();
    g.audio.scene = vi.fn();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal("requestAnimationFrame", vi.fn());
    g.tick(1000);
    expect(g.prologue.cinematic.elapsed).toBe(0);
    g.player.hp = 0;
    g.tick(2000);
    expect(g.prologue.cinematic.elapsed).toBe(0);
    expect(g.prologue.cinematic.id).toBe("silence");
    vi.unstubAllGlobals();
  });
  it("dica única com duração mínima, expiração, silêncio e repetição registrada", () => {
    const h = new TutorialHints(),
      seen: string[] = [];
    h.update(0, [HINTS[0], HINTS[3]], seen);
    expect(h.active!.id).toBe("combat");
    h.update(1, [], seen);
    expect(h.active).not.toBe(null);
    h.update(2, [], seen);
    expect(h.active).toBe(null);
    h.update(10, [HINTS[0]], seen);
    expect(h.active!.id).toBe("move");
    h.update(13, [HINTS[0]], seen);
    expect(h.active).toBe(null);
    h.update(10, [HINTS[0]], seen, true);
    expect(h.active!.id).toBe("move");
    expect(seen).toEqual(["combat", "move"]);
  });
});

describe("Acessibilidade do prólogo", () => {
  it("Enter no menu de pausa não pula a cena; durante a cena pula", () => {
    const g = new Game();
    g.started = true;
    g.prologue = new Prologue(freshPrologue());
    g.prologue.begin();
    g.skipCinematic = vi.fn();
    g.paused = true;
    g.key("enter");
    expect(g.skipCinematic).not.toHaveBeenCalled();
    g.paused = false;
    g.key("enter");
    expect(g.skipCinematic).toHaveBeenCalledOnce();
  });
  it("retorno em movimento reduzido é corte estático e não altera os dados do roteiro", () => {
    const c = new Cinematics();
    c.start("anomaly");
    const script = structuredClone(c.scene);
    const player = { x: 12, y: 12 };
    c.update(4);
    expect(c.frame(true, player)!.camera).toEqual(player);
    c.update(0.4);
    expect(c.frame(true, player)!.camera).toEqual(player);
    expect(c.frame(true, player)!.zoom).toBe(1);
    expect(c.scene).toEqual(script);
  });
});
