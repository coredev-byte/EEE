import type { Game } from "./game";
/** DOM narrative layer leaves canvas pixels, world hit testing and the regular HUD intact. */
export class PrologueUI {
  element = document.createElement("section");
  private text(selector: string, value: string) {
    const element = this.element.querySelector(selector)!;
    if (element.textContent !== value) element.textContent = value;
  }
  constructor(readonly game: Game) {
    this.element.className = "prologue-layer";
    this.element.setAttribute("aria-label", "Prólogo e tutorial");
    this.element.innerHTML =
      '<div class="cinematic-caption" aria-live="polite"><small></small><strong></strong><p></p></div><button class="skip-cinematic">Pular cena · Enter</button><aside class="tutorial-hint" role="status"><p></p><button aria-label="Ocultar dica">×</button></aside>';
    document.querySelector(".game-viewport")!.append(this.element);
    this.element
      .querySelector(".skip-cinematic")!
      .addEventListener("click", () => game.skipCinematic());
    this.element
      .querySelector(".tutorial-hint button")!
      .addEventListener("click", () => {
        game.prologue.hints.reset();
        game.prologue.hints.quiet = 30;
      });
  }
  update() {
    const p = this.game.prologue,
      frame = this.game.cinematic.frame();
    const showing = this.game.started && !this.game.paused;
    this.element.hidden = !showing || (!p.active && !frame);
    document
      .querySelector(".game-shell")!
      .classList.toggle(
        "cinematic-active",
        showing && this.game.controlsLocked,
      );
    const caption =
        this.element.querySelector<HTMLElement>(".cinematic-caption")!,
      skip = this.element.querySelector<HTMLButtonElement>(".skip-cinematic")!,
      hint = this.element.querySelector<HTMLElement>(".tutorial-hint")!;
    caption.hidden = skip.hidden = !frame;
    if (frame) {
      this.text(".cinematic-caption small", frame.title);
      this.text(".cinematic-caption strong", frame.speaker);
      this.text(".cinematic-caption p", frame.text);
    }
    hint.hidden = !!frame || !p.hints.active;
    this.text(".tutorial-hint p", p.hints.active?.text ?? "");
    document
      .querySelectorAll(".tutorial-focus")
      .forEach((el) => el.classList.remove("tutorial-focus"));
    if (showing && !hint.hidden && p.hints.active?.target)
      document
        .querySelector(p.hints.active.target)
        ?.classList.add("tutorial-focus");
  }
}
