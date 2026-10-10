import { CLASSES, ITEMS, type ClassId } from "./data";
import { stats } from "./state";
import { inventoryPanel } from "./inventory";
import { load } from "./save";
import type { Game } from "./game";
const icon = (index: number, extra = "") =>
  `<span class="item-icon ${extra}" style="background-position:-${index * 48}px 0" aria-hidden="true"></span>`;
const button = (text: string, action: string, cls = "") =>
  `<button class="${cls}" data-action="${action}">${text}</button>`;
const titles: Record<string, string> = {
  inventory: "Inventário & equipamentos",
  skills: "Árvore de habilidades",
  classes: "Escolha seu caminho",
  settings: "Configurações",
  quests: "Diário de missões",
  pause: "A noite pode esperar",
};
export class UI {
  panel = "";
  lastHUD = 0;
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
   <main><div class="scene-label"><span><i class="live-dot"></i> VILA PEDRALTA</span><span>UM MUNDO EM RUÍNAS. SEU PRÓPRIO CAMINHO.</span></div>
   <section class="game-shell" aria-label="Distrito Zero, RPG de ação"><canvas id="game" width="960" height="540" tabindex="0" aria-label="Mundo do jogo: use WASD para mover, clique esquerdo para atacar e 1 a 4 para habilidades"></canvas>
   <div class="hud" id="hud"><section class="player-hud"><div class="portrait-frame"><canvas id="portrait" width="64" height="64"></canvas><span id="level">1</span></div><div class="bars"><div class="bar-row"><label>HP</label><div class="bar hp"><i id="hp-fill"></i><span id="hp-value"></span></div></div><div class="bar-row"><label>MP</label><div class="bar mp"><i id="mp-fill"></i><span id="mp-value"></span></div></div><div class="bar-row"><label>XP</label><div class="bar xp"><i id="xp-fill"></i><span id="xp-value"></span></div></div></div></section>
   <div class="location"><span class="location-mark"></span> VILA PEDRALTA <span>— SETOR LESTE</span></div><button class="quest-hud" data-panel="quests"><span class="quest-name"><span class="diamond"></span> O ECO DE KHARN</span><span id="quest-objective">Encontre a entrada das ruínas</span><small id="quest-progress">MISSÃO PRINCIPAL</small></button>
   <section class="minimap-box"><div class="map-label">PEDRALTA <span>N</span></div><canvas id="minimap" width="160" height="160" aria-label="Minimapa da vila"></canvas><div class="map-coordinates" id="coordinates"></div></section>
   <div class="skillbar" id="skillbar"></div><div class="quickbar" id="quickbar"></div><div class="interact" id="interact"></div><div class="toast" role="status" id="toast"></div><div class="class-name" id="class-name"></div></div>
   <div class="loading" id="loading"><div class="loading-rune"></div><span>DESPERTANDO PEDRALTA</span></div><div class="menu-layer" id="menu-layer"></div><div class="modal-layer" id="modal-layer" hidden></div>
   </section><div class="underbar"><span class="connection"><i class="live-dot"></i> <span id="save-state">SALVAMENTO LOCAL</span></span><div class="controls"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> MOVER</span><span><kbd>SHIFT</kbd> CORRER</span><span><kbd>MOUSE</kbd> ATACAR</span><span><kbd>F</kbd> INTERAGIR</span><span><kbd>ESC</kbd> PAUSA</span></div><button id="sound-toggle" aria-label="Alternar áudio">ÁUDIO · ON</button></div>
   </main><footer><span>DISTRITO ZERO <b> / </b> O ECO DE KHARN</span><span>AS RUÍNAS LEMBRAM. VOCÊ ESCOLHE.</span><span class="build">VERSÃO DE DESENVOLVIMENTO · 0.1</span></footer>`;
    this.minimap = document.querySelector("#minimap")!;
    this.modal = document.querySelector("#modal-layer")!;
    this.portrait = document.querySelector("#portrait")!;
    document.addEventListener("click", (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-action],[data-panel],[data-skill],[data-potion],[data-equip],[data-class],[data-unequip],[data-item],[data-filter]",
      );
      if (!el) return;
      if (el.dataset.panel) {
        if (game.started) this.open(el.dataset.panel);
      }
      if (el.dataset.skill !== undefined && !game.paused)
        game.combat.attack(game.target(), Number(el.dataset.skill));
      if (el.dataset.potion !== undefined && !game.paused)
        game.potion(Number(el.dataset.potion));
      if (el.dataset.item) {
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
    });
    document.querySelector("#sound-toggle")!.addEventListener("click", () => {
      game.audio.toggle();
      this.updateSound();
    });
    window.addEventListener(
      "keydown",
      (e) => {
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
    game.onUpdate = () => this.update();
    game.onMenu = (p) => {
      if (this.panel === "death") return;
      if (this.panel) this.close();
      else this.open(p);
    };
    game.onStart = () => {
      document.querySelector("#menu-layer")!.innerHTML = "";
      this.modal.hidden = true;
      this.panel = "";
      document.querySelector("#hud")!.classList.add("visible");
    };
    game.onDeath = () => {
      this.panel = "death";
      game.paused = true;
      this.renderPanel();
    };
  }
  ready() {
    document.querySelector("#loading")!.remove();
    this.drawPortrait();
    this.mainMenu();
  }
  mainMenu() {
    this.game.started = false;
    const saved = load();
    this.game.paused = true;
    document.querySelector("#hud")!.classList.remove("visible");
    document.querySelector("#menu-layer")!.innerHTML =
      `<div class="main-menu"><div class="menu-eyebrow"><span class="tiny-line"></span> UM NOVO ECO DESPERTA</div><h1>DISTRITO<br><span>ZERO<span class="title-dot">.</span></span></h1><p class="tagline">Um mundo em ruínas.<br>Novas escolhas. Seu próprio caminho.</p><div class="chapter"><span class="diamond"></span><div><small>CAPÍTULO I</small><strong>O Eco de Kharn</strong></div></div><div class="menu-actions">${saved ? button("CONTINUAR JORNADA <span>→</span>", "continue", "primary") : button("INICIAR JORNADA <span>→</span>", "new", "primary")}${saved ? button("NOVA JORNADA", "new", "secondary") : ""}${button("COMO JOGAR", "help", "text-button")}</div><span class="menu-note">RPG DE AÇÃO · PIXEL ART · QUATRO CAMINHOS</span></div><div class="menu-right"><div class="vertical-line"></div><span>VILA PEDRALTA — SETOR LESTE</span></div><div class="menu-version">CONSTRUÍDO NAS SOMBRAS. FORJADO EM ESCOLHAS.</div>`;
  }
  drawPortrait() {
    const c = this.portrait.getContext("2d")!;
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#101728";
    c.fillRect(0, 0, 64, 64);
    c.drawImage(this.game.assets.images.hero, 25, 32, 44, 40, 0, 0, 64, 64);
  }
  action(action: string) {
    const g = this.game;
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
      if (action === "compare") this.comparing = !this.comparing;
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
      g.start();
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
    this.panel = panel;
    this.confirmingDiscard = false;
    this.game.paused = true;
    this.game.input.keys.clear();
    this.renderPanel();
  }
  close() {
    this.panel = "";
    this.modal.hidden = true;
    document.querySelector(".game-shell")!.classList.remove("inventory-open");
    this.modal.classList.remove("inventory-layer");
    this.game.paused = !this.game.started || this.game.player.hp <= 0;
    this.game.input.keys.clear();
  }
  renderPanel() {
    const g = this.game,
      p = g.player;
    const inventory = ["inventory", "equipment"].includes(this.panel);
    this.modal.classList.toggle("inventory-layer", inventory);
    document
      .querySelector(".game-shell")!
      .classList.toggle("inventory-open", inventory);
    if (inventory) {
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
      content = `<div class="section-heading">${CLASSES[p.classId].name.toUpperCase()} <span>${p.skillPoints} PONTOS DISPONÍVEIS</span></div><p class="panel-intro">A cada nível, um novo ponto. As primeiras duas habilidades já estão disponíveis.</p><div class="skill-list">${CLASSES[p.classId].skills.map((skill, i) => `<div class="skill-detail ${i >= p.unlocked ? "locked" : ""}">${icon(skill.icon)}<div><small>HABILIDADE ${i + 1} <kbd>${"1234"[i]}</kbd></small><h3>${skill.name}</h3><p>${skill.description}</p><span>${skill.cost} MP · ${skill.cooldown}s RECARGA · ${skill.damage ? `${skill.damage} ${skill.kind === "heal" ? "CURA" : "DANO BASE"}` : "75% REDUÇÃO DE DANO"}</span></div><span class="skill-state">${i < p.unlocked ? "DESBLOQUEADA" : "BLOQUEADA"}</span></div>`).join("")}</div>${button(p.unlocked >= 4 ? "TODAS DESBLOQUEADAS" : p.skillPoints > 0 ? "DESBLOQUEAR PRÓXIMA HABILIDADE" : "EVOLUA PARA GANHAR UM PONTO", "unlock", "primary")}`;
    }
    if (this.panel === "quests") {
      content = `<div class="quest-detail"><div class="quest-stamp"><span class="diamond"></span> MISSÃO PRINCIPAL · CAPÍTULO I</div><h3>O Eco de Kharn</h3><p>Há algo vivo sob as pedras de Pedralta. A guardiã fala de um eco — uma memória que a vila tentou enterrar. Encontre o selo nas ruínas a nordeste e descubra o que ainda responde.</p><ol class="quest-steps"><li class="${g.quest.stage >= 1 ? "done" : "active"}">Encontrar a entrada das ruínas <span>${g.quest.stage >= 1 ? "CONCLUÍDO" : "EM ANDAMENTO"}</span></li><li class="${g.quest.kills >= 3 ? "done" : g.quest.stage === 1 ? "active" : ""}">Derrotar três ameaças da vila <span>${Math.min(3, g.quest.kills)} / 3</span></li><li class="${g.quest.stage === 2 ? "done" : g.quest.stage === 1 && g.quest.kills >= 3 ? "active" : ""}">Interagir com o selo de Kharn <span>${g.quest.stage === 2 ? "CONCLUÍDO" : "TECLA F"}</span></li></ol><div class="rewards"><small>RECOMPENSAS</small><span>200 XP</span><span>250 MOEDAS</span><span>${icon(3)} MEMÓRIA DE KHARN</span></div>${g.quest.stage === 2 ? '<div class="completed-banner">O ECO FOI OUVIDO. MISSÃO CONCLUÍDA.</div>' : ""}</div>`;
    }
    if (this.panel === "settings") {
      content = `<div class="settings-list"><div><span><strong>Áudio de desenvolvimento</strong><small>Sons e drone sintetizados temporários. Não são a trilha final.</small></span>${button(g.audio.enabled ? "LIGADO" : "DESLIGADO", "sound", "secondary")}</div><div><span><strong>Tela cheia</strong><small>Resolução lógica 960 × 540; ampliação nearest-neighbor.</small></span>${button("ALTERNAR", "fullscreen", "secondary")}</div><div><span><strong>Salvamento local</strong><small>Automático a cada 8 segundos e após recompensas e equipamentos.</small></span>${button("SALVAR AGORA", "save", "secondary")}</div></div><p class="subtle">${g.saveStatus}. O progresso pertence a este navegador; limpar os dados do site remove o salvamento.</p>${this.helpContent()}`;
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
    this.modal.hidden = false;
    this.modal.innerHTML = `<section class="panel panel-${this.panel}" role="dialog" aria-modal="true" aria-label="${title}"><div class="panel-top"><div><small>${eyebrow}</small><h2>${title}</h2></div>${this.panel === "death" ? "" : button("×", "close", "close-button")}</div>${content}<div class="panel-footer"><span>VILA PEDRALTA — SETOR LESTE</span><span>${this.game.started ? "O MUNDO ESTÁ PAUSADO" : "ESCOLHA O SEU CAMINHO"}</span></div></section>`;
  }
  helpContent() {
    return `<div class="section-heading">CONTROLES DA JORNADA</div><div class="help-grid"><div><kbd>W A S D</kbd><span>Mover o personagem</span></div><div><kbd>SHIFT</kbd><span>Correr</span></div><div><kbd>CLIQUE ESQUERDO</kbd><span>Ataque básico · mire com o mouse</span></div><div><kbd>1 2 3 4</kbd><span>Habilidades da classe</span></div><div><kbd>Z / X / V</kbd><span>Vida / mana / elixir</span></div><div><kbd>F</kbd><span>Conversar, abrir baú, entrar nas ruínas</span></div><div><kbd>I / C / K / J</kbd><span>Inventário / classes / habilidades / diário</span></div><div><kbd>M / ESC</kbd><span>Configurações / pausar</span></div></div><p class="subtle">O diamante dourado do minimapa marca a entrada das ruínas. Baús guardam equipamentos. Inimigos concedem experiência e moedas. WASD move o personagem; 1–4 ativa habilidades; Z, X e V usam poções.</p>`;
  }
  updateSound() {
    document.querySelector("#sound-toggle")!.textContent =
      `ÁUDIO · ${this.game.audio.enabled ? "ON" : "OFF"}`;
  }
  update() {
    const now = performance.now();
    if (now - this.lastHUD < 80) return;
    this.lastHUD = now;
    const g = this.game,
      p = g.player,
      s = stats(p);
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
    document.querySelector("#coordinates")!.textContent =
      `${p.x.toFixed(1)} · ${p.y.toFixed(1)}  /  SETOR LESTE`;
    document.querySelector("#quest-objective")!.textContent =
      g.quest.stage === 0
        ? "Encontre a entrada das ruínas"
        : g.quest.stage === 2
          ? "O selo foi rompido. O eco foi ouvido."
          : g.quest.kills >= 3
            ? "Atravesse o selo de Kharn · F"
            : `Silencie as ameaças da vila · ${Math.min(3, g.quest.kills)}/3`;
    document.querySelector("#quest-progress")!.textContent =
      g.quest.stage === 2 ? "MISSÃO CONCLUÍDA" : "MISSÃO PRINCIPAL";
    document.querySelector("#class-name")!.innerHTML =
      `<span>${CLASSES[p.classId].name.toUpperCase()}</span><i></i><span>${p.coins.toLocaleString("pt-BR")} MOEDAS</span>`;
    document.querySelector("#skillbar")!.innerHTML = CLASSES[p.classId].skills
      .map(
        (skill, i) =>
          `<button class="ability ${i >= p.unlocked ? "locked" : ""} ${p.mp < skill.cost ? "no-mana" : ""}" data-skill="${i}" title="${skill.name} — ${skill.description}" aria-label="${skill.name}">${icon(skill.icon)}<span class="ability-cooldown" style="height:${(p.cooldowns[i] / skill.cooldown) * 100}%"></span>${p.cooldowns[i] > 0 ? `<strong class="cooldown-count">${p.cooldowns[i].toFixed(1)}</strong>` : ""}${i >= p.unlocked ? '<span class="lock-mark">×</span>' : ""}<kbd>${"1234"[i]}</kbd></button>`,
      )
      .join("");
    document.querySelector("#quickbar")!.innerHTML =
      p.potions
        .map(
          (count, i) =>
            `<button class="ability potion" data-potion="${i}" title="${["Poção de vida +100 HP", "Poção de mana +70 MP", "Elixir +50 HP / +40 MP"][i]}" aria-label="${["Poção de vida", "Poção de mana", "Elixir"][i]}">${icon(i + 4)}<strong class="item-count">${count}</strong><kbd>${"ZXV"[i]}</kbd></button>`,
        )
        .join("") +
      `<button class="ability menu-key" data-panel="inventory" title="Inventário">${icon(7)}<kbd>I</kbd></button>`;
    const near = g.nearby();
    document.querySelector<HTMLElement>("#interact")!.innerHTML = near
      ? `<kbd>F</kbd> ${near.kind === "npc" ? "CONVERSAR" : near.kind === "chest" ? "ABRIR BAÚ" : "SELO DE KHARN"}`
      : "";
    const toast = document.querySelector<HTMLElement>("#toast")!;
    toast.textContent = g.message;
    toast.classList.toggle("show", g.messageTimer > 0);
    document.querySelector("#save-state")!.textContent =
      g.saveStatus.toUpperCase();
    g.renderer.drawMini(this.minimap, p, g.enemies);
  }
}
