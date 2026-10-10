import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/800.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";
import "./style.css";
import { Game } from "./game";
import { UI } from "./ui";
const game = new Game();
const ui = new UI(game);
void game
  .init()
  .then(() => ui.ready())
  .catch((error) => {
    console.error(error);
    document.querySelector("#loading")!.innerHTML =
      "<p>Não foi possível carregar os assets. Recarregue a página e verifique o console.</p>";
  });
window.addEventListener("pagehide", (event) => {
  if (game.started) game.save();
  if (event.persisted) game.audio.setHidden(true);
  else game.audio.dispose();
});
document.addEventListener("visibilitychange", () =>
  game.audio.setHidden(document.hidden),
);
// Read-only runtime inspection for smoke tests and development tools.
Object.defineProperty(window, "__DZ", {
  value: {
    snapshot: () => game.snapshot(),
    project: (p: { x: number; y: number }) => game.renderer.project(p),
  },
  writable: false,
});

window.addEventListener("pageshow", (event) => {
  if (event.persisted) game.audio.setHidden(document.hidden);
});
