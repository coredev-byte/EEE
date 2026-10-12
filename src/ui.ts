import { missionJournal, ferrugemDialogue } from "./mission-ui";
import { selectedMission } from "./missions";
import { PASSAGES, passageOpen } from "./regions";
import { hudIcon } from "./hud-icons";
import { REGIONS } from "./regions";
import { type AudioSettings } from "./audio-catalog";
import { effectFrame } from "./effect-art";
import { Combat } from "./combat";
import { skillPanel } from "./skill-panel";
import {
  learn,
  assign,
  respec,
  saveBuild,
  restoreBuild,
  equippedSkills,
  RESOURCES,
  NODE_BY_ID,
  syncPoints,
} from "./skills";
import { VIEW } from "./spatial";
import { drawMinimap } from "./minimap";
import { CLASSES, ITEMS, type ClassId } from "./data";
import { stats } from "./state";
import { inventoryPanel } from "./inventory";
import { load } from "./save";
import type { Game } from "./game";
import { CoverScene } from "./cover";
const icon = (index: number, extra = "") =>
  `<span class="item-icon ${extra}" style="background-position:-${index * 48}px 0" aria-hidden="true"></span>`;
const button = (text: string, action: string, cls = "") =>
  `<button class="${cls}" data-action="${action}">${text}</button>`;
const coverFrame = `<svg class="cover-frame" viewBox="0 0 420 60" preserveAspectRatio="none" aria-hidden="true"><path d="M30 7H390V53H30Z M32 9H388V51H32Z"/><path d="M4 30L12 22L20 30L12 38Z M12 26L16 30L12 34L8 30Z M20 30H30 M416 30L408 22L400 30L408 38Z M408 26L412 30L408 34L404 30Z M390 30H400"/></svg>`;
const coverButton = (text: string, action: string, label: string, selected = false, disabled = false) =>
  `<button class="cover-action${selected ? " is-selected" : ""}" data-action="${action}" aria-label="${label}" ${disabled ? 'disabled title="Nenhuma jornada salva neste navegador"' : ""}>${coverFrame}<span>${text}</span></button>`;
