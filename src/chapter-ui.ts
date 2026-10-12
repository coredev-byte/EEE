import type { Game } from "./game";
import { KHARN_ID } from "./chapter-data";
export class ChapterUI {
  element = document.createElement("section");
  prompt = document.createElement("button");
  lastHp = -1;
  constructor(readonly game: Game) {
    this.element.className = "boss-hud";
    this.element.setAttribute("aria-label", "Vida e fase de Kharn");
    this.element.innerHTML =
      '<strong>KHARN</strong><small>O GUARDIÃO</small><div class="boss-life" role="progressbar" aria-label="Vida de Kharn"><i></i><span></span></div><p></p>';
    document.querySelector("#hud")!.append(this.element);
    this.prompt.className = "arena-prompt";
    this.prompt.textContent = "Atravessar o salão · F";
    this.prompt.hidden = true;
    this.prompt.addEventListener("click", () => {
      if (!game.paused && !game.controlsLocked) {
        game.audio.unlock();
        game.interact();
      }
    });
    document.querySelector("#hud")!.append(this.prompt);
  }
  update() {
    const g = this.game,
      e = g.enemies.find((e) => e.id === KHARN_ID),
      active = g.started && g.chapter.fighting && !!e && e.hp > 0;
    this.prompt.hidden = !(
      g.started &&
      !g.paused &&
      !g.controlsLocked &&
      g.nearby()?.interaction === "arena" &&
      g.chapter.state.arena === "ready"
    );
    this.element.hidden = !active;
    document
      .querySelector(".game-shell")!
      .classList.toggle("boss-active", active);
    if (!active || !e) return;
    const bar = this.element.querySelector<HTMLElement>(".boss-life")!;
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", String(e.maxHp));
    bar.setAttribute("aria-valuenow", String(e.hp));
    this.element.querySelector<HTMLElement>("i")!.style.width =
      `${(100 * e.hp) / e.maxHp}%`;
    this.element.querySelector("span")!.textContent = `${e.hp} / ${e.maxHp}`;
    this.element.querySelector("p")!.textContent =
      `${["I · O Guardião", "II · O Despertar", "III · O Último Dever"][(e.phase ?? 1) - 1]}`;
    if (this.lastHp !== e.hp) {
      this.element.classList.remove("boss-hit");
      void this.element.offsetWidth;
      this.element.classList.add("boss-hit");
      this.lastHp = e.hp;
    }
  }
}
