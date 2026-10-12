import { Combat } from "./combat";
import type { Game } from "./game";
import type { Enemy } from "./state";
import { stats } from "./state";
import { Cinematics } from "./cinematics";
import {
  freshChapter,
  chapterScene,
  BIZEL_ID,
  KHARN_ID,
  CHAPTER_ID,
  bizelEnemy,
  CHAPTER_REQUIREMENTS,
} from "./chapter-data";
import { distance, type Prop } from "./world";
export class ChapterDirector {
  cinematic = new Cinematics();
  constructor(readonly game: Game) {}
  get state() {
    return (
      this.game.exploration.chapter ??
      (this.game.exploration.chapter = freshChapter(true))
    );
  }
  known = (id: string) => this.game.exploration.journal.events.includes(id);
  get fighting() {
    return this.game.world.region === "ruins" && this.state.arena === "fight";
  }
  startScene(id: string) {
    const boss = this.game.enemies.find(
      (e) => e.id === (id === "bizel-intro" ? BIZEL_ID : KHARN_ID),
    );
    this.cinematic.start(
      chapterScene(id, this.game.player, boss, this.known("enter:ferrugem")),
    );
    this.game.input?.keys.clear();
    this.game.save();
  }
  finishScene() {
    const id = this.cinematic.finish();
    if (!id) return;
    if (!this.state.scenes.includes(id)) this.state.scenes.push(id);
    if (id === "kharn-intro") {
      Object.assign(
        this.game.player,
        this.game.world.nearestFree({ x: 14, y: 7 }),
      );
      this.state.arena = "fight";
      const boss = this.game.enemies.find((e) => e.id === KHARN_ID)!;
      boss.dormant = false;
      boss.phase = 1;
      boss.state = "recover";
      boss.timer = -0.5;
    }
    if (id === "kharn-outro") {
      this.state.arena = "cleared";
      this.game.world.arenaSealed = false;
      this.game.missionEvent("kharn-revelation", false);
    }
    if (id === "bizel-intro") {
      const boss = this.game.enemies.find((e) => e.id === BIZEL_ID);
      if (boss) {
        boss.dormant = false;
        boss.state = "recover";
        boss.timer = -0.5;
      }
    }
    this.game.player.action = "idle";
    this.game.player.attackTimer = 0;
    this.game.combat.pending = null;
    this.game.world.applyChanges(this.game.exploration.changes);
    this.game.renderer?.snap(this.game.player);
    this.game.input?.keys.clear();
    this.game.save();
  }
  mount() {
    const g = this.game;
    if (g.world.region === "pedralta" && this.known("talk:witness")) {
      const boss = bizelEnemy();
      const saved = g.exploration.regions.pedralta.encounters.find(
        (e) => e.id === BIZEL_ID,
      );
      if (saved) Object.assign(boss, saved);
      if (this.known("defeat:300")) {
        boss.hp = 0;
        boss.rewarded = true;
        boss.state = "dead";
        boss.timer = 4;
      }
      boss.dormant = !this.state.scenes.includes("bizel-intro");
      g.enemies.push(boss);
    }
    if (g.world.region === "ruins") {
      const boss = g.enemies.find((e) => e.id === KHARN_ID)!;
      const down = this.known("defeat:310");
      boss.dormant = !["intro", "fight", "ending", "cleared"].includes(
        this.state.arena,
      );
      if (down) {
        boss.hp = 0;
        boss.rewarded = true;
        boss.state = "recover";
        boss.timer = 0;
        boss.dormant = false;
      } else {
        boss.hp = boss.maxHp;
        boss.bossAttack = undefined;
        boss.phase = 1;
      }
      // A closed browser during combat resumes before the arena, with exploration intact.
      if (this.state.arena === "fight") {
        this.state.arena = "ready";
        Object.assign(g.player, { x: 14, y: 12 });
        boss.dormant = true;
      }
      g.world.arenaSealed = this.state.arena === "intro";
    }
  }
  resume() {
    if (this.game.world.region === "ruins") {
      if (this.state.arena === "intro") this.startScene("kharn-intro");
      if (this.state.arena === "ending") this.startScene("kharn-outro");
    }
  }
  update(dt: number) {
    const g = this.game;
    if (this.cinematic.id) {
      const frame = this.cinematic.frame();
      if (frame?.actorTo) {
        const dx = frame.actorTo.x - g.player.x,
          dy = frame.actorTo.y - g.player.y,
          d = Math.hypot(dx, dy);
        if (d > 0.08)
          g.world.move(g.player, {
            x: (dx / d) * Math.min(d, dt * 0.5),
            y: (dy / d) * Math.min(d, dt * 0.5),
          });
      }
      for (const e of g.enemies)
        if (e.appearance === "kharn" || e.appearance === "bizel")
          e.animTime += dt;
      if (this.cinematic.update(dt)) this.finishScene();
      return;
    }
    if (
      g.world.region === "pedralta" &&
      this.known("talk:witness") &&
      !this.known("defeat:300")
    ) {
      let boss = g.enemies.find((e) => e.id === BIZEL_ID);
      if (!boss) {
        boss = bizelEnemy();
        boss.dormant = true;
        g.enemies.push(boss);
      }
      if (
        distance(g.player, boss) < 5 &&
        !this.state.scenes.includes("bizel-intro") &&
        !g.prologue.locked
      ) {
        boss.dormant = false;
        this.startScene("bizel-intro");
      }
    }
    if (this.fighting) {
      g.world.arenaSealed = true;
      g.world.applyChanges(g.exploration.changes);
    }
  }
  phase(e: Enemy) {
    if (e.id === KHARN_ID && e.phase! >= 2)
      this.startScene(`kharn-phase-${e.phase}`);
  }
  down(e: Enemy) {
    if (e.id !== KHARN_ID) return false;
    e.rewarded = true;
    e.state = "recover";
    e.bossAttack = undefined;
    this.state.arena = "ending";
    gStop(this.game);
    this.game.missionEvent("defeat:310", false);
    if (!this.game.exploration.bosses.includes("ruins:310"))
      this.game.exploration.bosses.push("ruins:310");
    this.startScene("kharn-outro");
    return true;
  }
  respawn() {
    const g = this.game;
    if (
      g.world.region !== "ruins" ||
      !this.state.checkpoint ||
      this.state.arena === "cleared"
    )
      return false;
    this.cinematic.finish();
    this.state.arena = this.known("defeat:310") ? "ending" : "ready";
    g.world.arenaSealed = false;
    g.world.applyChanges(g.exploration.changes);
    const boss = g.enemies.find((e) => e.id === KHARN_ID)!;
    Object.assign(boss, {
      x: 14,
      y: 5,
      hp: this.known("defeat:310") ? 0 : boss.maxHp,
      rewarded: this.known("defeat:310"),
      state: "patrol",
      bossAttack: undefined,
      bossCycle: 0,
      phase: 1,
      dormant: !this.known("defeat:310"),
    });
    Object.assign(g.player, {
      x: 14,
      y: 12,
      hp: stats(g.player).maxHp,
      mp: stats(g.player).maxMp,
      action: "idle",
      animTime: 0,
      attackTimer: 0,
      invulnerable: 3,
    });
    g.player.coins = Math.max(0, g.player.coins - 25);
    g.combat.engine.cancelAudio();
    g.combat = new Combat(g);
    g.player.resource = 0;
    g.player.guard = 0;
    g.player.stealth = false;
    g.projectiles = [];
    g.effects = [];
    g.paused = false;
    g.onStart();
    g.renderer.snap(g.player);
    g.save();
    this.resume();
    return true;
  }
  interact(o: Prop): boolean | null {
    const g = this.game,
      id = o.interaction;
    if (id === "lenir" && !g.exploration.campaign.rewardClaimed) {
      g.notify(
        "Lenir: investigue o selo e reúna as memórias da Margem. Elas podem revelar o caminho além das ruínas.",
      );
      return false;
    }
    if (
      o.kind === "npc" &&
      g.world.region === "pedralta" &&
      g.exploration.campaign.rewardClaimed
    ) {
      if (id === "lenir") {
        g.acceptSideMission(CHAPTER_ID);
        g.trackMission(CHAPTER_ID);
        g.missionEvent("talk:lenir", false);
        if (this.known("bizel-record")) g.missionEvent("report:lenir", false);
      } else if (o.id === "npc-10-14" && this.known("ash-record"))
        g.missionEvent("talk:witness", false);
      else return null;
      g.dialogueNPC = id ?? "guardian";
      g.dialogueOpen = true;
      g.dialogueStep = 0;
      g.onDialogue();
      g.save();
      return true;
    }
    if (
      !id ||
      ![
        "ash-record",
        "bizel-record",
        "ruins-record",
        "prism-blue",
        "oath",
        "prism-violet",
        "core-record",
        "rest",
        "arena",
        "fragment",
        "ruins-shortcut",
      ].includes(id)
    )
      return null;
    if (!g.exploration.campaign.rewardClaimed) {
      g.notify(
        "Lenir poderá interpretar estes registros depois que as memórias da Margem forem reunidas.",
      );
      return false;
    }
    const missing = (CHAPTER_REQUIREMENTS[id] ?? []).find(
      (event) => !this.known(event),
    );
    if (missing) {
      g.notify(
        missing.startsWith("defeat:")
          ? "O vigia ainda protege esta estrutura. Derrote-o antes de tocar no mecanismo."
          : "Falta uma pista ou um prisma. Consulte o registro e o objetivo no diário.",
      );
      return false;
    }
    if (id === "arena") {
      if (this.state.arena !== "ready") {
        g.notify("O salão já foi aberto.");
        return false;
      }
      this.state.checkpoint = true;
      this.state.arena = "intro";
      g.missionEvent("arena-open", false);
      Object.assign(g.player, g.world.nearestFree({ x: 14, y: 8 }), {
        action: "walk",
        animTime: 0,
      });
      const boss = g.enemies.find((e) => e.id === KHARN_ID)!;
      boss.dormant = false;
      boss.hp = boss.maxHp;
      boss.phase = 1;
      boss.bossAttack = undefined;
      g.world.arenaSealed = true;
      g.world.applyChanges(g.exploration.changes);
      this.startScene("kharn-intro");
      return true;
    }
    if (id === "rest") {
      this.state.checkpoint = true;
      g.player.hp = stats(g.player).maxHp;
      g.player.mp = stats(g.player).maxMp;
      g.save();
      g.notify(
        "Fonte restaurada: vida e mana recuperadas. Prepare sua mochila e habilidades antes do salão.",
      );
      return true;
    }
    if (id === "fragment") {
      g.notify(
        this.known("kharn-revelation")
          ? "Registro: Kharn guardava um fragmento; marcas de transporte apontam para as caldeiras de Ferrugem."
          : "O fragmento permanece sob o selo.",
      );
      return true;
    }
    if (
      ["prism-blue", "prism-violet", "ruins-shortcut"].includes(id) &&
      !g.exploration.changes.includes(id)
    )
      g.exploration.changes.push(id);
    g.missionEvent(id, false);
    o.opened = true;
    const texts: Record<string, string> = {
      "ash-record":
        "Registro de um morador: Bizel passou pela trilha leste após o ataque. As marcas apontam para uma entrada isolada. Mostre o registro à Guardiã.",
      "bizel-record":
        "Mapa de Bizel: uma entrada ao norte da Margem leva ao salão isolado. Lenir pode identificar o trajeto.",
      "ruins-record":
        "Inscrição: dois condutores mantêm o salão isolado. Afine o prisma azul, encontre o registro dos condutores e restaure o prisma violeta.",
      "prism-blue":
        "O Prisma Azul acendeu. A muralha do átrio abriu de verdade.",
      oath: "Registro: Kharn foi encarregado de guardar aquilo que restou sob o selo. O condutor violeta protege a entrada do salão.",
      "prism-violet":
        "O Prisma Violeta responde. A escadaria do salão está aberta.",
      "core-record":
        "Registro fragmentado: o selo isola um fragmento do Núcleo. A corrupção pressiona a estrutura pelo lado de fora. Marcas de carregamento foram apagadas.",
      "ruins-shortcut":
        "Escadaria lateral liberada. O atalho volta à ala do Prisma Azul.",
    };
    g.audioEvent(
      ["prism-blue", "prism-violet", "ruins-shortcut"].includes(id)
        ? "object.portal"
        : "loot.quest",
      { position: o },
    );
    g.combat.effect("nova", o, "#9686f4", 1.2, 0.8);
    g.notify(texts[id] ?? o.name!);
    g.save();
    return true;
  }
  dialogue(): string | null {
    const g = this.game;
    if (g.world.region === "kharn" && this.known("kharn-revelation"))
      return "Iria: o salão voltou a responder, mas Kharn permanece junto ao fragmento. As marcas de transporte passam pela Estrada das Caldeiras. Elcio, em Ferrugem, pode explicar o que saiu de lá.";
    if (g.world.region !== "pedralta" || !g.exploration.campaign.rewardClaimed)
      return null;
    if (g.dialogueNPC === "lenir") {
      if (this.known("kharn-revelation"))
        return "Kharn guardava um fragmento, então. A corrupção nas ruínas era parte de algo maior. Elcio conhece as caldeiras de Ferrugem. Procure-o; eu vou preservar estes registros.";
      if (this.known("report:lenir"))
        return "As Ruínas Esquecidas ficam ao norte da Margem, além do Marco da Memória. Os dois condutores aparecem neste mapa. Leve recursos e leia as inscrições antes de avançar.";
      if (this.known("bizel-record"))
        return "Estas marcas coincidem com a entrada isolada da Margem. Bizel sabia onde ela estava. Vou indicar a passagem no seu mapa.";
      if (this.known("talk:witness"))
        return "A trilha leste passa perto do esconderijo de Bizel. Ele deixou as mesmas marcas nas casas atacadas. Vá preparado; depois, procure algo que explique o destino dele.";
      if (this.known("ash-record"))
        return "Não tire uma conclusão só pelo nome. Mostre o registro à Guardiã: ela acompanhou os ataques e pode confirmar o caminho.";
      return "As memórias que você trouxe falam de uma entrada isolada. Nos ataques, encontrei marcas parecidas. Há um registro chamuscado perto da trilha. Leia-o primeiro.";
    }
    if (g.dialogueNPC === "guardian" && this.known("talk:witness"))
      return this.known("kharn-revelation")
        ? "Você ouviu o guardião. Agora sabemos por que o selo resistia. Procure Elcio em Ferrugem e siga as marcas de transporte."
        : "Reconheço estas marcas. Bizel passou pela trilha leste, perto das ruínas da vila. As memórias da Margem não mostram tudo que existe além daquela entrada.";
    return null;
  }
}
function gStop(g: Game) {
  g.projectiles = [];
  g.audio.stopEffects();
}