const titles: Record<string, string> = {
  inventory: "Inventário & equipamentos",
  skills: "Árvore de habilidades",
  classes: "Escolha seu caminho",
  settings: "Configurações",
  exit: "Até a próxima jornada",
  quests: "Diário de missões",
  dialogue: "Guardiã de Pedralta",
  pause: "A noite pode esperar",
};
export class UI {
  panel = "";
  selectedNode = "";
  previewSkill = false;
  confirmRespec = false;
  lastHUD = 0;
  private hudLayoutDirty = true;
  private coverScene: CoverScene | null = null;
  private portraitClass: ClassId | null = null;
  selectedItem = "brasa";
  inventoryFilter = "all";
  comparing = false;
  confirmingDiscard = false;
  selectedClass: ClassId = "guerreiro";
  newGameSelection = false;
  minimap: HTMLCanvasElement;
  modal: HTMLElement;
  portrait: HTMLCanvasElement;
  constructor(readonly game: Game) {
    document.querySelector("#app")!.innerHTML = `
   <header class="topbar"><a class="wordmark" href="#" aria-label="Distrito Zero">DISTRITO <span>ZER<span class="zero">O</span></span></a><span class="edition">CRÔNICAS DE PEDRALTA <i></i> CAPÍTULO I</span><nav aria-label="Menus do jogo"><button data-panel="quests">DIÁRIO <kbd>J</kbd></button><button data-panel="inventory">INVENTÁRIO <kbd>I</kbd></button><button data-panel="settings" aria-label="Configurações">SISTEMA <kbd>M</kbd></button></nav></header>
   <main><div class="scene-label"><span id="region-caption"><i class="live-dot"></i> VILA PEDRALTA</span><span>UM MUNDO EM RUÍNAS. SEU PRÓPRIO CAMINHO.</span></div>
   <section class="game-shell" aria-label="Distrito Zero, RPG de ação"><div class="game-viewport"><canvas id="game" width="${VIEW.width}" height="${VIEW.height}" tabindex="0" aria-label="Mundo do jogo: use WASD para mover, clique esquerdo para atacar e 1 a 4 para habilidades"></canvas>
   <div class="hud" id="hud"><section class="player-hud"><div class="portrait-frame"><canvas id="portrait" width="64" height="64"></canvas></div><span class="level-medallion" aria-label="Nível">Nv. <b id="level">1</b></span><div class="bars"><div class="bar-row"><label title="Vida">${hudIcon("life")}<span class="hud-accessible">HP</span></label><div class="bar hp"><i id="hp-fill"></i><span id="hp-value"></span></div></div><div class="bar-row"><label title="Mana">${hudIcon("mana")}<span class="hud-accessible">MP</span></label><div class="bar mp"><i id="mp-fill"></i><span id="mp-value"></span></div></div><div class="bar-row"><label title="Experiência">${hudIcon("xp")}<span class="hud-accessible">XP</span></label><div class="bar xp"><i id="xp-fill"></i><span id="xp-value"></span></div></div></div></section>
   <div class="location"><span class="location-mark"></span> VILA PEDRALTA <span>— SETOR LESTE</span></div><button class="quest-hud" data-panel="quests"><span class="quest-name"><span class="diamond"></span> O ECO DE KHARN</span><span id="quest-objective">Encontre a entrada das ruínas</span><span class="quest-checklist" id="quest-checklist"></span><small id="quest-progress">MISSÃO PRINCIPAL</small></button>
   <section class="minimap-box"><div class="map-label">PEDRALTA <span>N</span></div><canvas id="minimap" data-shape="isometric" width="192" height="144" aria-label="Minimapa da vila"></canvas><details class="map-key"><summary aria-label="Legenda do minimapa" title="Legenda do minimapa">?</summary><div class="map-legend" aria-label="Legenda do minimapa"><strong>MINIMAPA</strong><span>${hudIcon("main")} Objetivo principal</span><span>${hudIcon("secondary")} Objetivo secundário</span><span>${hudIcon("player")} Você · posição e direção</span><span>${hudIcon("exit")} Saída / Passagem</span><span>${hudIcon("xp")} Ponto de interesse</span><span>${hudIcon("enemy")} Inimigo / Chefe</span><div class="map-coordinates" id="coordinates"></div><div class="map-connection" id="map-connection"></div></div></details></section>
   <div class="loot-notifications" id="loot-notifications" role="status" aria-label="Itens coletados"></div><div class="skillbar" id="skillbar"></div><div class="quickbar" id="quickbar"></div><div class="interact" id="interact"></div><div class="toast" role="status" id="toast"></div><div class="class-name" id="class-name"></div></div>
   <div class="loading" id="loading"><div class="loading-rune"></div><span>DESPERTANDO PEDRALTA</span></div><div class="menu-layer" id="menu-layer"></div><div class="modal-layer" id="modal-layer" hidden></div>
   </div></section><div class="underbar"><span class="connection"><i class="live-dot"></i> <span id="save-state">SALVAMENTO LOCAL</span></span><div class="controls"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> MOVER</span><span><kbd>SHIFT</kbd> CORRER</span><span><kbd>MOUSE</kbd> ATACAR</span><span><kbd>F</kbd> INTERAGIR</span><span><kbd>ESC</kbd> PAUSA</span></div><button id="sound-toggle" aria-label="Alternar áudio">ÁUDIO · ON</button></div>
   </main><footer><span>DISTRITO ZERO <b> / </b> O ECO DE KHARN</span><span>AS RUÍNAS LEMBRAM. VOCÊ ESCOLHE.</span><span class="build">VERSÃO DE DESENVOLVIMENTO · 0.1</span></footer>`;
    this.minimap = document.querySelector("#minimap")!;
    this.modal = document.querySelector("#modal-layer")!;
    this.portrait = document.querySelector("#portrait")!;
    document.addEventListener("input", (e) => {
      const slider = e.target as HTMLInputElement;
      if (!slider.dataset.volume) return;
      game.audio.setVolume(
        slider.dataset.volume as keyof Omit<AudioSettings, "muted">,
        Number(slider.value) / 100,
      );
      slider.parentElement!.querySelector("output")!.textContent =
        slider.value + "%";
    });
    document.addEventListener("click", (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-action],[data-panel],[data-skill],[data-potion],[data-equip],[data-class],[data-unequip],[data-item],[data-filter],[data-node],[data-tree-action]",
      );
      if (!el) return;
      const unlockWasNeeded = !game.audio.context;
      game.audio.unlock();
      if (el.dataset.action === "cover-audio") {
        if (!unlockWasNeeded || !game.audio.enabled) game.audio.toggle();
        this.syncCoverAudio();
        return;
      }
      if (el.dataset.node) {
        this.selectedNode = el.dataset.node;
        this.previewSkill = false;
        this.confirmRespec = false;
        this.renderPanel();
        if (innerWidth <= 600)
          this.modal
            .querySelector(".tree-detail")
            ?.scrollIntoView({ block: "start" });
      }
      if (el.dataset.treeAction) this.treeAction(el.dataset.treeAction);
      if (el.dataset.panel) {
        if (game.started) this.open(el.dataset.panel);
      }
      if (el.dataset.skill !== undefined && !game.paused)
        game.combat.attack(game.target(), Number(el.dataset.skill));
      if (el.dataset.potion !== undefined && !game.paused)
        game.potion(Number(el.dataset.potion));
      if (el.dataset.item) {
        game.audioEvent("ui.select");
        this.selectedItem = el.dataset.item;
        this.confirmingDiscard = false;
        this.renderPanel();
      }
      if (el.dataset.filter) {
        this.inventoryFilter = el.dataset.filter;
        this.renderPanel();
      }
      if (el.dataset.equip) {
        game.equip(el.dataset.equip);
        this.renderPanel();
      }
      if (el.dataset.unequip) {
        game.equip(
          null,
          el.dataset.unequip as "weapon" | "armor" | "accessory",
        );
        this.renderPanel();
      }
      if (el.dataset.class) {
        if (this.newGameSelection) {
          this.selectedClass = el.dataset.class as ClassId;
          this.renderPanel();
        } else {
          game.changeClass(el.dataset.class as ClassId);
          this.renderPanel();
        }
      }
      if (el.dataset.action) this.action(el.dataset.action);
      this.syncCoverAudio();
    });
    document.querySelector("#sound-toggle")!.addEventListener("click", () => {
      game.audio.toggle();
      this.updateSound();
    });
    window.addEventListener(
      "keydown",
      (e) => {
        const menu = document.querySelector(".cover-menu");
        if (menu && !this.panel && !game.started && !e.repeat) {
          const options = Array.from(menu.querySelectorAll<HTMLButtonElement>(".cover-action:not(:disabled)"));
          const index = Math.max(0, options.findIndex((option) => option.classList.contains("is-selected")));
          let next: HTMLButtonElement | undefined;
          if (e.key === "ArrowDown") next = options[(index + 1) % options.length];
          if (e.key === "ArrowUp") next = options[(index + options.length - 1) % options.length];
          if (e.key === "Home") next = options[0];
          if (e.key === "End") next = options[options.length - 1];
          if (next || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (next) next.focus();
            else {
              const focused = document.activeElement;
              if (focused instanceof HTMLButtonElement && focused.matches(".cover-audio")) focused.click();
              else options[index]?.click();
            }
            return;
          }
        }
        if (!["inventory", "equipment"].includes(this.panel) || e.repeat)
          return;
        const action = { e: "equip-selected", c: "compare", r: "discard" }[
          e.key.toLowerCase()
        ];
        if (action) {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.action(action);
        }
      },
      true,
    );
    const selectCoverAction = (event: Event) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>(".cover-action:not(:disabled)")
        : null;
      if (!target || this.panel) return;
      const menu = target.closest(".cover-menu")!;
      menu.querySelectorAll(".cover-action").forEach((option) =>
        option.classList.toggle("is-selected", option === target),
      );
    };
    document.addEventListener("pointerover", selectCoverAction);
    document.addEventListener("focusin", selectCoverAction);
    const layout = new ResizeObserver(() => {
      this.hudLayoutDirty = true;
      this.layoutInventory();
    });
    layout.observe(document.querySelector(".game-viewport")!);
    for (const selector of [
      ".player-hud",
      ".location",
      ".quest-hud",
      ".minimap-box",
    ])
      layout.observe(document.querySelector(selector)!);
    game.onDialogue = () => this.open("dialogue");
    game.onUpdate = () => {
      this.update();
      this.syncCoverAudio();
    };
    game.onMenu = (p) => {
      if (this.panel === "death") return;
      if (this.panel) this.close();
      else this.open(p);
    };
    game.onStart = () => {
      this.coverScene?.dispose();
      this.coverScene = null;
      document.body.classList.remove("cover-active");
      document.querySelector("#menu-layer")!.innerHTML = "";
      this.modal.hidden = true;
      this.panel = "";
      document.querySelector("#hud")!.classList.add("visible");
    };
    game.onDeath = () => {
      this.panel = "death";
      game.paused = true;
      game.audio.setPaused(true);
      this.renderPanel();
    };
  }
  ready() {
    document.querySelector("#loading")!.remove();
    this.drawPortrait();
    this.mainMenu();
  }
  mainMenu() {
    this.coverScene?.dispose();
    document.body.classList.add("cover-active");
    this.game.audio.stopEffects();
    this.game.audio.setPaused(true);
    this.game.dialogueOpen = false;
    this.game.started = false;
    const saved = load();
    this.game.paused = true;
    document.querySelector("#hud")!.classList.remove("visible");
    document.querySelector("#menu-layer")!.innerHTML =
      `<nav class="cover-menu" aria-label="Menu principal de Distrito Zero">
        <img class="cover-art" src="/assets/interface/distrito-zero-background.png" alt="Distrito Zero: cidade em ruínas sob o luar, iluminada por lanternas" width="1672" height="941" fetchpriority="high">
        <canvas class="cover-scene" aria-hidden="true"></canvas>
        <div class="cover-content">
        <div class="cover-title"><h1>DISTRITO<span>ZERO<b>.</b></span></h1><div class="cover-divider" aria-hidden="true"><i></i></div></div>
        <div class="cover-actions">
          ${coverButton("CONTINUAR", "continue", "CONTINUAR JORNADA", !!saved, !saved)}
          ${coverButton("NOVO JOGO", "new", saved ? "NOVA JORNADA" : "INICIAR JORNADA", !saved)}
          ${coverButton("CONFIGURAÇÕES", "cover-settings", "CONFIGURAÇÕES")}
          ${coverButton("SAIR", "exit", "SAIR")}
        </div>
        </div>
        <button class="cover-audio" data-action="cover-audio" aria-label="Ativar música temática" aria-pressed="false">♫ ATIVAR MÚSICA</button>
      </nav>`;
    this.coverScene = new CoverScene(document.querySelector(".cover-scene")!, this.game.assets);
    this.syncCoverAudio();
  }
  private syncCoverAudio() {
    const button = document.querySelector<HTMLButtonElement>(".cover-audio");
    if (!button) return;
    const unlocked = !!this.game.audio.context;
    const text = !unlocked ? "♫ ATIVAR MÚSICA" : this.game.audio.enabled ? "♫ MÚSICA · ON" : "♫ MÚSICA · OFF";
    if (button.textContent === text) return;
    button.textContent = text;
    button.setAttribute("aria-label", !unlocked || !this.game.audio.enabled ? "Ativar música temática" : "Silenciar música temática");
    button.setAttribute("aria-pressed", String(unlocked && this.game.audio.enabled));
  }
  drawPortrait() {
    const classId = this.game.player.classId;
    const sprite = this.game.assets.images[classId === "guerreiro" ? "hero" : classId];
    const c = this.portrait.getContext("2d")!;
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#101728";
    c.fillRect(0, 0, 64, 64);
    c.drawImage(sprite, 24, 26, 48, 50, 0, 0, 64, 64);
    this.portraitClass = classId;
    this.portrait.dataset.classId = classId;
    this.portrait.setAttribute("aria-label", `Busto de ${CLASSES[classId].name}`);
  }
  action(action: string) {
    const g = this.game;
    if (action === "cover-settings") {
      this.open("settings");
      return;
    }
    if (action === "exit") {
      this.open("exit");
      return;
    }
    if (
      action.startsWith("mission-accept:") ||
      action.startsWith("mission-track:") ||
      action === "mission-buy"
    ) {
      if (action.startsWith("mission-accept:"))
        g.acceptSideMission(action.split(":")[1]);
      else if (action.startsWith("mission-track:"))
        g.trackMission(action.split(":")[1]);
      else g.buySupplies();
      this.renderPanel();
      return;
    }
    if (action === "campaign-accept" || action === "campaign-claim") {
      g.audioEvent("dialogue.choice");
      if (action === "campaign-accept") g.acceptCampaign();
      else g.claimCampaign();
      g.dialogueStep = 1;
      this.renderPanel();
      return;
    }
    if (action.startsWith("dialogue-")) {
      g.audioEvent(
        action === "dialogue-next" ? "dialogue.next" : "dialogue.choice",
      );
      if (action === "dialogue-accept" && !g.quest.accepted) {
        g.quest.accepted = true;
        g.audioEvent("quest.accept");
        g.save();
      }
      g.dialogueStep = 1;
      this.renderPanel();
      return;
    }
    if (
      ["equip-selected", "compare", "discard", "use-potion"].includes(action)
    ) {
      const item = ITEMS.find(
        (item) =>
          item.id === this.selectedItem && g.player.inventory.includes(item.id),
      );
      if (action === "equip-selected") {
        if (item) g.equip(item.id);
        else if (this.selectedItem.startsWith("potion-"))
          g.potion(Number(this.selectedItem.slice(7)));
      }
      if (action === "compare") {
        g.audioEvent("equipment.compare");
        this.comparing = !this.comparing;
      }
      if (action === "use-potion") g.potion(Number(this.selectedItem.slice(7)));
      if (action === "discard" && item) {
        if (this.confirmingDiscard) {
          if (g.player.equipment[item.slot] === item.id)
            g.equip(null, item.slot);
          g.player.inventory.splice(g.player.inventory.indexOf(item.id), 1);
          this.selectedItem = "";
          this.confirmingDiscard = false;
          g.save();
        } else this.confirmingDiscard = true;
      } else this.confirmingDiscard = false;
      this.renderPanel();
      return;
    }
    if (action === "continue") {
      if (load()) g.start();
      return;
    }
    if (action === "new") {
      this.newGameSelection = true;
      this.open("classes");
      return;
    }
    if (action === "begin") {
      g.start(this.selectedClass);
      this.newGameSelection = false;
      return;
    }
    if (action === "close") {
      if (!g.started) {
        this.modal.hidden = true;
        this.panel = "";
      } else this.close();
      return;
    }
    if (action === "resume") {
      this.close();
      return;
    }
    if (action === "respawn") {
      this.close();
      g.respawn();
      return;
    }
    if (action === "unlock") {
      g.unlock();
      this.renderPanel();
      return;
    }
    if (action === "save") {
      g.save();
      g.notify("Sua jornada foi salva neste navegador.");
      this.renderPanel();
      return;
    }
    if (action === "menu") {
      g.audio.stopEffects();
      g.save();
      this.modal.hidden = true;
      this.panel = "";
      this.mainMenu();
      return;
    }
    if (action === "sound") {
      g.audio.toggle();
      this.updateSound();
      this.renderPanel();
      return;
    }
    if (action === "fullscreen") {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.querySelector(".game-shell")!.requestFullscreen();
      return;
    }
    if (action === "help") this.open("help");
  }
  open(panel: string) {
    if (this.game.started && this.game.player.hp <= 0) return;
    this.game.audioEvent(panel === "dialogue" ? "dialogue.open" : "ui.open");
    this.game.audio.setPaused(true);
    this.panel = panel;
    this.confirmingDiscard = false;
    this.game.paused = true;
    this.game.input.keys.clear();
    this.renderPanel();
  }
  close() {
    this.game.audioEvent(
      this.panel === "dialogue" ? "dialogue.close" : "ui.close",
    );
    this.game.dialogueOpen = false;
    this.panel = "";
    this.modal.hidden = true;
    document.querySelector(".game-shell")!.classList.remove("inventory-open");
    this.modal.classList.remove("inventory-layer", "skills-layer");
    this.game.audio.stopPreviews();
    this.game.paused = !this.game.started || this.game.player.hp <= 0;
    this.game.audio.setPaused(this.game.paused);
    this.game.input.keys.clear();
  }
  layoutInventory() {
    const viewport = document
      .querySelector(".game-viewport")!
      .getBoundingClientRect();
    const hud = document.querySelector(".player-hud")!.getBoundingClientRect();
    const level = document
      .querySelector(".level-medallion")!
      .getBoundingClientRect();
    const gap = 12;
    this.modal.style.setProperty(
      "--inventory-top",
      `${Math.ceil(Math.max(hud.bottom, level.bottom) - viewport.top + gap)}px`,
    );
  }
  renderPanel() {
    const g = this.game,
      p = g.player;
    const treeScroll =
      this.modal.querySelector(".panel-skills")?.scrollTop ?? 0;
    this.modal.classList.toggle("skills-layer", this.panel === "skills");
    const inventory = ["inventory", "equipment"].includes(this.panel);
    this.modal.classList.toggle("inventory-layer", inventory);
    document
      .querySelector(".game-shell")!
      .classList.toggle("inventory-open", inventory);
    if (inventory) {
      this.layoutInventory();
      this.modal.hidden = false;
      this.modal.innerHTML = inventoryPanel(
        g,
        this.selectedItem,
        this.inventoryFilter,
        this.comparing,
        this.confirmingDiscard,
        this.panel === "equipment",
      );
      return;
    }
    let content = "",
      title = titles[this.panel] ?? "Antes de entrar na noite",
      eyebrow = "DISTRITO ZERO / PEDRALTA";
    if (this.panel === "classes") {
      content = `<p class="panel-intro">Quatro maneiras de atravessar a noite. Cada caminho tem armas, atributos e habilidades próprias.${this.newGameSelection && load() ? " Uma nova jornada substituirá seu salvamento ao iniciar." : ""}</p><div class="class-grid">${Object.entries(
        CLASSES,
      )
        .map(
          ([id, c]) =>
            `<button data-class="${id}" class="class-card ${id === (this.newGameSelection ? this.selectedClass : p.classId) ? "selected" : ""}" style="--class-color:${c.color}"><div class="class-art ${id}"></div><small>${c.subtitle}</small><h3>${c.name}</h3><p>${c.description}</p><div class="class-stats"><span>VIDA ${c.hp}</span><span>${c.basic === "slash" ? "CORPO A CORPO" : "À DISTÂNCIA"}</span></div><span class="class-selected">${id === (this.newGameSelection ? this.selectedClass : p.classId) ? "CAMINHO ESCOLHIDO" : "ESCOLHER CAMINHO"}</span></button>`,
        )
        .join(
          "",
        )}</div>${this.newGameSelection ? button("ENTRAR EM PEDRALTA →", "begin", "primary begin-button") : '<p class="subtle">Trocar de classe preserva inventário, nível e missão.</p>'}`;
    }
    if (this.panel === "skills") {
      content = skillPanel(g, this.selectedNode, this.previewSkill);
      if (this.confirmRespec)
        content =
          `<div class="tree-confirm">A reconfiguração custa moedas e devolve os pontos. <button data-tree-action="confirm-respec">CONFIRMAR RECONFIGURAÇÃO</button></div>` +
          content;
    }
    if (this.panel === "dialogue") {
      const c = g.exploration.campaign,
        kharn = g.world.region === "kharn";
      title = kharn ? "Iria, cartógrafa da Margem" : "Guardiã do Eco";
      eyebrow = `${REGIONS[g.world.region].short} / DIÁLOGO`;
      if (kharn) {
        content = `<div class="dialogue-panel"><p>${c.rewardClaimed ? "As memórias atravessaram o selo. A Margem voltou a fazer parte de Pedralta." : c.attuned.length === 3 ? "Os três marcos respondem. Retorne pelo selo ao sul e entregue as memórias à Guardiã." : g.dialogueStep === 0 ? "O selo não era uma prisão: era uma ponte esquecida. Três vigias guardam os marcos da Vigia, do Canal e da Memória. Silencie cada vigia e afine o marco com F." : "Siga a estrada ao norte até o Marco da Vigia; atravesse a abertura do aqueduto a leste para o Canal e continue ao norte para a Memória. Os marcos aparecem no minimapa."}</p><div>${!c.accepted ? button("REUNIR AS MEMÓRIAS", "campaign-accept", "primary") : ""}${button("MOSTRAR O CAMINHO", "dialogue-next", "secondary")}${button("VOLTAR À MARGEM", "close", "primary")}</div></div>`;
      } else if (g.quest.rewardClaimed) {
        content = `<div class="dialogue-panel"><p>${c.rewardClaimed ? "Pedralta se lembra de seus nomes. Você devolveu à vila as memórias da Margem. Os caminhos permanecem abertos." : c.attuned.length === 3 ? "Você reuniu as três memórias. Entregue-as para que Pedralta e Kharn voltem a compartilhar a mesma história." : "O selo tornou-se uma passagem. Entre na Margem de Kharn e procure Iria, a cartógrafa, junto ao aqueduto. Ela conhece os três marcos esquecidos."}</p><div>${c.attuned.length === 3 && !c.rewardClaimed ? button("ENTREGAR AS MEMÓRIAS", "campaign-claim", "primary") : ""}${button("VOLTAR À VILA", "close", "primary")}</div></div>`;
      } else
        content = `<div class="dialogue-panel"><p>${g.dialogueStep === 0 ? "Pedralta guarda mais do que ruínas. Há algo vivo sob as pedras." : `Kharn aguarda a nordeste. Vença três ameaças antes de atravessar o selo. ${Math.min(3, g.quest.kills)}/3 ameaças silenciadas.`}</p><div>${g.dialogueStep === 0 ? button("O QUE DEVO FAZER?", "dialogue-next", "secondary") + button(g.quest.accepted ? "MOSTRAR O CAMINHO" : "ACEITAR O CHAMADO", "dialogue-accept", "primary") : button("VOLTAR À VILA", "close", "primary")}</div></div>`;
    }
    if (this.panel === "quests") content = missionJournal(g);
    if (this.panel === "dialogue" && g.world.region === "ferrugem") {
      title =
        g.dialogueNPC === "nara"
          ? "Nara, operária do depósito"
          : "Elcio, mecânico das Caldeiras";
      content = ferrugemDialogue(g);
    }
    if (this.panel === "settings") {
      const audio = g.audio.snapshot();
      content = `<div class="audio-settings"><h3>Mixagem de Distrito Zero</h3><p>Controle música, ambiente, combate e interface separadamente.</p>${(["master", "music", "ambience", "combat", "ui"] as const).map((bus, i) => `<label><span>${["Volume principal", "Música", "Ambiente", "Combate", "Interface"][i]}</span><input type="range" min="0" max="100" step="1" value="${Math.round(g.audio.settings[bus] * 100)}" data-volume="${bus}" aria-label="${["Volume principal", "Música", "Ambiente", "Combate", "Interface"][i]}"><output>${Math.round(g.audio.settings[bus] * 100)}%</output></label>`).join("")}${button(g.audio.enabled ? "SILENCIAR ÁUDIO" : "ATIVAR ÁUDIO", "sound", "secondary")}<small>Configurações salvas neste navegador. Sem dublagem nesta versão.${audio.errors.length ? " Alguns arquivos de áudio estão indisponíveis; o jogo continua funcionando." : ""}</small></div><div class="settings-list"><div><span><strong>Tela cheia</strong><small>Amplie o mundo do jogo.</small></span>${button("ALTERNAR", "fullscreen", "secondary")}</div><div><span><strong>Salvamento local</strong><small>Automático e após equipamentos e recompensas.</small></span>${g.started ? button("SALVAR AGORA", "save", "secondary") : ""}</div></div>${this.helpContent()}`;
    }
    if (this.panel === "pause") {
      content = `<p class="pause-text">O mundo lá fora ainda espera.<br>Sua jornada continua quando você estiver pronto.</p><div class="pause-actions">${button("VOLTAR À JORNADA", "resume", "primary")}${button("SALVAR PROGRESSO", "save", "secondary")}${button("MENU PRINCIPAL", "menu", "text-button")}</div>`;
    }
    if (this.panel === "death") {
      title = "A noite venceu. Por enquanto.";
      eyebrow = "VOCÊ FOI DERROTADO";
      content = `<p class="pause-text">Pedralta ainda guarda o seu nome.<br>Retorne à vila. O custo do despertar é de 25 moedas.</p><div class="pause-actions">${button("DESPERTAR EM PEDRALTA", "respawn", "primary")}${button("MENU PRINCIPAL", "menu", "text-button")}</div>`;
    }
    if (this.panel === "help") content = this.helpContent();
    if (this.panel === "exit")
      content = `<p class="pause-text">Para sair do jogo, feche esta aba.<br>Seu progresso salvo permanece neste navegador.</p>${button("VOLTAR AO MENU", "close", "primary")}`;
    this.modal.hidden = false;
    this.modal.innerHTML = `<section class="panel panel-${this.panel}" role="dialog" aria-modal="true" aria-label="${title}"><div class="panel-top"><div><small>${eyebrow}</small><h2>${title}</h2></div>${this.panel === "death" ? "" : button("×", "close", "close-button")}</div>${content}<div class="panel-footer"><span>${REGIONS[g.world.region].name.toUpperCase()} — ${REGIONS[g.world.region].subtitle.toUpperCase()}</span><span>${this.game.started ? "O MUNDO ESTÁ PAUSADO" : "ESCOLHA O SEU CAMINHO"}</span></div></section>`;
    const tree = this.modal.querySelector(".panel-skills");
    if (tree) tree.scrollTop = treeScroll;
  }
  treeAction(action: string) {
    const g = this.game,
      p = g.player;
    let ok = false;
    if (action === "preview") {
      g.audio.stopOwner(`preview:${this.selectedNode}`);
      g.audioEvent("skill.activate", {
        skillId: this.selectedNode,
        preview: true,
        owner: `preview:${this.selectedNode}`,
      });
      this.previewSkill = true;
      this.renderPanel();
      return;
    }
    if (action === "learn") ok = learn(p, this.selectedNode);
    if (action.startsWith("assign-"))
      ok = assign(p, this.selectedNode, Number(action.slice(7)));
    if (action === "respec") {
      this.confirmRespec = true;
      this.renderPanel();
      return;
    }
    if (action === "confirm-respec" && !g.inCombat()) {
      ok = respec(p);
      this.confirmRespec = false;
    }
    if (action.startsWith("save-")) ok = saveBuild(p, Number(action.slice(5)));
    if (action.startsWith("load-") && !g.inCombat())
      ok = restoreBuild(p, Number(action.slice(5)));
    if (ok) {
      g.audioEvent("ui.select");
      if (action === "confirm-respec" || action.startsWith("load-"))
        g.combat.engine.cancelAudio();
      g.combat = new Combat(g);
      syncPoints(p);
      p.mp = Math.min(p.mp, stats(p).maxMp);
      g.save();
      g.notify("Configuração de habilidades salva.");
    } else g.notify("Requisitos não atendidos ou combate em andamento.");
    this.renderPanel();
  }
  helpContent() {
    return `<div class="section-heading">CONTROLES DA JORNADA</div><div class="help-grid"><div><kbd>W A S D</kbd><span>Mover o personagem</span></div><div><kbd>SHIFT</kbd><span>Correr</span></div><div><kbd>CLIQUE ESQUERDO</kbd><span>Ataque básico · mire com o mouse</span></div><div><kbd>1 2 3 4</kbd><span>Habilidades da classe</span></div><div><kbd>Z / X / V</kbd><span>Vida / mana / elixir</span></div><div><kbd>F</kbd><span>Conversar, abrir baú, entrar nas ruínas</span></div><div><kbd>I / C / K / J</kbd><span>Inventário / classes / habilidades / diário</span></div><div><kbd>M / ESC</kbd><span>Configurações / pausar</span></div></div><div class="hud-icon-guide"><strong>ÍCONES DA HUD</strong>${(
      [
        ["life", "Vida"],
        ["mana", "Mana"],
        ["xp", "XP"],
        ["inventory", "Inventário"],
        ["quests", "Missões"],
        ["settings", "Configurações"],
      ] as const
    )
      .map(([name, label]) => `<span>${hudIcon(name)} ${label}</span>`)
      .join(
        "",
      )}</div><p class="subtle">A seta dourada do minimapa marca o objetivo ativo; a seta azul mostra sua posição e direção. Baús guardam equipamentos. Inimigos concedem experiência e moedas. WASD move o personagem; 1–4 ativa habilidades; Z, X e V usam poções.</p>`;
  }
  drawSkillPreview() {
    const canvas = document.querySelector<HTMLCanvasElement>(
        "#skill-preview-canvas",
      ),
      n = NODE_BY_ID.get(this.selectedNode);
    if (!canvas || !n?.skill) return;
    const c = canvas.getContext("2d")!;
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, 240, 120);
    const t = (performance.now() / 1000) % 1.5,
      f = Math.min(7, Math.floor((t / 1.5) * 8)),
      kind = n.skill.kind;
    const art =
      this.game.assets.images[
        this.game.player.classId === "guerreiro"
          ? "hero"
          : this.game.player.classId
      ];
    c.drawImage(art, 0, 0, 96, 112, 15, 0, 96, 112);
    const row =
      kind === "projectile" || kind === "dash"
        ? 1
        : kind === "guard" || kind === "heal"
          ? 4
          : kind === "nova"
            ? 2
            : 0;
    const x =
      kind === "projectile"
        ? 75 + Math.floor(t * 80)
        : kind === "nova"
          ? 80
          : 100;
    c.drawImage(
      effectFrame(this.game.assets.images.effects, row, f, n.skill.color),
      0,
      0,
      128,
      128,
      x - 64,
      5,
      128,
      128,
    );
    c.fillStyle = n.skill.color;
    for (let i = 0; i < 5; i++)
      c.fillRect(
        x + Math.round(Math.sin(i + t * 8) * 24),
        60 + Math.round(Math.cos(i + t * 8) * 20),
        2,
        2,
      );
  }
  updateSound() {
    document.querySelector("#sound-toggle")!.textContent =
      `ÁUDIO · ${this.game.audio.enabled ? "ON" : "OFF"}`;
  }
  update() {
    if (this.hudLayoutDirty && this.game.renderer) {
      const viewport = document.querySelector("#game")!.getBoundingClientRect();
      if (viewport.width && viewport.height) {
        this.game.renderer.hudBounds = [
          ".player-hud",
          ".location",
          ".quest-hud",
          ".minimap-box",
        ].map((selector) => {
          const b = document.querySelector(selector)!.getBoundingClientRect();
          return {
            x: ((b.left - viewport.left) * VIEW.width) / viewport.width,
            y: ((b.top - viewport.top) * VIEW.height) / viewport.height,
            width: (b.width * VIEW.width) / viewport.width,
            height: (b.height * VIEW.height) / viewport.height,
          };
        });
        this.hudLayoutDirty = false;
      }
    }
    this.drawSkillPreview();
    const now = performance.now();
    if (now - this.lastHUD < 80) return;
    this.lastHUD = now;
    const g = this.game,
      p = g.player,
      s = stats(p);
    if (this.portraitClass !== p.classId) this.drawPortrait();
    for (const [key, value, max] of [
      ["hp", p.hp, s.maxHp],
      ["mp", p.mp, s.maxMp],
      ["xp", p.xp, s.xpGoal],
    ] as const) {
      document.querySelector<HTMLElement>(`#${key}-fill`)!.style.width =
        `${Math.max(0, value / max) * 100}%`;
      document.querySelector(`#${key}-value`)!.textContent =
        `${Math.floor(value)} / ${max}`;
    }
    document.querySelector("#level")!.textContent = String(p.level);
    const region = REGIONS[g.world.region];
    document.querySelector("#region-caption")!.innerHTML =
      `<i class="live-dot"></i> ${region.name.toUpperCase()}`;
    document.querySelector(".edition")!.innerHTML =
      `CRÔNICAS DE PEDRALTA <i></i> CAPÍTULO ${g.exploration.campaign.rewardClaimed ? "II" : "I"}`;
    document.querySelector(".location")!.innerHTML =
      `<span class="location-mark"></span> ${region.name.toUpperCase()} <span>— ${region.subtitle.toUpperCase()}</span>`;
    document.querySelector(".map-label")!.innerHTML =
      `<span class="map-region">${region.short}</span><b>N</b>`;
    this.minimap.setAttribute("aria-label", `Minimapa de ${region.name}`);
    document.querySelector("#map-connection")!.textContent = PASSAGES.filter(
      (passage) =>
        passage.region === g.world.region &&
        (passage.id ===
          `portal-${region.connection.x}-${region.connection.y}` ||
          g.exploration.knownPassages.includes(
            `${passage.region}:${passage.id}`,
          )),
    )
      .map(
        (passage) =>
          `${passageOpen(passage, g.exploration, g.quest.rewardClaimed) ? "PASSAGEM →" : "SELO FECHADO →"} ${REGIONS[passage.destination].short}`,
      )
      .join(" · ");
    document.querySelector("#coordinates")!.textContent =
      `${p.x.toFixed(1)} · ${p.y.toFixed(1)} / ${g.exploration.regions[g.world.region].discovered.length} ÁREAS`;
    document.querySelector(".quest-name")!.innerHTML =
      `<span class="diamond"></span> ${selectedMission(g.exploration, g.quest)?.definition.name.toUpperCase() ?? "FERRUGEM · EXPLORAÇÃO"}`;
    document.querySelector("#quest-objective")!.textContent = g.objective();
    const mission = selectedMission(g.exploration, g.quest);
    document.querySelector("#quest-checklist")!.innerHTML = mission
      ? mission.definition.steps
          .map((step, i) => ({ text: step.text, done: mission.done[i], active: i === mission.stage }))
          .filter((step) => !step.active)
          .slice(0, 2)
          .map((step) => `<span class="quest-check ${step.done ? "done" : "pending"}"><span aria-hidden="true">${step.done ? "◆" : "□"}</span>${step.text}</span>`)
          .join("")
      : "";
    document.querySelector("#quest-progress")!.textContent = g.exploration
      .campaign.rewardClaimed
      ? (selectedMission(
          g.exploration,
          g.quest,
        )?.definition.chapter.toUpperCase() ?? "EXPLORAÇÃO LIVRE")
      : g.quest.rewardClaimed
        ? "CAPÍTULO II"
        : "MISSÃO PRINCIPAL";
    document.querySelector("#class-name")!.innerHTML =
      `<span>${CLASSES[p.classId].name.toUpperCase()}</span><i></i><span>${p.coins.toLocaleString("pt-BR")} MOEDAS</span>`;
    document.querySelector("#skillbar")!.innerHTML = equippedSkills(p)
      .map((skill, i) =>
        skill
          ? `<button class="ability ${p.mp < skill.cost ? "no-mana" : ""}" data-skill="${i}" title="${skill.name} — ${skill.description}" aria-label="${skill.name}">${icon(skill.icon)}<span class="ability-cooldown" style="height:${Math.min(100, (p.cooldowns[i] / skill.cooldown) * 100)}%"></span>${p.cooldowns[i] > 0 ? `<strong class="cooldown-count">${p.cooldowns[i].toFixed(1)}</strong>` : ""}<kbd>${i + 1}</kbd></button>`
          : `<button class="ability locked" data-panel="skills" title="Escolha uma habilidade na árvore" aria-label="Slot ${i + 1} vazio"><span class="lock-mark">+</span><kbd>${i + 1}</kbd></button>`,
      )
      .join("");
    document.querySelector("#class-name")!.innerHTML +=
      `<i></i><span>${RESOURCES[p.classId].toUpperCase()} ${Math.floor(p.classId === "arcanista" ? p.mp : p.resource)}${p.classId === "arcanista" ? "" : p.classId === "assassino" ? "/10" : "/100"}</span>`;
    document.querySelector("#quickbar")!.innerHTML =
      p.potions
        .map(
          (count, i) =>
            `<button class="ability potion" data-potion="${i}" title="${["Poção de vida +100 HP", "Poção de mana +70 MP", "Elixir +50 HP / +40 MP"][i]}" aria-label="${["Poção de vida", "Poção de mana", "Elixir"][i]}">${icon(i + 4)}<strong class="item-count">${count}</strong><kbd>${"ZXV"[i]}</kbd></button>`,
        )
        .join("") +
      `<button class="ability menu-key" data-panel="inventory" title="Inventário">${icon(7)}<kbd>I</kbd></button>`;
    document.querySelector("#loot-notifications")!.innerHTML = g.pickups
      .slice(-3)
      .map(
        (x) =>
          `<div class="loot-notice ${x.rarity === "Comum" ? "" : "rare"}">${x.id === "coins" ? '<span class="loot-coin">◈</span>' : icon(x.icon)}<div><strong>${x.count > 1 ? `+${x.count} ` : ""}${x.name}</strong><small>${x.rarity} · ${x.description}</small></div></div>`,
      )
      .join("");
    const near = g.nearby();
    document.querySelector<HTMLElement>("#interact")!.innerHTML = near
      ? `<kbd>F</kbd> ${near.kind === "npc" ? "CONVERSAR" : near.kind === "chest" ? "ABRIR BAÚ" : near.interaction ? (near.name?.toUpperCase() ?? "INVESTIGAR") : near.kind === "statue" ? "AFINAR MARCO" : g.quest.rewardClaimed ? (near.locked ? (near.blockedReason?.toUpperCase() ?? "PASSAGEM BLOQUEADA") : `VIAJAR → ${REGIONS[PASSAGES.find((p) => p.region === g.world.region && p.id === near.id)?.destination ?? region.destination].name.toUpperCase()}`) : "SELO DE KHARN"}`
      : "";
    const toast = document.querySelector<HTMLElement>("#toast")!;
    toast.textContent = g.message;
    toast.classList.toggle("show", g.messageTimer > 0);
    document.querySelector("#save-state")!.textContent =
      g.saveStatus.toUpperCase();
    drawMinimap(
      this.minimap,
      g.world,
      p,
      g.enemies,
      g.exploration,
      g.activeObjective(),
      false,
      true,
      g.assets,
    );
  }
}
